import { _decorator, Button, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import { AdManager, AdPlayResult } from '../../../engine/AdManager';
import { UIBase } from '../../../engine/ui/UIBase';
const { ccclass, property } = _decorator;

const MAX_ROW = 16;
const MAX_COL = 8;
const SHEEP_RESOURCE = 'texture/sheep/spriteFrame';
const SHEEP_FALLBACK_RESOURCE = 'texture/sheep';
const DEFAULT_SHEEP_FILL_RATE = 0.42;
const DEFAULT_BOARD_PADDING_X = 40;
const DEFAULT_BOARD_PADDING_Y = 120;
const DEFAULT_BOARD_PADDING_BOTTOM = 220;
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

export interface GameLevelConfig {
    rowCount?: number;
    colCount?: number;
    sheepCount?: number;
    fillRate?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
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

    @property({ tooltip: '关卡行数，最大 16' })
    m_LevelRowCount: number = MAX_ROW;
    @property({ tooltip: '关卡列数，最大 8' })
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
    private m_CellWidth: number = 0;
    private m_CellHeight: number = 0;
    private m_BoardWidth: number = 0;
    private m_BoardHeight: number = 0;
    private m_BoardLeft: number = 0;
    private m_BoardTop: number = 0;
    private m_IsMoving: boolean = false;
    private m_SkillMode: SkillMode = 'none';
    private m_SkillRemoveRemain: number = 0;
    private m_LevelEnded: boolean = false;
    private m_OpenLevelConfig: GameLevelConfig = null;

    OnInit(): void {
        this.SetBtnEvent(this.m_SkillOneBtn, () => this.onSkillOneBtnClick());
        this.SetBtnEvent(this.m_SkillTwoBtn, () => this.onSkillTwoBtnClick());
        this.SetBtnEvent(this.m_SkillThreeBtn, () => this.onSkillThreeBtnClick());
    }

    OnOpen(levelConfig?: GameLevelConfig): void {
        this.m_OpenLevelConfig = levelConfig || null;
        this.resetGame();
        this.loadSheepSpriteFrame(() => {
            if (!this.isValid) return;
            this.startLevel();
        });
    }

    OnClose(): void {
        super.OnClose();
        this.clearSheep();
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        this.m_IsMoving = false;
        this.m_LevelEnded = false;
    }

    private resetGame(): void {
        this.clearSheep();
        this.initLevelConfig();
        this.m_SkillMode = 'none';
        this.m_SkillRemoveRemain = 0;
        this.m_IsMoving = false;
        this.m_LevelEnded = false;
        this.initBoardSize();
    }

    private initLevelConfig(): void {
        const config = this.m_OpenLevelConfig;
        this.m_RowCount = this.clampInt(config?.rowCount ?? this.m_LevelRowCount, 1, MAX_ROW);
        this.m_ColCount = this.clampInt(config?.colCount ?? this.m_LevelColCount, 1, MAX_COL);
        this.m_FillRate = this.clampNumber(config?.fillRate ?? this.m_LevelFillRate, 0, 1);
        this.m_SheepCount = this.clampInt(config?.sheepCount ?? this.m_LevelSheepCount, 0, Math.floor(this.m_RowCount * this.m_ColCount * 0.5));
        this.m_PaddingX = Math.max(0, config?.paddingX ?? this.m_BoardPaddingX);
        this.m_PaddingTop = Math.max(0, config?.paddingTop ?? config?.paddingY ?? this.m_BoardPaddingY);
        this.m_PaddingBottom = Math.max(0, config?.paddingBottom ?? config?.paddingY ?? this.m_BoardPaddingBottom);
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

        this.initGrid();
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
        for (let row = 0; row < this.m_RowCount; row++) {
            for (let col = 0; col < this.m_ColCount; col++) {
                if (Math.random() > this.m_FillRate) continue;

                this.createSheep(row, col, this.getRandomDirection());
            }
        }
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

    private createSheep(row: number, col: number, direction: SheepDirection): boolean {
        if (!this.canPlaceSheep(row, col, direction)) return false;

        const footprint = this.getSheepFootprint(direction);
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
        const displayWidth = this.isHorizontalDirection(direction) ? spriteRect.height : spriteRect.width;
        const displayHeight = this.isHorizontalDirection(direction) ? spriteRect.width : spriteRect.height;
        const scale = Math.min(
            this.m_CellWidth * footprint.colSpan * 0.85 / displayWidth,
            this.m_CellHeight * footprint.rowSpan * 0.85 / displayHeight,
        );
        node.setScale(scale, scale, 1);

        const button = node.addComponent(Button);
        this.SetBtnEvent(button, () => this.onSheepClick(sheep));

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
        if (this.m_IsMoving) return;

        const moveResult = this.getMoveResult(sheep);
        const fromRow = sheep.row;
        const fromCol = sheep.col;
        const targetPosition = moveResult.blocked
            ? this.getSheepPosition(moveResult.targetRow, moveResult.targetCol, sheep.direction)
            : this.getRunOutPosition(sheep);

        if (moveResult.blocked && moveResult.targetRow === fromRow && moveResult.targetCol === fromCol) return;

        this.m_IsMoving = true;
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
                sheep.moving = false;
                this.m_IsMoving = false;
                if (!moveResult.blocked) {
                    this.destroySheep(sheep);
                    this.checkLevelEnd();
                }
            })
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
        const cells: { row: number; col: number }[] = [];
        for (let row = 0; row < this.m_RowCount; row++) {
            for (let col = 0; col < this.m_ColCount; col++) {
                cells.push({ row, col });
            }
        }

        for (let i = cells.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            const temp = cells[i];
            cells[i] = cells[randomIndex];
            cells[randomIndex] = temp;
        }

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
