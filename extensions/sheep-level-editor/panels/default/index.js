'use strict';

const fs = require('fs');
const path = require('path');
const generator = require('../../lib/sheep-level-generator');

const LEVEL_CONFIG_ASSET_URL = 'db://assets/subpackages/game/config/sheep_levels.json';
const LEVEL_CONFIG_FILE_PATH = path.join('assets', 'subpackages', 'game', 'config', 'sheep_levels.json');
const PREVIEW_CELL_SIZE = 40;
const DEFAULT_EDITOR_TYPE_CONFIGS = {
    normal: {
        resource: 'texture/sheep/spriteFrame',
        vertical: { rowSpan: 2, colSpan: 1 },
        horizontal: { rowSpan: 1, colSpan: 2 },
    },
    black: {
        resource: 'texture/sheepblack/spriteFrame',
        vertical: { rowSpan: 2, colSpan: 1 },
        horizontal: { rowSpan: 1, colSpan: 2 },
    },
};

function getProjectPath() {
    return Editor.Project && Editor.Project.path ? Editor.Project.path : process.cwd();
}

function getLevelConfigPath() {
    return path.join(getProjectPath(), LEVEL_CONFIG_FILE_PATH);
}

module.exports = Editor.Panel.define({
    template: fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'),
    style: fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8'),
    $: {
        level: '#level',
        typeCounts: '#type-counts',
        requireSolvable: '#require-solvable',
        fenceCount: '#fence-count',
        fenceEliminate: '#fence-eliminate',
        editMode: '#edit-mode',
        placeType: '#place-type',
        placeDirection: '#place-direction',
        addFence: '#add-fence',
        fenceList: '#fence-list',
        generate: '#generate',
        view: '#view',
        save: '#save',
        reload: '#reload',
        clear: '#clear',
        status: '#status',
        layout: '#layout',
    },
    ready() {
        this.levelFile = null;
        this.currentLevel = null;

        this.$.generate.addEventListener('confirm', () => this.generateLevel());
        this.$.generate.addEventListener('click', () => this.generateLevel());
        this.$.view.addEventListener('confirm', () => this.viewLevel());
        this.$.view.addEventListener('click', () => this.viewLevel());
        this.$.save.addEventListener('confirm', () => this.saveLevel());
        this.$.save.addEventListener('click', () => this.saveLevel());
        this.$.reload.addEventListener('confirm', () => this.loadLevelFile());
        this.$.reload.addEventListener('click', () => this.loadLevelFile());
        this.$.clear.addEventListener('confirm', () => this.clearLevelSheep());
        this.$.clear.addEventListener('click', () => this.clearLevelSheep());
        this.$.editMode.addEventListener('change', () => this.onEditModeChange());
        this.$.addFence.addEventListener('confirm', () => this.addFence());
        this.$.addFence.addEventListener('click', () => this.addFence());

        this.loadLevelFile();
        this.populatePlaceTypeOptions();
    },
    methods: {
        loadLevelFile() {
            const filePath = getLevelConfigPath();
            if (!fs.existsSync(filePath)) {
                this.levelFile = {
                    sheepTypeConfigs: {
                        normal: {
                            resource: 'texture/sheep/spriteFrame',
                            vertical: { rowSpan: 2, colSpan: 1 },
                            horizontal: { rowSpan: 1, colSpan: 2 },
                        },
                        black: {
                            resource: 'texture/sheepblack/spriteFrame',
                            vertical: { rowSpan: 2, colSpan: 1 },
                            horizontal: { rowSpan: 1, colSpan: 2 },
                        },
                    },
                    levels: [],
                };
                this.setStatus(`未找到关卡文件，将在保存时创建：${LEVEL_CONFIG_FILE_PATH}`);
                this.renderLayout('');
                this.populatePlaceTypeOptions();
                return;
            }

            try {
                const json = fs.readFileSync(filePath, 'utf8');
                this.levelFile = JSON.parse(json);
                this.levelFile.sheepTypeConfigs = this.levelFile.sheepTypeConfigs || {};
                this.levelFile.levels = Array.isArray(this.levelFile.levels) ? this.levelFile.levels : [];
                this.setStatus(`已加载关卡文件，共 ${this.levelFile.levels.length} 关`);
                this.populatePlaceTypeOptions();
            } catch (error) {
                this.levelFile = null;
                this.setStatus(`读取关卡文件失败：${error.message}`);
            }
        },

        generateLevel() {
            if (!this.ensureLevelFile()) return;

            try {
                const level = this.getLevelInput();
                const typeCounts = this.parseTypeCounts();
                const targetCount = typeCounts.reduce((sum, item) => sum + item.count, 0);
                const requireSolvable = this.isRequireSolvable();
                const fenceCount = this.parseFenceCount();
                const fenceEliminateCount = this.parseFenceEliminateCount();
                const typeConfigs = this.getGeneratorTypeConfigs();
                const options = { requireSolvable, fenceCount };
                if (fenceEliminateCount !== null) {
                    options.fenceEliminateCount = fenceEliminateCount;
                }
                this.currentLevel = generator.generateLevel(level, typeCounts, typeConfigs, options);
                const solveText = this.isLevelSolvable(this.currentLevel, typeConfigs) ? '有解' : '无解';
                console.log('[sheep-level-editor] 生成结果：', JSON.stringify(this.currentLevel, null, 2));
                this.renderLevel(this.currentLevel);
                const fenceText = this.currentLevel.fences && this.currentLevel.fences.length
                    ? `，围挡 ${this.currentLevel.fences.length}`
                    : '';
                this.setStatus(`生成成功：第 ${level} 关，数量 ${this.currentLevel.sheep.length}/${targetCount}${fenceText}，${solveText}`);
            } catch (error) {
                console.error('[sheep-level-editor] 生成失败：', error);
                this.setStatus(`生成失败：${error.message}`);
            }
        },

        viewLevel() {
            if (!this.ensureLevelFile()) return;

            const level = this.getLevelInput();
            const levelData = this.levelFile.levels.find((item) => Number(item.level) === level);
            if (!levelData) {
                this.currentLevel = null;
                this.renderLayout('');
                this.setStatus(`第 ${level} 关没有数据`);
                return;
            }

            this.currentLevel = levelData;
            this.renderLevel(levelData);
            const fenceText = levelData.fences && levelData.fences.length
                ? `，围挡 ${levelData.fences.length}`
                : '';
            this.setStatus(`正在查看第 ${level} 关，数量 ${levelData.sheep.length}${fenceText}`);
        },

        saveLevel() {
            if (!this.ensureLevelFile()) return;
            if (!this.currentLevel) {
                this.setStatus('请先生成或查看一个关卡');
                return;
            }

            const typeConfigs = this.getGeneratorTypeConfigs();
            if (this.isRequireSolvable() && !this.isLevelSolvable(this.currentLevel, typeConfigs)) {
                this.setStatus(`保存失败：第 ${this.currentLevel.level} 关不可解`);
                return;
            }

            const levels = this.levelFile.levels.filter((item) => Number(item.level) !== Number(this.currentLevel.level));
            levels.push(this.currentLevel);
            levels.sort((a, b) => Number(a.level) - Number(b.level));
            this.levelFile.levels = levels;

            try {
                const filePath = getLevelConfigPath();
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, `${JSON.stringify(this.levelFile, null, 2)}\n`, 'utf8');
                this.refreshAsset();
                this.setStatus(`已保存第 ${this.currentLevel.level} 关到 ${LEVEL_CONFIG_FILE_PATH}`);
            } catch (error) {
                this.setStatus(`保存失败：${error.message}`);
            }
        },

        ensureLevelFile() {
            if (!this.levelFile) {
                this.loadLevelFile();
            }
            return !!this.levelFile;
        },

        getLevelInput() {
            const value = Number(this.$.level.value);
            if (!Number.isFinite(value) || value <= 0) {
                throw new Error('关卡数必须是大于 0 的数字');
            }
            return Math.floor(value);
        },

        parseTypeCounts() {
            const value = String(this.$.typeCounts.value || '').trim();
            if (!value) {
                throw new Error('请填写小羊种类及数量');
            }

            const typeCounts = value.split(',').map((segment) => {
                const [typeValue, countValue] = segment.split(':').map((item) => String(item || '').trim());
                const count = Number(countValue);
                if (!typeValue || !Number.isFinite(count) || count < 0) {
                    throw new Error(`格式错误：${segment}`);
                }

                return {
                    type: typeValue,
                    count: Math.floor(count),
                };
            }).filter((item) => item.count > 0);

            if (typeCounts.length <= 0) {
                throw new Error('小羊总数量必须大于 0');
            }

            return typeCounts;
        },

        isRequireSolvable() {
            return !!this.$.requireSolvable.checked;
        },

        parseFenceCount() {
            const value = Number(this.$.fenceCount.value);
            if (!Number.isFinite(value) || value < 0) {
                throw new Error('围挡数量必须是大于等于 0 的数字');
            }
            return Math.floor(value);
        },

        parseFenceEliminateCount() {
            const raw = String(this.$.fenceEliminate.value || '').trim();
            if (!raw) return null;
            const value = Number(raw);
            if (!Number.isFinite(value) || value < 1) {
                throw new Error('围挡消除数必须是大于 0 的数字，留空则自动');
            }
            return Math.floor(value);
        },

        isLevelSolvable(levelData, typeConfigs) {
            if (levelData.fences && levelData.fences.length) {
                return generator.canSolveLevelWithFences(levelData, typeConfigs);
            }
            return generator.canSolveLevel(levelData, typeConfigs);
        },

        isEditMode() {
            return !!this.$.editMode.checked;
        },

        getPlaceType() {
            const value = String(this.$.placeType.value || '').trim();
            return value || generator.DEFAULT_TYPE;
        },

        getPlaceDirection() {
            const value = String(this.$.placeDirection.value || '').trim();
            return ['Up', 'Right', 'Down', 'Left'].includes(value) ? value : 'Up';
        },

        populatePlaceTypeOptions() {
            const typeConfigs = this.getGeneratorTypeConfigs();
            const types = Object.keys(typeConfigs);
            if (types.length <= 0) {
                types.push(generator.DEFAULT_TYPE);
            }
            const select = this.$.placeType;
            const previous = String(select.value || '').trim();
            select.innerHTML = '';
            types.forEach((type) => {
                const option = document.createElement('option');
                option.setAttribute('value', type);
                option.textContent = type;
                select.appendChild(option);
            });
            select.value = types.includes(previous) ? previous : types[0];
        },

        onEditModeChange() {
            if (this.isEditMode()) {
                this.ensureEditableLevel();
            }
            if (this.currentLevel) {
                this.renderLevel(this.currentLevel);
            }
        },

        ensureEditableLevel() {
            if (this.currentLevel) return this.currentLevel;
            let level = 1;
            try {
                level = this.getLevelInput();
            } catch (error) {
                this.setStatus(`关卡号无效，使用默认 1：${error.message}`);
            }
            this.currentLevel = {
                level,
                rowCount: generator.ROW_COUNT,
                colCount: generator.COL_COUNT,
                sheep: [],
            };
            return this.currentLevel;
        },

        onBoardCellClick(row, col) {
            if (!this.isEditMode()) return;
            const levelData = this.ensureEditableLevel();
            const typeConfigs = this.getGeneratorTypeConfigs();
            const rows = Number(levelData.rowCount) || generator.ROW_COUNT;
            const cols = Number(levelData.colCount) || generator.COL_COUNT;
            const sheepList = Array.isArray(levelData.sheep) ? levelData.sheep : (levelData.sheep = []);

            const existingIndex = sheepList.findIndex((sheep) => {
                const footprint = this.getFootprint(sheep.direction, sheep.type, typeConfigs);
                return this.cellInRect(row, col, sheep.row, sheep.col, footprint.rowSpan, footprint.colSpan);
            });
            if (existingIndex >= 0) {
                sheepList.splice(existingIndex, 1);
                this.renderLevel(levelData);
                this.setStatus(`已移除 (${row}, ${col}) 处小羊，剩余 ${sheepList.length}`);
                return;
            }

            const direction = this.getPlaceDirection();
            const type = this.getPlaceType();
            const footprint = this.getFootprint(direction, type, typeConfigs);
            if (row + footprint.rowSpan > rows || col + footprint.colSpan > cols) {
                this.setStatus(`放不下：超出边界 (${row}, ${col})`);
                return;
            }
            const overlap = sheepList.some((sheep) => {
                const sheepFootprint = this.getFootprint(sheep.direction, sheep.type, typeConfigs);
                return this.rectsOverlap(
                    row, col, footprint.rowSpan, footprint.colSpan,
                    sheep.row, sheep.col, sheepFootprint.rowSpan, sheepFootprint.colSpan,
                );
            });
            if (overlap) {
                this.setStatus(`放不下：与已有小羊重叠 (${row}, ${col})`);
                return;
            }

            sheepList.push({ row, col, direction, type });
            this.renderLevel(levelData);
            this.setStatus(`已放置 ${type} ${direction} 于 (${row}, ${col})，共 ${sheepList.length}`);
        },

        clearLevelSheep() {
            if (!this.ensureLevelFile()) return;
            const levelData = this.ensureEditableLevel();
            levelData.sheep = [];
            this.renderLevel(levelData);
            this.setStatus('已清空小羊，可手动放置');
        },

        cellInRect(row, col, rectRow, rectCol, rowSpan, colSpan) {
            return row >= rectRow && row < rectRow + rowSpan
                && col >= rectCol && col < rectCol + colSpan;
        },

        rectsOverlap(aRow, aCol, aRowSpan, aColSpan, bRow, bCol, bRowSpan, bColSpan) {
            return aRow < bRow + bRowSpan && aRow + aRowSpan > bRow
                && aCol < bCol + bColSpan && aCol + aColSpan > bCol;
        },

        renderFenceList(levelData) {
            const container = this.$.fenceList;
            container.innerHTML = '';
            if (!levelData) return;
            const fences = Array.isArray(levelData.fences) ? levelData.fences : (levelData.fences = []);
            if (fences.length <= 0) {
                const empty = document.createElement('div');
                empty.className = 'hint';
                empty.textContent = '暂无围挡，点「添加围挡」新建一个';
                container.appendChild(empty);
                return;
            }
            fences.forEach((fence, index) => {
                const row = document.createElement('div');
                row.className = 'fence-row';
                row.appendChild(this.createFenceInput(index, 'row', fence.row, '行'));
                row.appendChild(this.createFenceInput(index, 'col', fence.col, '列'));
                row.appendChild(this.createFenceInput(index, 'rowSpan', fence.rowSpan, '高'));
                row.appendChild(this.createFenceInput(index, 'colSpan', fence.colSpan, '宽'));
                row.appendChild(this.createFenceInput(index, 'eliminateCount', fence.eliminateCount, '消除数'));
                const del = document.createElement('button');
                del.type = 'button';
                del.textContent = '删除';
                del.className = 'fence-delete';
                del.addEventListener('click', () => this.removeFenceAt(index));
                row.appendChild(del);
                container.appendChild(row);
            });
        },

        createFenceInput(index, key, value, label) {
            const wrap = document.createElement('label');
            wrap.className = 'fence-field';
            const span = document.createElement('span');
            span.textContent = label;
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.step = '1';
            input.value = Number(value) || 0;
            input.addEventListener('change', () => this.onFenceInputChange(index, key, input.value));
            wrap.appendChild(span);
            wrap.appendChild(input);
            return wrap;
        },

        onFenceInputChange(index, key, raw) {
            const levelData = this.currentLevel;
            if (!levelData || !Array.isArray(levelData.fences)) return;
            const fence = levelData.fences[index];
            if (!fence) return;
            const value = Math.max(0, Math.floor(Number(raw) || 0));
            if (key === 'rowSpan' || key === 'colSpan') {
                fence[key] = Math.max(1, value);
            } else {
                fence[key] = value;
            }
            this.renderLevel(levelData);
        },

        addFence() {
            if (!this.ensureLevelFile()) return;
            const levelData = this.ensureEditableLevel();
            const fences = Array.isArray(levelData.fences) ? levelData.fences : (levelData.fences = []);
            const sheepCount = (levelData.sheep || []).length;
            const eliminateCount = Math.max(1, Math.floor(sheepCount * 0.5));
            fences.push({ row: 6, col: 4, rowSpan: 3, colSpan: 3, eliminateCount });
            this.renderLevel(levelData);
            this.setStatus(`已添加围挡 ${fences.length}，调整行/列/高/宽/消除数后保存`);
        },

        removeFenceAt(index) {
            const levelData = this.currentLevel;
            if (!levelData || !Array.isArray(levelData.fences)) return;
            levelData.fences.splice(index, 1);
            this.renderLevel(levelData);
            this.setStatus(`已删除围挡 ${index + 1}`);
        },

        getGeneratorTypeConfigs() {
            const configs = this.levelFile && this.levelFile.sheepTypeConfigs ? this.levelFile.sheepTypeConfigs : {};
            return {
                ...generator.DefaultTypeConfigs,
                ...DEFAULT_EDITOR_TYPE_CONFIGS,
                ...configs,
            };
        },

        renderLevel(levelData) {
            const rows = Number(levelData.rowCount) || generator.ROW_COUNT;
            const cols = Number(levelData.colCount) || generator.COL_COUNT;
            this.$.layout.innerHTML = '';

            const summary = document.createElement('div');
            summary.className = 'level-summary';
            summary.textContent = `关卡：${levelData.level}    行列：${rows} x ${cols}    数量：${levelData.sheep.length}`;
            this.$.layout.appendChild(summary);

            const board = document.createElement('div');
            board.className = 'level-board';
            if (this.isEditMode()) {
                board.classList.add('editable');
            }
            board.style.setProperty('--rows', String(rows));
            board.style.setProperty('--cols', String(cols));
            this.$.layout.appendChild(board);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'level-cell';
                    cell.style.gridRow = `${row + 1} / span 1`;
                    cell.style.gridColumn = `${col + 1} / span 1`;
                    cell.addEventListener('click', () => this.onBoardCellClick(row, col));
                    board.appendChild(cell);
                }
            }

            this.renderSheepImages(board, levelData, rows, cols);
            this.renderFences(board, levelData);
            this.renderFenceList(levelData);
        },

        renderFences(board, levelData) {
            const fences = levelData.fences || [];
            fences.forEach((fence, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'fence-preview';
                wrapper.title = `围挡${index + 1} (${fence.row}, ${fence.col}) 消除${fence.eliminateCount}只后解锁`;
                wrapper.style.gridRow = `${fence.row + 1} / span ${fence.rowSpan}`;
                wrapper.style.gridColumn = `${fence.col + 1} / span ${fence.colSpan}`;
                wrapper.textContent = `围挡${index + 1}：${fence.eliminateCount}`;
                board.appendChild(wrapper);
            });
        },

        renderSheepImages(board, levelData, rows, cols) {
            const typeConfigs = this.getGeneratorTypeConfigs();
            levelData.sheep.forEach((sheep) => {
                const footprint = this.getFootprint(sheep.direction, sheep.type, typeConfigs);
                if (sheep.row < 0 || sheep.col < 0 || sheep.row + footprint.rowSpan > rows || sheep.col + footprint.colSpan > cols) {
                    return;
                }

                const wrapper = document.createElement('div');
                wrapper.className = 'sheep-preview';
                wrapper.title = `${sheep.type || generator.DEFAULT_TYPE} ${sheep.direction} (${sheep.row}, ${sheep.col})`;
                wrapper.style.gridRow = `${sheep.row + 1} / span ${footprint.rowSpan}`;
                wrapper.style.gridColumn = `${sheep.col + 1} / span ${footprint.colSpan}`;

                const image = document.createElement('img');
                image.src = this.getSheepImageUrl(sheep.type, typeConfigs);
                this.applySheepImageSize(image, sheep.type, typeConfigs);
                image.style.transform = `rotate(${this.getDirectionRotation(sheep.direction)}deg)`;
                wrapper.appendChild(image);
                board.appendChild(wrapper);
            });
        },

        getFootprint(direction, type, typeConfigs) {
            const config = typeConfigs[type || generator.DEFAULT_TYPE] || typeConfigs[generator.DEFAULT_TYPE];
            if (direction === 'Left' || direction === 'Right') {
                return config.horizontal;
            }

            return config.vertical;
        },

        applySheepImageSize(image, type, typeConfigs) {
            const config = typeConfigs[type || generator.DEFAULT_TYPE] || typeConfigs[generator.DEFAULT_TYPE];
            const vertical = config.vertical;
            image.style.width = `${vertical.colSpan * PREVIEW_CELL_SIZE}px`;
            image.style.height = `${vertical.rowSpan * PREVIEW_CELL_SIZE}px`;
        },

        getSheepImageUrl(type, typeConfigs) {
            const config = typeConfigs[type || generator.DEFAULT_TYPE] || typeConfigs[generator.DEFAULT_TYPE];
            const resource = config && config.resource ? config.resource : DEFAULT_EDITOR_TYPE_CONFIGS.normal.resource;
            const assetPath = this.resolveResourceFilePath(resource);
            return this.toFileUrl(assetPath);
        },

        resolveResourceFilePath(resource) {
            const resourcePath = String(resource || '').replace(/\\/g, '/').replace(/\/spriteFrame$/, '');
            const baseDirs = [
                path.join('assets', 'subpackages', 'game'),
                path.join('assets', 'resources'),
            ];
            for (const baseDir of baseDirs) {
                const found = this.resolveFileInDir(baseDir, resourcePath);
                if (found) return found;
            }
            return path.join(getProjectPath(), baseDirs[0], `${resourcePath}.png`);
        },

        resolveFileInDir(baseDir, resourcePath) {
            const basePath = path.join(getProjectPath(), baseDir, resourcePath);
            const ext = path.extname(basePath);
            if (ext && fs.existsSync(basePath)) {
                return basePath;
            }
            const candidates = ['.png', '.jpg', '.jpeg', '.webp', '.Png'];
            for (const candidateExt of candidates) {
                const candidatePath = `${basePath}${candidateExt}`;
                if (fs.existsSync(candidatePath)) {
                    return candidatePath;
                }
            }
            return null;
        },

        toFileUrl(filePath) {
            return `file:///${filePath.replace(/\\/g, '/')}`;
        },

        getDirectionRotation(direction) {
            if (direction === 'Right') return 90;
            if (direction === 'Down') return 180;
            if (direction === 'Left') return -90;
            return 0;
        },

        refreshAsset() {
            if (Editor.Message && Editor.Message.send) {
                Editor.Message.send('asset-db', 'refresh-asset', LEVEL_CONFIG_ASSET_URL);
            }
        },

        setStatus(text) {
            this.$.status.value = text;
        },

        renderLayout(text) {
            this.$.layout.textContent = text;
        },
    },
});
