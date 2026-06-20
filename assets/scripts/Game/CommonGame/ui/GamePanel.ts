import { _decorator, Button, JsonAsset, Node, resources, RichText, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import { AdManager, AdPlayResult } from '../../../engine/AdManager';
import { UIBase } from '../../../engine/ui/UIBase';
const { ccclass, property } = _decorator;

const MAX_ROW = 16;
const MAX_COL = 8;
const LEVEL_CONFIG_RESOURCE = 'config/sheep_levels';
const SHEEP_RESOURCE = 'texture/sheep/spriteFrame';
const SHEEP_FALLBACK_RESOURCE = 'texture/sheep';
const DEFAULT_SHEEP_FILL_RATE = 0.42;
const DEFAULT_BOARD_PADDING_X = 40;
const DEFAULT_BOARD_PADDING_Y = 120;
const DEFAULT_BOARD_PADDING_BOTTOM = 220;
const DEFAULT_UNIQUE_GENERATE_ATTEMPTS = 80;
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
    moving: boolean;
    removed: boolean;
}

interface SheepFootprint {
    rowSpan: number;
    colSpan: number;
}

interface SheepMoveResult {
    blocked: boolean;
    targetRow: number;
    targetCol: number;
    distanceCell: number;
}

interface SimSheep {
    id: number;
    row: number;
    col: number;
    rowSpan: number;
    colSpan: number;
    direction: SheepDirection;
    removed: boolean;
}

export interface GameLevelConfig {
    level?: number;
    rowCount?: number;
    colCount?: number;
    sheepCount?: number;
    fillRate?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    uniqueGenerateAttempts?: number;
}

interface GameLevelTable {
    levels?: GameLevelConfig[];
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

    @property({ tooltip: '固定关卡行数：16' })
    m_LevelRowCount: number = MAX_ROW;
    @property({ tooltip: '固定关卡列数：8' })
    m_LevelColCount: number = MAX_COL;
    @property({ tooltip: '关卡小羊数量，填 0 时按随机填充率生成' })
    m_LevelSheepCount: number = 0;
    @property({ tooltip: '小羊随机填充率，仅在小羊数量为 0 时生效' })
    m_LevelFillRate: number = DEFAULT_SHEEP_FILL_RATE;
    @property({ tooltip: '棋盘横向内边距，避免小羊贴近屏幕边缘' })
    m_BoardPaddingX: number = DEFAULT_BOARD_PADDING_X;
    @property({ tooltip: '棋盘纵向内边距，避免小羊贴近屏幕边缘' })
    m_BoardPaddingY: number = DEFAULT_BOARD_PADDING_Y;
    @property({ tooltip: '棋盘底部内边距，避免小羊区域压到技能按钮' })
    m_BoardPaddingBottom: number = DEFAULT_BOARD_PADDING_BOTTOM;
    @property({ tooltip: '唯一解关卡生成重试次数' })
    m_UniqueGenerateAttempts: number = DEFAULT_UNIQUE_GENERATE_ATTEMPTS;
    @property({ tooltip: '默认打开的关卡，从 1 开始' })
    m_StartLevel: number = 1;
    @property({ tooltip: '小羊固定缩放，不随关卡行列和数量变化' })
    m_SheepScale: number = DEFAULT_SHEEP_SCALE;

    private m_SheepSpriteFrame: SpriteFrame = null;
    private m_SheepList: SheepData[] = [];
    private m_Grid: (SheepData | null)[][] = [];
    private m_RowCount: number = MAX_ROW;
    private m_ColCount: number = MAX_COL;
    private m_SheepCount: number = 0;
    private m_FillRate: number = DEFAULT_SHEEP_FILL_RATE;
    private m_PaddingX: number = DEFAULT_BOARD_PADDING_X;
    private m_PaddingTop: number = DEFAULT_BOARD_PADDING_Y;
    private m_PaddingBottom: number = DEFAULT_BOARD_PADDING_BOTTOM;
    private m_UniqueAttempts: number = DEFAULT_UNIQUE_GENERATE_ATTEMPTS;
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

    OnInit(): void {
        this.SetBtnEvent(this.m_SkillOneBtn, () => this.onSkillOneBtnClick());
        this.SetBtnEvent(this.m_SkillTwoBtn, () => this.onSkillTwoBtnClick());
        this.SetBtnEvent(this.m_SkillThreeBtn, () => this.onSkillThreeBtnClick());
    }

    OnOpen(level: number | GameLevelConfig = this.m_StartLevel): void {
        this.loadLocalLevelConfigs(() => {
            if (!this.isValid) return;
            this.m_OpenLevelConfig = this.resolveOpenLevelConfig(level);
            this.resetGame();
            this.loadSheepSpriteFrame(() => {
                if (!this.isValid) return;
                this.startLevel();
            });
        });
    }

    OnClose(): void {
        super.OnClose();
        this.clearSheep();
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        this.m_LevelEnded = false;
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
            if (this.m_LevelConfigList.length <= 0) {
                console.warn('GamePanel: 本地关卡配置为空，使用编辑器默认配置');
            }
            onComplete();
        });
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
        this.m_FillRate = this.clampNumber(config?.fillRate ?? this.m_LevelFillRate, 0, 1);
        this.m_SheepCount = this.clampInt(config?.sheepCount ?? this.m_LevelSheepCount, 0, Math.floor(this.m_RowCount * this.m_ColCount * 0.5));
        this.m_PaddingX = Math.max(0, config?.paddingX ?? this.m_BoardPaddingX);
        this.m_PaddingTop = Math.max(0, config?.paddingTop ?? config?.paddingY ?? this.m_BoardPaddingY);
        this.m_PaddingBottom = Math.max(0, config?.paddingBottom ?? config?.paddingY ?? this.m_BoardPaddingBottom);
        this.m_UniqueAttempts = this.clampInt(config?.uniqueGenerateAttempts ?? this.m_UniqueGenerateAttempts, 1, 1000);
    }

    private loadSheepSpriteFrame(onComplete: () => void): void {
        if (this.m_SheepSpriteFrame) {
            onComplete();
            return;
        }

        resources.load(SHEEP_RESOURCE, SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame) {
                this.m_SheepSpriteFrame = spriteFrame;
                onComplete();
                return;
            }

            resources.load(SHEEP_FALLBACK_RESOURCE, SpriteFrame, (fallbackErr, fallbackSpriteFrame) => {
                if (fallbackErr || !fallbackSpriteFrame) {
                    console.warn('GamePanel: 加载小羊资源失败', fallbackErr || err);
                    return;
                }

                this.m_SheepSpriteFrame = fallbackSpriteFrame;
                onComplete();
            });
        });
    }

    private startLevel(): void {
        if (!this.m_GameRoot || !this.m_GameRoot.isValid || !this.m_SheepSpriteFrame) return;

        if (this.generateUniqueLevel()) return;

        console.warn('GamePanel: 随机关卡未找到唯一解，使用链式唯一解兜底');
        this.clearSheep();
        this.initGrid();
        this.createGuaranteedUniqueLevel();
    }

    private generateUniqueLevel(): boolean {
        for (let attempt = 0; attempt < this.m_UniqueAttempts; attempt++) {
            this.clearSheep();
            this.initGrid();
            this.generateCandidateLevel();
            if (this.m_SheepList.length > 0 && this.hasUniqueSolution()) {
                return true;
            }
        }

        return false;
    }

    private generateCandidateLevel(): void {
        if (this.m_SheepCount > 0) {
            this.createSheepByCount(this.m_SheepCount);
        } else {
            this.createSheepByFillRate();
        }

        if (this.m_SheepList.length <= 0) {
            this.createFirstAvailableSheep();
        }
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

    private createSheepByCount(count: number): void {
        const cells = this.getShuffledCells();
        for (let i = 0; i < cells.length && this.m_SheepList.length < count; i++) {
            const cell = cells[i];
            const directions = this.getShuffledDirections();
            for (let j = 0; j < directions.length; j++) {
                if (this.createSheep(cell.row, cell.col, directions[j])) break;
            }
        }
    }

    private createSheepByFillRate(): void {
        const cells = this.getCenterWeightedCells();
        cells.forEach(cell => {
            if (Math.random() > this.m_FillRate) return;

            this.createSheep(cell.row, cell.col, this.getRandomDirection());
        });
    }

    private createFirstAvailableSheep(): void {
        const cells = this.getShuffledCells();
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const directions = this.getShuffledDirections();
            for (let j = 0; j < directions.length; j++) {
                if (this.createSheep(cell.row, cell.col, directions[j])) return;
            }
        }
    }

    private createGuaranteedUniqueLevel(): void {
        const targetCount = this.getFallbackSheepCount();
        const chain = this.getGuaranteedChainLayout();
        for (let i = 0; i < chain.length && this.m_SheepList.length < targetCount; i++) {
            const item = chain[i];
            this.createSheep(item.row, item.col, item.direction);
        }

        if (!this.hasUniqueSolution()) {
            this.clearSheep();
            this.initGrid();
            this.createFirstAvailableSheep();
        }
    }

    private getFallbackSheepCount(): number {
        if (this.m_SheepCount > 0) return Math.max(1, this.m_SheepCount);

        return Math.max(1, Math.floor(this.m_RowCount * this.m_ColCount * this.m_FillRate * 0.5));
    }

    private getGuaranteedChainLayout(): { row: number; col: number; direction: SheepDirection }[] {
        const chain: { row: number; col: number; direction: SheepDirection }[] = [];
        if (this.m_RowCount < 2 || this.m_ColCount < 1) return chain;

        const startCol = Math.max(0, Math.floor((this.m_ColCount - 2) * 0.5));
        for (let row = 0; row + 1 < this.m_RowCount; row += 2) {
            chain.push({ row, col: startCol, direction: SheepDirection.Up });
        }

        const bottomRow = this.m_RowCount - 1;
        let turnCol = startCol;
        for (let col = startCol + 1; col + 1 < this.m_ColCount; col += 2) {
            chain.push({ row: bottomRow, col, direction: SheepDirection.Left });
            turnCol = col + 1;
        }

        if (turnCol > 0) {
            for (let row = bottomRow - 2; row >= 0; row -= 2) {
                chain.push({ row, col: turnCol, direction: SheepDirection.Down });
            }

            const topTurnRow = chain.length > 0 ? chain[chain.length - 1].row : 0;
            for (let col = turnCol - 2; col >= 0; col -= 2) {
                chain.push({ row: topTurnRow, col, direction: SheepDirection.Right });
            }
        }

        return chain;
    }

    private createSheep(row: number, col: number, direction: SheepDirection): boolean {
        if (!this.canPlaceSheep(row, col, direction)) return false;

        const node = new Node(`Sheep_${row}_${col}`);
        node.layer = this.m_GameRoot.layer;
        this.m_GameRoot.addChild(node);
        node.setPosition(this.getSheepPosition(row, col, direction));

        const transform = node.addComponent(UITransform);

        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this.m_SheepSpriteFrame;
        sprite.sizeMode = Sprite.SizeMode.TRIMMED;

        const spriteRect = this.m_SheepSpriteFrame.rect;
        transform.setContentSize(spriteRect.width, spriteRect.height);
        node.setScale(this.m_SheepScale, this.m_SheepScale, 1);

        const button = node.addComponent(Button);
        this.SetBtnEvent(button, () => this.onSheepClick(sheep));

        const footprint = this.getSheepFootprint(direction);

        const sheep: SheepData = {
            node,
            row,
            col,
            rowSpan: footprint.rowSpan,
            colSpan: footprint.colSpan,
            direction,
            moving: false,
            removed: false,
        };

        this.applySheepDirection(sheep, direction);
        this.setSheepGrid(sheep, sheep);
        this.m_SheepList.push(sheep);
        return true;
    }

    private onSheepClick(sheep: SheepData): void {
        if (!sheep || sheep.removed || sheep.moving || this.m_LevelEnded) return;

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
            ? this.getSheepPosition(moveResult.targetRow, moveResult.targetCol, sheep.direction)
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

    private hasUniqueSolution(): boolean {
        const simSheepList = this.m_SheepList.map((sheep, index) => ({
            id: index,
            row: sheep.row,
            col: sheep.col,
            rowSpan: sheep.rowSpan,
            colSpan: sheep.colSpan,
            direction: sheep.direction,
            removed: false,
        }));
        let remainCount = simSheepList.length;

        while (remainCount > 0) {
            const simGrid = this.buildSimGrid(simSheepList);
            const removableList: SimSheep[] = [];

            for (let i = 0; i < simSheepList.length; i++) {
                const sheep = simSheepList[i];
                if (sheep.removed) continue;

                const moveResult = this.getSimMoveResult(sheep, simGrid);
                if (!moveResult.blocked) {
                    removableList.push(sheep);
                    continue;
                }

                if (moveResult.targetRow !== sheep.row || moveResult.targetCol !== sheep.col) {
                    return false;
                }
            }

            if (removableList.length !== 1) return false;

            removableList[0].removed = true;
            remainCount--;
        }

        return true;
    }

    private buildSimGrid(simSheepList: SimSheep[]): (SimSheep | null)[][] {
        const grid: (SimSheep | null)[][] = [];
        for (let row = 0; row < this.m_RowCount; row++) {
            const rowData: (SimSheep | null)[] = [];
            for (let col = 0; col < this.m_ColCount; col++) {
                rowData.push(null);
            }
            grid.push(rowData);
        }

        simSheepList.forEach(sheep => {
            if (sheep.removed) return;

            for (let rowOffset = 0; rowOffset < sheep.rowSpan; rowOffset++) {
                for (let colOffset = 0; colOffset < sheep.colSpan; colOffset++) {
                    const row = sheep.row + rowOffset;
                    const col = sheep.col + colOffset;
                    if (this.isInsideGrid(row, col)) {
                        grid[row][col] = sheep;
                    }
                }
            }
        });

        return grid;
    }

    private getSimMoveResult(sheep: SimSheep, grid: (SimSheep | null)[][]): SheepMoveResult {
        const config = DirectionConfigs[sheep.direction];
        let targetRow = sheep.row;
        let targetCol = sheep.col;
        let nextRow = sheep.row + config.rowDelta;
        let nextCol = sheep.col + config.colDelta;

        while (this.isFootprintInside(nextRow, nextCol, sheep.rowSpan, sheep.colSpan)) {
            if (!this.canPlaceSimFootprint(nextRow, nextCol, sheep.rowSpan, sheep.colSpan, sheep, grid)) {
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
            distanceCell: 0,
        };
    }

    private canPlaceSimFootprint(
        row: number,
        col: number,
        rowSpan: number,
        colSpan: number,
        ignoreSheep: SimSheep,
        grid: (SimSheep | null)[][],
    ): boolean {
        if (!this.isFootprintInside(row, col, rowSpan, colSpan)) return false;

        for (let rowOffset = 0; rowOffset < rowSpan; rowOffset++) {
            for (let colOffset = 0; colOffset < colSpan; colOffset++) {
                const target = grid[row + rowOffset][col + colOffset];
                if (target && target !== ignoreSheep && !target.removed) return false;
            }
        }

        return true;
    }

    private async onSkillOneBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_SheepList.length <= 0) return;

        const completed = await this.playRewardedAd();
        if (!completed || !this.isValid) return;

        this.m_SkillMode = 'removeTwo';
        this.m_SkillRemoveRemain = Math.min(2, this.m_SheepList.length);
    }

    private async onSkillTwoBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_SheepList.length <= 0) return;

        const completed = await this.playRewardedAd();
        if (!completed || !this.isValid) return;

        this.getRandomSheepList(Math.min(5, this.m_SheepList.length)).forEach(sheep => {
            this.flipSheep(sheep);
        });
    }

    private async onSkillThreeBtnClick(): Promise<void> {
        if (this.m_LevelEnded || this.m_SheepList.length <= 0) return;

        const completed = await this.playRewardedAd();
        if (!completed || !this.isValid) return;

        this.m_SkillMode = 'flipOne';
        this.m_SkillRemoveRemain = 0;
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

    private getShuffledDirections(): SheepDirection[] {
        const directions = [SheepDirection.Up, SheepDirection.Right, SheepDirection.Down, SheepDirection.Left];
        for (let i = directions.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = directions[i];
            directions[i] = directions[randomIndex];
            directions[randomIndex] = temp;
        }

        return directions;
    }

    private getShuffledCells(): { row: number; col: number }[] {
        return this.getCenterWeightedCells();
    }

    private getCenterWeightedCells(): { row: number; col: number }[] {
        const cells: { row: number; col: number }[] = [];
        const centerRow = (this.m_RowCount - 1) * 0.5;
        const centerCol = (this.m_ColCount - 1) * 0.5;
        for (let row = 0; row < this.m_RowCount; row++) {
            for (let col = 0; col < this.m_ColCount; col++) {
                cells.push({ row, col });
            }
        }

        cells.sort((a, b) => {
            const aDistance = Math.abs(a.row - centerRow) + Math.abs(a.col - centerCol);
            const bDistance = Math.abs(b.row - centerRow) + Math.abs(b.col - centerCol);
            return aDistance - bDistance || Math.random() - 0.5;
        });

        return cells;
    }

    private getRandomDirection(): SheepDirection {
        return Math.floor(Math.random() * 4) as SheepDirection;
    }

    private getSheepPosition(row: number, col: number, direction: SheepDirection): Vec3 {
        const footprint = this.getSheepFootprint(direction);
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

    private getSheepFootprint(direction: SheepDirection): SheepFootprint {
        if (this.isHorizontalDirection(direction)) {
            return { rowSpan: 1, colSpan: 2 };
        }

        return { rowSpan: 2, colSpan: 1 };
    }

    private isHorizontalDirection(direction: SheepDirection): boolean {
        return direction === SheepDirection.Left || direction === SheepDirection.Right;
    }

    private canPlaceSheep(row: number, col: number, direction: SheepDirection): boolean {
        const footprint = this.getSheepFootprint(direction);
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
