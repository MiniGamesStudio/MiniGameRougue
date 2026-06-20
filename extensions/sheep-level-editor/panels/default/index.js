'use strict';

const fs = require('fs');
const path = require('path');
const generator = require('../../lib/sheep-level-generator');

const LEVEL_CONFIG_ASSET_URL = 'db://assets/resources/config/sheep_levels.json';
const LEVEL_CONFIG_FILE_PATH = path.join('assets', 'resources', 'config', 'sheep_levels.json');

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
                this.currentLevel = generator.generateLevel(level, typeCounts, this.getGeneratorTypeConfigs());
                this.renderLevel(this.currentLevel);
                this.setStatus(`已生成第 ${level} 关，数量 ${this.currentLevel.sheep.length}`);
            } catch (error) {
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
                ...generator.DefaultTypeConfigs,
                ...configs,
            };
        },

        renderLevel(levelData) {
            const text = [
                `关卡：${levelData.level}`,
                `行列：${levelData.rowCount} x ${levelData.colCount}`,
                `数量：${levelData.sheep.length}`,
                '',
                this.createLayoutText(levelData),
                '',
                '图例：^ 上，v 下，< 左，> 右，. 空',
            ].join('\n');
            this.renderLayout(text);
        },

        createLayoutText(levelData) {
            const rows = Number(levelData.rowCount) || generator.ROW_COUNT;
            const cols = Number(levelData.colCount) || generator.COL_COUNT;
            const grid = [];
            for (let row = 0; row < rows; row++) {
                grid.push(new Array(cols).fill('.'));
            }

            const typeConfigs = this.getGeneratorTypeConfigs();
            levelData.sheep.forEach((sheep, index) => {
                const footprint = this.getFootprint(sheep.direction, sheep.type, typeConfigs);
                const mark = this.getDirectionChar(sheep.direction);
                for (let rowOffset = 0; rowOffset < footprint.rowSpan; rowOffset++) {
                    for (let colOffset = 0; colOffset < footprint.colSpan; colOffset++) {
                        const row = sheep.row + rowOffset;
                        const col = sheep.col + colOffset;
                        if (row >= 0 && row < rows && col >= 0 && col < cols) {
                            grid[row][col] = rowOffset === 0 && colOffset === 0 ? mark : String(index % 10);
                        }
                    }
                }
            });

            return grid.map((row) => row.join(' ')).join('\n');
        },

        getFootprint(direction, type, typeConfigs) {
            const config = typeConfigs[type || generator.DEFAULT_TYPE] || typeConfigs[generator.DEFAULT_TYPE];
            if (direction === 'Left' || direction === 'Right') {
                return config.horizontal;
            }

            return config.vertical;
        },

        getDirectionChar(direction) {
            if (direction === 'Up') return '^';
            if (direction === 'Down') return 'v';
            if (direction === 'Left') return '<';
            if (direction === 'Right') return '>';
            return '?';
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
