'use strict';

const fs = require('fs');
const path = require('path');
const generator = require('../../lib/sheep-level-generator');

const LEVEL_CONFIG_ASSET_URL = 'db://assets/resources/config/sheep_levels.json';
const LEVEL_CONFIG_FILE_PATH = path.join('assets', 'resources', 'config', 'sheep_levels.json');
const PREVIEW_CELL_SIZE = 40;
const DEFAULT_EDITOR_TYPE_CONFIGS = {
    normal: {
        resource: 'texture/sheep/spriteFrame',
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
        generate: '#generate',
        view: '#view',
        save: '#save',
        reload: '#reload',
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

        this.loadLevelFile();
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
                    },
                    levels: [],
                };
                this.setStatus(`未找到关卡文件，将在保存时创建：${LEVEL_CONFIG_FILE_PATH}`);
                this.renderLayout('');
                return;
            }

            try {
                const json = fs.readFileSync(filePath, 'utf8');
                this.levelFile = JSON.parse(json);
                this.levelFile.sheepTypeConfigs = this.levelFile.sheepTypeConfigs || {};
                this.levelFile.levels = Array.isArray(this.levelFile.levels) ? this.levelFile.levels : [];
                this.setStatus(`已加载关卡文件，共 ${this.levelFile.levels.length} 关`);
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
                this.currentLevel = generator.generateLevel(level, typeCounts, this.getGeneratorTypeConfigs());
                console.log('[sheep-level-editor] 生成结果：', JSON.stringify(this.currentLevel, null, 2));
                this.renderLevel(this.currentLevel);
                this.setStatus(`生成成功：第 ${level} 关，数量 ${this.currentLevel.sheep.length}/${targetCount}`);
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
            this.setStatus(`正在查看第 ${level} 关，数量 ${levelData.sheep.length}`);
        },

        saveLevel() {
            if (!this.ensureLevelFile()) return;
            if (!this.currentLevel) {
                this.setStatus('请先生成或查看一个关卡');
                return;
            }

            const typeConfigs = this.getGeneratorTypeConfigs();
            if (!generator.canSolveLevel(this.currentLevel, typeConfigs)) {
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

            return value.split(',').map((segment) => {
                const [typeValue, countValue] = segment.split(':').map((item) => String(item || '').trim());
                const count = Number(countValue);
                if (!typeValue || !Number.isFinite(count) || count <= 0) {
                    throw new Error(`格式错误：${segment}`);
                }

                return {
                    type: typeValue,
                    count: Math.floor(count),
                };
            });
        },

        getGeneratorTypeConfigs() {
            const configs = this.levelFile && this.levelFile.sheepTypeConfigs ? this.levelFile.sheepTypeConfigs : {};
            return {
                ...DEFAULT_EDITOR_TYPE_CONFIGS,
                ...generator.DefaultTypeConfigs,
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
            board.style.setProperty('--rows', String(rows));
            board.style.setProperty('--cols', String(cols));
            this.$.layout.appendChild(board);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'level-cell';
                    cell.style.gridRow = `${row + 1} / span 1`;
                    cell.style.gridColumn = `${col + 1} / span 1`;
                    board.appendChild(cell);
                }
            }

            this.renderSheepImages(board, levelData, rows, cols);
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
            const relativePath = path.join('assets', 'resources', resourcePath);
            const basePath = path.join(getProjectPath(), relativePath);
            const ext = path.extname(basePath);
            if (ext && fs.existsSync(basePath)) {
                return basePath;
            }

            const candidates = ['.png', '.jpg', '.jpeg', '.webp', '.Png'];
            const found = candidates.map((candidateExt) => `${basePath}${candidateExt}`).find((candidatePath) => fs.existsSync(candidatePath));
            return found || `${basePath}.png`;
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
