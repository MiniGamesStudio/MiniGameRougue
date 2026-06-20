export const SHEEP_LEVEL_ROW_COUNT = 16;
export const SHEEP_LEVEL_COL_COUNT = 8;

export enum SheepLevelDirection {
    Up = 'Up',
    Right = 'Right',
    Down = 'Down',
    Left = 'Left',
}

export interface SheepLevelItem {
    row: number;
    col: number;
    direction: SheepLevelDirection;
}

export interface SheepLevelData {
    level: number;
    rowCount: number;
    colCount: number;
    sheep: SheepLevelItem[];
}

type Footprint = {
    rowSpan: number;
    colSpan: number;
};

type FootprintRect = Footprint & {
    row: number;
    col: number;
};

type DirectionConfig = {
    rowDelta: number;
    colDelta: number;
};

type SolveSheep = SheepLevelItem & {
    rowSpan: number;
    colSpan: number;
    removed: boolean;
};

const DirectionCycle = [
    SheepLevelDirection.Up,
    SheepLevelDirection.Left,
    SheepLevelDirection.Down,
    SheepLevelDirection.Right,
];

const DirectionConfigs: Record<SheepLevelDirection, DirectionConfig> = {
    [SheepLevelDirection.Up]: { rowDelta: -1, colDelta: 0 },
    [SheepLevelDirection.Right]: { rowDelta: 0, colDelta: 1 },
    [SheepLevelDirection.Down]: { rowDelta: 1, colDelta: 0 },
    [SheepLevelDirection.Left]: { rowDelta: 0, colDelta: -1 },
};

const DefaultLevelCounts = [5, 7, 9, 10, 13, 16, 19, 23, 27, 32];

export class SheepLevelGenerator {
    static generateLevels(levelCounts: number[] = DefaultLevelCounts): SheepLevelData[] {
        const maxCount = Math.max(...levelCounts);
        const chain = this.generateSolvableLayout(maxCount);
        if (chain.length < maxCount) {
            throw new Error(`SheepLevelGenerator: only generated ${chain.length}/${maxCount} sheep`);
        }

        return levelCounts.map((count, index) => ({
            level: index + 1,
            rowCount: SHEEP_LEVEL_ROW_COUNT,
            colCount: SHEEP_LEVEL_COL_COUNT,
            sheep: chain.slice(0, count),
        })).map(level => {
            if (!this.canSolveLevel(level)) {
                throw new Error(`SheepLevelGenerator: generated level ${level.level} is not solvable`);
            }

            return level;
        });
    }

    static generateLevelJson(levelCounts: number[] = DefaultLevelCounts): string {
        return JSON.stringify({ levels: this.generateLevels(levelCounts) }, null, 2);
    }

    static canSolveLevel(level: SheepLevelData): boolean {
        const sheepList = level.sheep.map(sheep => {
            const footprint = this.getFootprint(sheep.direction);
            return {
                ...sheep,
                rowSpan: footprint.rowSpan,
                colSpan: footprint.colSpan,
                removed: false,
            };
        });
        let remainCount = sheepList.length;

        while (remainCount > 0) {
            const removable = sheepList.find(sheep => !sheep.removed && !this.isBlocked(sheep, sheepList));
            if (!removable) return false;

            removable.removed = true;
            remainCount--;
        }

        return true;
    }

    private static generateSolvableLayout(maxCount: number): SheepLevelItem[] {
        const placed: SheepLevelItem[] = [];
        const occupied = this.createOccupiedGrid();
        const centerRow = (SHEEP_LEVEL_ROW_COUNT - 1) * 0.5;
        const centerCol = (SHEEP_LEVEL_COL_COUNT - 1) * 0.5;
        const first: SheepLevelItem = {
            row: Math.max(0, Math.floor(centerRow) - 1),
            col: Math.floor(centerCol),
            direction: SheepLevelDirection.Up,
        };

        if (!this.canPlace(first, occupied)) return placed;

        placed.push(first);
        this.markOccupied(first, occupied);

        while (placed.length < maxCount) {
            const candidates = this.collectCandidates(placed, occupied, centerRow, centerCol);
            if (candidates.length <= 0) break;

            candidates.sort((a, b) => a.score - b.score || a.item.row - b.item.row || a.item.col - b.item.col);
            const next = candidates[0].item;
            placed.push(next);
            this.markOccupied(next, occupied);
        }

        return placed;
    }

    private static collectCandidates(
        placed: SheepLevelItem[],
        occupied: boolean[][],
        centerRow: number,
        centerCol: number,
    ): { item: SheepLevelItem; score: number }[] {
        const candidates: { item: SheepLevelItem; score: number }[] = [];
        for (let directionIndex = 0; directionIndex < DirectionCycle.length; directionIndex++) {
            const direction = DirectionCycle[(placed.length + directionIndex) % DirectionCycle.length];
            for (let row = 0; row < SHEEP_LEVEL_ROW_COUNT; row++) {
                for (let col = 0; col < SHEEP_LEVEL_COL_COUNT; col++) {
                    const item = { row, col, direction };
                    if (!this.canPlace(item, occupied)) continue;
                    if (this.blocksAnyPlacedPath(item, placed)) continue;

                    const centerDistance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
                    const dependencyScore = this.isPathBlockedByPlaced(item, placed) ? 0 : 30;
                    candidates.push({ item, score: dependencyScore + directionIndex * 100 + centerDistance });
                }
            }
        }

        return candidates;
    }

    private static createOccupiedGrid(): boolean[][] {
        const grid: boolean[][] = [];
        for (let row = 0; row < SHEEP_LEVEL_ROW_COUNT; row++) {
            const rowData: boolean[] = [];
            for (let col = 0; col < SHEEP_LEVEL_COL_COUNT; col++) {
                rowData.push(false);
            }
            grid.push(rowData);
        }

        return grid;
    }

    private static canPlace(item: SheepLevelItem, occupied: boolean[][]): boolean {
        const footprint = this.getFootprint(item.direction);
        if (!this.isFootprintInside(item.row, item.col, footprint)) return false;

        for (let rowOffset = 0; rowOffset < footprint.rowSpan; rowOffset++) {
            for (let colOffset = 0; colOffset < footprint.colSpan; colOffset++) {
                if (occupied[item.row + rowOffset][item.col + colOffset]) return false;
            }
        }

        return true;
    }

    private static markOccupied(item: SheepLevelItem, occupied: boolean[][]): void {
        const footprint = this.getFootprint(item.direction);
        for (let rowOffset = 0; rowOffset < footprint.rowSpan; rowOffset++) {
            for (let colOffset = 0; colOffset < footprint.colSpan; colOffset++) {
                occupied[item.row + rowOffset][item.col + colOffset] = true;
            }
        }
    }

    private static blocksAnyPlacedPath(item: SheepLevelItem, placed: SheepLevelItem[]): boolean {
        const itemRect = this.getRect(item);
        return placed.some(placedItem => this.getPathRects(placedItem).some(pathRect => this.rectsOverlap(itemRect, pathRect)));
    }

    private static isPathBlockedByPlaced(item: SheepLevelItem, placed: SheepLevelItem[]): boolean {
        const pathRects = this.getPathRects(item);
        return placed.some(placedItem => {
            const placedRect = this.getRect(placedItem);
            return pathRects.some(pathRect => this.rectsOverlap(placedRect, pathRect));
        });
    }

    private static isBlocked(sheep: SolveSheep, sheepList: SolveSheep[]): boolean {
        const pathRects = this.getPathRects(sheep);
        return sheepList.some(other => {
            if (other === sheep || other.removed) return false;

            const otherRect = this.getRect(other);
            return pathRects.some(pathRect => this.rectsOverlap(otherRect, pathRect));
        });
    }

    private static getPathRects(item: SheepLevelItem): FootprintRect[] {
        const config = DirectionConfigs[item.direction];
        const footprint = this.getFootprint(item.direction);
        const rects: FootprintRect[] = [];
        let row = item.row + config.rowDelta;
        let col = item.col + config.colDelta;

        while (this.isFootprintInside(row, col, footprint)) {
            rects.push({ row, col, rowSpan: footprint.rowSpan, colSpan: footprint.colSpan });
            row += config.rowDelta;
            col += config.colDelta;
        }

        return rects;
    }

    private static getRect(item: SheepLevelItem | SolveSheep): FootprintRect {
        const footprint = 'rowSpan' in item
            ? { rowSpan: item.rowSpan, colSpan: item.colSpan }
            : this.getFootprint(item.direction);

        return {
            row: item.row,
            col: item.col,
            rowSpan: footprint.rowSpan,
            colSpan: footprint.colSpan,
        };
    }

    private static rectsOverlap(a: FootprintRect, b: FootprintRect): boolean {
        return a.row < b.row + b.rowSpan
            && a.row + a.rowSpan > b.row
            && a.col < b.col + b.colSpan
            && a.col + a.colSpan > b.col;
    }

    private static isFootprintInside(row: number, col: number, footprint: Footprint): boolean {
        return row >= 0
            && col >= 0
            && row + footprint.rowSpan <= SHEEP_LEVEL_ROW_COUNT
            && col + footprint.colSpan <= SHEEP_LEVEL_COL_COUNT;
    }

    private static getFootprint(direction: SheepLevelDirection): Footprint {
        if (direction === SheepLevelDirection.Left || direction === SheepLevelDirection.Right) {
            return { rowSpan: 1, colSpan: 2 };
        }

        return { rowSpan: 2, colSpan: 1 };
    }
}
