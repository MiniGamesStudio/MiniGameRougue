import { _decorator, Button, JsonAsset, Node, resources, RichText, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import { AdManager, AdPlayResult } from '../../../engine/AdManager';
import { PlatformManager, PlatformResult } from '../../../engine/PlatformManager';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { CommonUIID } from '../CommonUIConfig';
const { ccclass, property } = _decorator;

const MAX_ROW = 19;
const MAX_COL = 12;
const LEVEL_CONFIG_RESOURCE = 'config/sheep_levels';
const DEFAULT_SHEEP_TYPE = 'normal';
const DEFAULT_SHEEP_RESOURCE = 'texture/sheep/spriteFrame';
const DEFAULT_SHEEP_FALLBACK_RESOURCE = 'texture/sheep';
const DEFAULT_BOARD_PADDING_X = 40;
const DEFAULT_BOARD_PADDING_Y = 120;
const DEFAULT_BOARD_PADDING_BOTTOM = 220;
const DEFAULT_SHEEP_SCALE = 1;
const MOVE_DURATION_PER_CELL = 0.08;
const MIN_MOVE_DURATION = 0.12;
const RUN_OUT_EXTRA_CELL = 2;

enum SheepDirection {
    Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
}

type SkillMode = 'none' | 'removeTwo' | 'flipOne';

interface SheepDirectionConfig {
    rowDelta: number;
    colDelta: number;
    moveX: number;
    moveY: number;
    angle: number;
}

interface SheepData {
    node: Node;
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
    direction: SheepDirection;
    type: string;
    moving: boolean;
    removed: boolean;
}

interface SheepFootprint {
    rowSpan: number;
    colSpan: number;
}

interface SheepTypeConfig {
    resource?: string;
    vertical?: SheepFootprint;
    horizontal?: SheepFootprint;
}

interface SheepMoveResult {
    blocked: boolean;
    targetRow: number;
    targetCol: number;
    distanceCell: number;
}

interface GameLevelSheepConfig {
    row: number;
    col: number;
    direction: SheepDirection | string;
    type?: string;
}

export interface GameLevelConfig {
    level?: number;
    rowCount?: number;
    colCount?: number;
    sheep?: GameLevelSheepConfig[];
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
}

interface GameLevelTable {
    levels?: GameLevelConfig[];
    sheepTypes?: Record<string, string>;
    sheepTypeConfigs?: Record<string, SheepTypeConfig>;
}

const DirectionConfigs: Record<SheepDirection, SheepDirectionConfig> = {
    [SheepDirection.Up]: { rowDelta: -1, colDelta: 0, moveX: 0, moveY: 1, angle: 0 },
    [SheepDirection.Right]: { rowDelta: 0, colDelta: 1, moveX: 1, moveY: 0, angle: -90 },
    [SheepDirection.Down]: { rowDelta: 1, colDelta: 0, moveX: 0, moveY: -1, angle: 180 },
    [SheepDirection.Left]: { rowDelta: 0, colDelta: -1, moveX: -1, moveY: 0, angle: 90 },
};

@ccclass('GamePanel')
export class GamePanel extends UIBase {
    @property(Node)
    m_GameRoot: Node = null;
    @property(Button)
    m_PauseBtn: Button = null;
    @property(Button)
    m_SkillOneBtn: Button = null;
    @property(Button)
    m_SkillTwoBtn: Button = null;
    @property(Button)
    m_SkillThreeBtn: Button = null;
    @property(RichText)
    m_LevelText: RichText = null;

    @property({ tooltip: '固定关卡行数：19' })
    m_LevelRowCount: number = MAX_ROW;
    @property({ tooltip: '固定关卡列数：12' })
    m_LevelColCount: number = MAX_COL;
    @property({ tooltip: '棋盘横向内边距，避免小羊贴近屏幕边缘' })
    m_BoardPaddingX: number = DEFAULT_BOARD_PADDING_X;
    @property({ tooltip: '棋盘纵向内边距，避免小羊贴近屏幕边缘' })
    m_BoardPaddingY: number = DEFAULT_BOARD_PADDING_Y;
    @property({ tooltip: '棋盘底部内边距，避免小羊区域压到技能按钮' })
    m_BoardPaddingBottom: number = DEFAULT_BOARD_PADDING_BOTTOM;
    @property({ tooltip: '默认打开的关卡，从 1 开始' })
    m_StartLevel: number = 1;
    @property({ tooltip: '小羊固定缩放，不随关卡行列和数量变化' })
    m_SheepScale: number = DEFAULT_SHEEP_SCALE;

    private m_SheepSpriteFrameMap: Map<string, SpriteFrame> = new Map();
    private m_SheepTypeResourceMap: Map<string, string> = new Map([[DEFAULT_SHEEP_TYPE, DEFAULT_SHEEP_RESOURCE]]);
    private m_SheepTypeConfigMap: Map<string, SheepTypeConfig> = new Map([[DEFAULT_SHEEP_TYPE, {
        resource: DEFAULT_SHEEP_RESOURCE,
        vertical: { rowSpan: 2, colSpan: 1 },
        horizontal: { rowSpan: 1, colSpan: 2 },
    }]]);
    private m_SheepList: SheepData[] = [];
    private m_Grid: (SheepData | null)[][] = [];
    private m_RowCount: number = MAX_ROW;
    private m_ColCount: number = MAX_COL;
    private m_PaddingX: number = DEFAULT_BOARD_PADDING_X;
    private m_PaddingTop: number = DEFAULT_BOARD_PADDING_Y;
    private m_PaddingBottom: number = DEFAULT_BOARD_PADDING_BOTTOM;
    private m_CellWidth: number = 0;
    private m_CellHeight: number = 0;
    private m_BoardWidth: number = 0;
    private m_BoardHeight: number = 0;
    private m_BoardLeft: number = 0;
    private m_BoardTop: number = 0;
    private m_SkillMode: SkillMode = 'none';
    private m_SkillRemoveRemain: number = 0;
    private m_LevelEnded: boolean = false;
    private m_LevelConfigList: GameLevelConfig[] = [];
    private m_CurrentLevel: number = 1;
    private m_OpenLevelConfig: GameLevelConfig = null;
    private m_IsPaused: boolean = false;

    OnInit(): void {
        this.SetBtnEvent(this.m_PauseBtn, () => this.onPauseBtnClick());
        this.SetBtnEvent(this.m_SkillOneBtn, () => this.onSkillOneBtnClick());
        this.SetBtnEvent(this.m_SkillTwoBtn, () => this.onSkillTwoBtnClick());
        this.SetBtnEvent(this.m_SkillThreeBtn, () => this.onSkillThreeBtnClick());
    }

    OnOpen(level: number | GameLevelConfig = this.m_StartLevel): void {
        this.loadLocalLevelConfigs(() => {
            if (!this.isValid) return;
            this.loadLevel(level);
        });
    }

    OnClose(): void {
        super.OnClose();
        this.clearSheep();
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        this.m_LevelEnded = false;
        this.m_IsPaused = false;
    }

    private loadLevel(level: number | GameLevelConfig): void {
        this.m_OpenLevelConfig = this.resolveOpenLevelConfig(level);
        this.resetGame();
        this.loadSheepSpriteFrames(() => {
            if (!this.isValid) return;
            this.startLevel();
        });
    }

    private loadLocalLevelConfigs(onComplete: () => void): void {
        if (this.m_LevelConfigList.length > 0) {
            onComplete();
            return;
        }

        resources.load(LEVEL_CONFIG_RESOURCE, JsonAsset, (err, asset) => {
            if (err || !asset) {
                console.warn('GamePanel: 加载本地关卡配置失败，使用编辑器默认配置', err);
                onComplete();
                return;
            }

            const table = asset.json as GameLevelTable;
            this.m_LevelConfigList = Array.isArray(table?.levels) ? table.levels : [];
            this.initSheepTypeConfigs(table);
            if (this.m_LevelConfigList.length <= 0) {
                console.warn('GamePanel: 本地关卡配置为空，使用编辑器默认配置');
            }
            onComplete();
        });
    }

    private initSheepTypeConfigs(table?: GameLevelTable): void {
        this.m_SheepTypeResourceMap.clear();
        this.m_SheepTypeConfigMap.clear();
        this.m_SheepTypeResourceMap.set(DEFAULT_SHEEP_TYPE, DEFAULT_SHEEP_RESOURCE);
        this.m_SheepTypeConfigMap.set(DEFAULT_SHEEP_TYPE, {
            resource: DEFAULT_SHEEP_RESOURCE,
            vertical: { rowSpan: 2, colSpan: 1 },
            horizontal: { rowSpan: 1, colSpan: 2 },
        });

        const sheepTypes = table?.sheepTypes;
        if (sheepTypes) {
            Object.keys(sheepTypes).forEach(type => {
                const resourcePath = sheepTypes[type];
                if (type && resourcePath) {
                    this.m_SheepTypeResourceMap.set(type, resourcePath);
                    this.m_SheepTypeConfigMap.set(type, {
                        ...this.getDefaultSheepTypeConfig(),
                        resource: resourcePath,
                    });
                }
            });
        }

        const sheepTypeConfigs = table?.sheepTypeConfigs;
        if (!sheepTypeConfigs) return;

        Object.keys(sheepTypeConfigs).forEach(type => {
            if (!type) return;

            const config = this.mergeSheepTypeConfig(sheepTypeConfigs[type]);
            this.m_SheepTypeConfigMap.set(type, config);
            if (config.resource) {
                this.m_SheepTypeResourceMap.set(type, config.resource);
            }
        });
    }

    private getDefaultSheepTypeConfig(): SheepTypeConfig {
        return {
            resource: DEFAULT_SHEEP_RESOURCE,
            vertical: { rowSpan: 2, colSpan: 1 },
            horizontal: { rowSpan: 1, colSpan: 2 },
        };
    }

    private mergeSheepTypeConfig(config?: SheepTypeConfig): SheepTypeConfig {
        const defaultConfig = this.getDefaultSheepTypeConfig();
        return {
            resource: config?.resource || defaultConfig.resource,
            vertical: config?.vertical || defaultConfig.vertical,
            horizontal: config?.horizontal || defaultConfig.horizontal,
        };
    }

    private resolveOpenLevelConfig(level: number | GameLevelConfig): GameLevelConfig | null {
        if (typeof level !== 'number') {
            this.m_CurrentLevel = level?.level || this.m_StartLevel;
            return level || null;
        }

        this.m_CurrentLevel = this.clampInt(level, 1, Math.max(1, this.m_LevelConfigList.length));
        return this.m_LevelConfigList[this.m_CurrentLevel - 1] || null;
    }

    private resetGame(): void {
        this.clearSheep();
        this.initLevelConfig();
        this.updateLevelText();
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        this.m_LevelEnded = false;
        this.m_IsPaused = false;
        this.initBoardSize();
    }

    private updateLevelText(): void {
        if (!this.m_LevelText) return;

        this.m_LevelText.string = `关卡：${this.m_CurrentLevel}`;
    }

    private initLevelConfig(): void {
        const config = this.m_OpenLevelConfig;
        this.m_RowCount = MAX_ROW;
        this.m_ColCount = MAX_COL;
        this.m_PaddingX = Math.max(0, config?.paddingX ?? this.m_BoardPaddingX);
        this.m_PaddingTop = Math.max(0, config?.paddingTop ?? config?.paddingY ?? this.m_BoardPaddingY);
        this.m_PaddingBottom = Math.max(0, config?.paddingBottom ?? config?.paddingY ?? this.m_BoardPaddingBottom);
    }

    private loadSheepSpriteFrames(onComplete: () => void): void {
        const sheepTypes = this.getCurrentLevelSheepTypes();
        const unloadedTypes = sheepTypes.filter(type => !this.m_SheepSpriteFrameMap.has(type));
        if (unloadedTypes.length <= 0) {
            onComplete();
            return;
        }

        let remainCount = unloadedTypes.length;
        const finishOne = (): void => {
            remainCount--;
            if (remainCount <= 0) onComplete();
        };

        unloadedTypes.forEach(type => {
            this.loadSheepSpriteFrameByType(type, finishOne);
        });
    }

    private loadSheepSpriteFrameByType(type: string, onComplete: () => void): void {
        const resourcePath = this.m_SheepTypeResourceMap.get(type) || DEFAULT_SHEEP_RESOURCE;
        resources.load(resourcePath, SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame) {
                this.m_SheepSpriteFrameMap.set(type, spriteFrame);
                onComplete();
                return;
            }

            resources.load(DEFAULT_SHEEP_FALLBACK_RESOURCE, SpriteFrame, (fallbackErr, fallbackSpriteFrame) => {
                if (!fallbackErr && fallbackSpriteFrame) {
                    this.m_SheepSpriteFrameMap.set(type, fallbackSpriteFrame);
                } else {
                    console.warn(`GamePanel: 加载小羊类型 ${type} 资源失败`, fallbackErr || err);
                }
                onComplete();
            });
        });
    }

    private getCurrentLevelSheepTypes(): string[] {
        const typeSet = new Set<string>();
        const sheepConfigList = this.m_OpenLevelConfig?.sheep || [];
        sheepConfigList.forEach(config => {
            typeSet.add(this.resolveSheepType(config.type));
        });

        if (typeSet.size <= 0) {
            typeSet.add(DEFAULT_SHEEP_TYPE);
        }

        return Array.from(typeSet);
    }

    private startLevel(): void {
        if (!this.m_GameRoot || !this.m_GameRoot.isValid) return;

        this.initGrid();
        this.createSheepByLevelConfig();
    }

    private initBoardSize(): void {
        const transform = this.m_GameRoot?.getComponent(UITransform);
        const contentSize = transform?.contentSize;
        const rootWidth = contentSize?.width || 600;
        const rootHeight = contentSize?.height || 1200;
        const paddingX = this.clampNumber(this.m_PaddingX, 0, rootWidth * 0.45);
        const paddingTop = this.clampNumber(this.m_PaddingTop, 0, rootHeight * 0.45);
        const paddingBottom = this.clampNumber(this.m_PaddingBottom, 0, rootHeight * 0.45);
        this.m_BoardWidth = rootWidth - paddingX * 2;
        this.m_BoardHeight = rootHeight - paddingTop - paddingBottom;
        this.m_BoardLeft = -rootWidth * 0.5 + paddingX;
        this.m_BoardTop = rootHeight * 0.5 - paddingTop;
        this.m_CellWidth = this.m_BoardWidth / this.m_ColCount;
        this.m_CellHeight = this.m_BoardHeight / this.m_RowCount;
    }

    private initGrid(): void {
        this.m_Grid = [];
        for (let row = 0; row < this.m_RowCount; row++) {
            const rowData: (SheepData | null)[] = [];
            for (let col = 0; col < this.m_ColCount; col++) {
                rowData.push(null);
            }
            this.m_Grid.push(rowData);
        }
    }

    private createSheepByLevelConfig(): void {
        const sheepConfigList = this.m_OpenLevelConfig?.sheep || [];
        if (sheepConfigList.length <= 0) {
            console.warn(`GamePanel: 关卡 ${this.m_CurrentLevel} 没有配置小羊布局`);
            return;
        }

        sheepConfigList.forEach((config, index) => {
            const direction = this.resolveSheepDirection(config.direction);
            const sheepType = this.resolveSheepType(config.type);
            if (direction === null || !this.createSheep(config.row, config.col, direction, sheepType)) {
                console.warn(`GamePanel: 关卡 ${this.m_CurrentLevel} 第 ${index + 1} 只小羊配置无效`, config);
            }
        });
    }

    private resolveSheepType(type?: string): string {
        return type || DEFAULT_SHEEP_TYPE;
    }

    private resolveSheepDirection(direction: SheepDirection | string): SheepDirection | null {
        if (typeof direction === 'number' && DirectionConfigs[direction as SheepDirection]) {
            return direction as SheepDirection;
        }

        if (typeof direction !== 'string') return null;

        const normalizedDirection = direction.toLowerCase();
        if (normalizedDirection === 'up') return SheepDirection.Up;
        if (normalizedDirection === 'right') return SheepDirection.Right;
        if (normalizedDirection === 'down') return SheepDirection.Down;
        if (normalizedDirection === 'left') return SheepDirection.Left;

        return null;
    }

    private createSheep(row: number, col: number, direction: SheepDirection, type: string): boolean {
        if (!this.canPlaceSheep(row, col, direction, type)) return false;
        const spriteFrame = this.getSheepSpriteFrame(type);
        if (!spriteFrame) return false;

        const node = new Node(`Sheep_${row}_${col}`);
        node.layer = this.m_GameRoot.layer;
        this.m_GameRoot.addChild(node);
        node.setPosition(this.getSheepPosition(row, col, direction, type));

        const transform = node.addComponent(UITransform);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = Sprite.SizeMode.TRIMMED;

        const spriteRect = spriteFrame.rect;
        transform.setContentSize(spriteRect.width, spriteRect.height);
        node.setScale(this.m_SheepScale, this.m_SheepScale, 1);

        const button = node.addComponent(Button);
        this.SetBtnEvent(button, () => this.onSheepClick(sheep));

        const footprint = this.getSheepFootprint(direction, type);

        const sheep: SheepData = {
            node,
            row,
            col,
            rowSpan: footprint.rowSpan,
            colSpan: footprint.colSpan,
            direction,
            type,
            moving: false,
            removed: false,
        };

        this.applySheepDirection(sheep, direction);
        this.setSheepGrid(sheep, sheep);
        this.m_SheepList.push(sheep);
        return true;
    }

    private getSheepSpriteFrame(type: string): SpriteFrame | null {
        return this.m_SheepSpriteFrameMap.get(type)
            || this.m_SheepSpriteFrameMap.get(DEFAULT_SHEEP_TYPE)
            || null;
    }

    private onSheepClick(sheep: SheepData): void {
        if (!sheep || sheep.removed || sheep.moving || this.m_LevelEnded || this.m_IsPaused) return;

        if (this.m_SkillMode === 'removeTwo') {
            this.removeSheepBySkill(sheep);
            return;
        }

        if (this.m_SkillMode === 'flipOne') {
            this.flipSheep(sheep);
            this.m_SkillMode = 'none';
            return;
        }

        this.moveSheep(sheep);
    }

    private moveSheep(sheep: SheepData): void {
        const moveResult = this.getMoveResult(sheep);
        const fromRow = sheep.row;
        const fromCol = sheep.col;
        const targetPosition = moveResult.blocked
            ? this.getSheepPosition(moveResult.targetRow, moveResult.targetCol, sheep.direction, sheep.type)
            : this.getRunOutPosition(sheep);

        sheep.moving = true;
        this.clearSheepGrid(sheep);
        if (moveResult.blocked) {
            sheep.row = moveResult.targetRow;
            sheep.col = moveResult.targetCol;
            this.setSheepGrid(sheep, sheep);
        } else {
            sheep.removed = true;
        }

        tween(sheep.node)
            .to(Math.max(MIN_MOVE_DURATION, moveResult.distanceCell * MOVE_DURATION_PER_CELL), { position: targetPosition })
            .call(() => {
                if (moveResult.blocked) {
                    this.playSheepHitAnimation(sheep, () => {
                        sheep.moving = false;
                    });
                } else {
                    sheep.moving = false;
                    this.destroySheep(sheep);
                    this.checkLevelEnd();
                }
            })
            .start();
    }

    private playSheepHitAnimation(sheep: SheepData, onComplete: () => void): void {
        if (!sheep.node || !sheep.node.isValid) {
            onComplete();
            return;
        }

        const originScale = sheep.node.scale.clone();
        const hitScale = new Vec3(originScale.x * 1.12, originScale.y * 0.88, originScale.z);
        tween(sheep.node)
            .to(0.08, { scale: hitScale })
            .to(0.08, { scale: originScale })
            .call(onComplete)
            .start();
    }

    private getMoveResult(sheep: SheepData): SheepMoveResult {
        const config = DirectionConfigs[sheep.direction];
        let targetRow = sheep.row;
        let targetCol = sheep.col;
        let nextRow = sheep.row + config.rowDelta;
        let nextCol = sheep.col + config.colDelta;

        while (this.isFootprintInside(nextRow, nextCol, sheep.rowSpan, sheep.colSpan)) {
            if (!this.canPlaceFootprint(nextRow, nextCol, sheep.rowSpan, sheep.colSpan, sheep)) {
                return {
                    blocked: true,
                    targetRow,
                    targetCol,
                    distanceCell: Math.abs(targetRow - sheep.row) + Math.abs(targetCol - sheep.col),
                };
            }

            targetRow = nextRow;
            targetCol = nextCol;
            nextRow += config.rowDelta;
            nextCol += config.colDelta;
        }

        return {
            blocked: false,
            targetRow,
            targetCol,
            distanceCell: this.getRunOutDistanceCell(sheep),
        };
    }

    private onPauseBtnClick(): void {
        if (this.m_LevelEnded || this.m_IsPaused) return;

        this.m_IsPaused = true;
        UIManager.GetInstance().OpenPanel(CommonUIID.PausePanel, {
            onContinue: () => this.continueCurrentLevel(),
            onRestart: () => this.restartCurrentLevel(),
            onGoBack: () => this.goBackMainPanel(),
        });
    }

    private continueCurrentLevel(): void {
        this.m_IsPaused = false;
    }

    private restartCurrentLevel(): void {
        this.m_IsPaused = false;
        this.loadLevel(this.m_CurrentLevel);
    }

    private goBackMainPanel(): void {
        this.m_IsPaused = false;
        UIManager.GetInstance().ClosePanel(CommonUIID.GamePanel);
        UIManager.GetInstance().OpenPanel(CommonUIID.MainPanel);
    }

    private async onSkillOneBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_IsPaused || this.m_SheepList.length <= 0) return;

        const shared = await this.shareForReward();
        if (!shared || !this.isValid) return;

        this.m_SkillMode = 'removeTwo';
        this.m_SkillRemoveRemain = Math.min(2, this.m_SheepList.length);
    }

    private async onSkillTwoBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_IsPaused || this.m_SheepList.length <= 0) return;

        const shared = await this.shareForReward();
        if (!shared || !this.isValid) return;

        this.getRandomSheepList(Math.min(5, this.m_SheepList.length)).forEach(sheep => {
            this.flipSheep(sheep);
        });
    }

    private async onSkillThreeBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_IsPaused || this.m_SheepList.length <= 0) return;

        const shared = await this.shareForReward();
        if (!shared || !this.isValid) return;

        this.m_SkillMode = 'flipOne';
        this.m_SkillRemoveRemain = 0;
    }

    private async shareForReward(): Promise<boolean> {
        const result = await PlatformManager.getInstance().shareAppMessage({
            title: '快来一起玩吧',
            query: `level=${this.m_CurrentLevel}`,
        });
        if (result.result === PlatformResult.Success) {
            return true;
        }

        if (result.result === PlatformResult.Unsupported) {
            console.warn('GamePanel: 当前环境不支持分享，直接发放技能奖励用于调试', result.message);
            return true;
        }

        console.warn('GamePanel: 分享未完成，技能未生效', result.message);
        return false;
    }

    private async playRewardedAd(): Promise<boolean> {
        const result = await AdManager.getInstance().playRewardedVideoAd();
        if (result.result !== AdPlayResult.Completed) {
            console.warn('GamePanel: 广告未完整播放，技能未生效', result.message);
            return false;
        }

        return true;
    }

    private removeSheepBySkill(sheep: SheepData): void {
        if (this.m_SkillRemoveRemain <= 0) {
            this.m_SkillMode = 'none';
            return;
        }

        sheep.removed = true;
        this.clearSheepGrid(sheep);
        this.m_SkillRemoveRemain--;

        tween(sheep.node)
            .to(0.18, { scale: new Vec3(0, 0, 1) })
            .call(() => {
                this.destroySheep(sheep);
                this.checkLevelEnd();
            })
            .start();

        if (this.m_SkillRemoveRemain <= 0) {
            this.m_SkillMode = 'none';
        }
    }

    private flipSheep(sheep: SheepData): void {
        if (!sheep || sheep.removed || sheep.moving) return;

        const direction = (sheep.direction + 2) % 4 as SheepDirection;
        this.applySheepDirection(sheep, direction);
    }

    private applySheepDirection(sheep: SheepData, direction: SheepDirection): void {
        sheep.direction = direction;
        sheep.node.angle = DirectionConfigs[direction].angle;
    }

    private getRandomSheepList(count: number): SheepData[] {
        const availableList = this.m_SheepList.filter(sheep => !sheep.removed && !sheep.moving);
        for (let i = availableList.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = availableList[i];
            availableList[i] = availableList[randomIndex];
            availableList[randomIndex] = temp;
        }

        return availableList.slice(0, count);
    }

    private getSheepPosition(row: number, col: number, direction: SheepDirection, type: string): Vec3 {
        const footprint = this.getSheepFootprint(direction, type);
        const x = this.m_BoardLeft + this.m_CellWidth * (col + footprint.colSpan * 0.5);
        const y = this.m_BoardTop - this.m_CellHeight * (row + footprint.rowSpan * 0.5);
        return new Vec3(x, y, 0);
    }

    private getRunOutPosition(sheep: SheepData): Vec3 {
        const config = DirectionConfigs[sheep.direction];
        const position = sheep.node.position.clone();
        const distance = this.getRunOutDistanceCell(sheep);
        return new Vec3(
            position.x + config.moveX * this.m_CellWidth * distance,
            position.y + config.moveY * this.m_CellHeight * distance,
            position.z,
        );
    }

    private getRunOutDistanceCell(sheep: SheepData): number {
        if (sheep.direction === SheepDirection.Up) return sheep.row + sheep.rowSpan + RUN_OUT_EXTRA_CELL;
        if (sheep.direction === SheepDirection.Down) return this.m_RowCount - sheep.row + RUN_OUT_EXTRA_CELL;
        if (sheep.direction === SheepDirection.Left) return sheep.col + sheep.colSpan + RUN_OUT_EXTRA_CELL;
        return this.m_ColCount - sheep.col + RUN_OUT_EXTRA_CELL;
    }

    private isInsideGrid(row: number, col: number): boolean {
        return row >= 0 && row < this.m_RowCount && col >= 0 && col < this.m_ColCount;
    }

    private getSheepFootprint(direction: SheepDirection, type: string): SheepFootprint {
        const typeConfig = this.m_SheepTypeConfigMap.get(type) || this.getDefaultSheepTypeConfig();
        if (this.isHorizontalDirection(direction)) {
            return typeConfig.horizontal || { rowSpan: 1, colSpan: 2 };
        }

        return typeConfig.vertical || { rowSpan: 2, colSpan: 1 };
    }

    private isHorizontalDirection(direction: SheepDirection): boolean {
        return direction === SheepDirection.Left || direction === SheepDirection.Right;
    }

    private canPlaceSheep(row: number, col: number, direction: SheepDirection, type: string): boolean {
        const footprint = this.getSheepFootprint(direction, type);
        return this.canPlaceFootprint(row, col, footprint.rowSpan, footprint.colSpan, null);
    }

    private canPlaceFootprint(row: number, col: number, rowSpan: number, colSpan: number, ignoreSheep: SheepData | null): boolean {
        if (!this.isFootprintInside(row, col, rowSpan, colSpan)) return false;

        for (let rowOffset = 0; rowOffset < rowSpan; rowOffset++) {
            for (let colOffset = 0; colOffset < colSpan; colOffset++) {
                const target = this.m_Grid[row + rowOffset][col + colOffset];
                if (target && target !== ignoreSheep && !target.removed) return false;
            }
        }

        return true;
    }

    private isFootprintInside(row: number, col: number, rowSpan: number, colSpan: number): boolean {
        return row >= 0 && col >= 0 && row + rowSpan <= this.m_RowCount && col + colSpan <= this.m_ColCount;
    }

    private setSheepGrid(sheep: SheepData, value: SheepData | null): void {
        for (let rowOffset = 0; rowOffset < sheep.rowSpan; rowOffset++) {
            for (let colOffset = 0; colOffset < sheep.colSpan; colOffset++) {
                const row = sheep.row + rowOffset;
                const col = sheep.col + colOffset;
                if (this.isInsideGrid(row, col)) {
                    this.m_Grid[row][col] = value;
                }
            }
        }
    }

    private clearSheepGrid(sheep: SheepData): void {
        this.setSheepGrid(sheep, null);
    }

    private clampInt(value: number, min: number, max: number): number {
        return Math.floor(this.clampNumber(value, min, max));
    }

    private clampNumber(value: number, min: number, max: number): number {
        if (Number.isNaN(value)) return min;

        return Math.min(Math.max(value, min), max);
    }

    private destroySheep(sheep: SheepData): void {
        const index = this.m_SheepList.indexOf(sheep);
        if (index >= 0) {
            this.m_SheepList.splice(index, 1);
        }

        if (sheep.node && sheep.node.isValid) {
            tween(sheep.node).stop();
            sheep.node.removeFromParent();
            sheep.node.destroy();
        }
    }

    private checkLevelEnd(): void {
        if (this.m_LevelEnded || this.m_SheepList.length > 0) return;

        this.m_LevelEnded = true;
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        console.log('GamePanel: 关卡结束');
        this.submitRankScore();
        this.startNextLevel();
    }

    private startNextLevel(): void {
        const nextLevel = this.m_CurrentLevel + 1;
        if (this.m_LevelConfigList.length > 0 && nextLevel > this.m_LevelConfigList.length) {
            console.log('GamePanel: 已完成全部关卡');
            return;
        }

        this.loadLevel(nextLevel);
    }

    private async submitRankScore(): Promise<void> {
        const result = await PlatformManager.getInstance().submitRankScore('level', this.m_CurrentLevel);
        if (result.result !== PlatformResult.Success) {
            console.warn('GamePanel: 排行榜提交失败或不支持', result);
        }
    }

    private clearSheep(): void {
        this.m_SheepList.forEach(sheep => {
            if (sheep.node && sheep.node.isValid) {
                tween(sheep.node).stop();
                sheep.node.removeFromParent();
                sheep.node.destroy();
            }
        });
        this.m_SheepList = [];
        this.m_Grid = [];
    }
}
