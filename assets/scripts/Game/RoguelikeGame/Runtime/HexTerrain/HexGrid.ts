// Runtime/HexTerrain/HexGrid.ts

import { AxialCoord, HexCoordinate } from './HexCoordinate';

/** 六角格单元 */
export interface HexCell {
    /** 轴向坐标 */
    coord: AxialCoord;
    /** 地形类型标识符（对应 TypeRegistry 中的 typeId） */
    terrainTypeId: string;
    /** 海拔值（0.0 ~ 1.0） */
    elevation: number;
    /** 是否可通行 */
    walkable: boolean;
    /** 地形效果标识符列表 */
    effectIds: string[];
    /** 运行时状态 */
    runtimeState: CellRuntimeState;
}

/** 格子运行时状态 */
export interface CellRuntimeState {
    /** 迷雾可见状态 */
    visibility: CellVisibility;
    /** 是否有实体占据 */
    occupied: boolean;
}

/** 格子可见状态 */
export enum CellVisibility {
    Unexplored = 0,  // 未探索（完全遮罩）
    Explored = 1,    // 已探索但不在视野内（半透明遮罩）
    Visible = 2,     // 当前视野内（完全可见）
}

/** 地图边界形状 */
export enum MapBoundaryShape {
    Rectangle = 0,
    Hexagon = 1,
    Rhombus = 2,
}

/**
 * 六角格网格
 * 使用 Map<string, HexCell> 存储，键为 "q,r" 格式的坐标字符串
 */
export class HexGrid {
    private _cells: Map<string, HexCell> = new Map();
    private _width: number;
    private _height: number;
    private _boundaryShape: MapBoundaryShape;

    constructor(width: number, height: number,
                boundaryShape: MapBoundaryShape = MapBoundaryShape.Rectangle) {
        this._width = width;
        this._height = height;
        this._boundaryShape = boundaryShape;
    }

    get width(): number { return this._width; }
    get height(): number { return this._height; }
    get boundaryShape(): MapBoundaryShape { return this._boundaryShape; }
    get cellCount(): number { return this._cells.size; }

    /** 设置格子数据 */
    setCell(coord: AxialCoord, cell: HexCell): void {
        this._cells.set(HexCoordinate.toKey(coord), cell);
    }

    /** 按坐标查询格子，不存在时返回 null */
    getCell(coord: AxialCoord): HexCell | null {
        return this._cells.get(HexCoordinate.toKey(coord)) ?? null;
    }

    /** 检查坐标是否在地图边界内 */
    isInBounds(coord: AxialCoord): boolean {
        return this._cells.has(HexCoordinate.toKey(coord));
    }

    /** 遍历所有格子 */
    forEach(callback: (cell: HexCell, key: string) => void): void {
        this._cells.forEach(callback);
    }

    /** 获取所有格子的迭代器 */
    cells(): IterableIterator<HexCell> {
        return this._cells.values();
    }

    /** 获取所有可通行的邻居格子 */
    getWalkableNeighbors(coord: AxialCoord): HexCell[] {
        return HexCoordinate.neighbors(coord)
            .map(n => this.getCell(n))
            .filter((c): c is HexCell => c !== null && c.walkable);
    }

    // ─── 序列化 ─────────────────────────────────────

    /** 序列化为 JSON 对象 */
    serialize(compact: boolean = false): object {
        const cells: any[] = [];
        for (const cell of this._cells.values()) {
            if (compact) {
                const entry: any = {
                    q: cell.coord.q, r: cell.coord.r,
                    t: cell.terrainTypeId,
                };
                if (cell.elevation !== 0) entry.e = cell.elevation;
                if (!cell.walkable) entry.w = false;
                if (cell.effectIds.length > 0) entry.fx = cell.effectIds;
                if (cell.runtimeState.visibility !== CellVisibility.Unexplored) {
                    entry.v = cell.runtimeState.visibility;
                }
                cells.push(entry);
            } else {
                cells.push({
                    coord: cell.coord,
                    terrainTypeId: cell.terrainTypeId,
                    elevation: cell.elevation,
                    walkable: cell.walkable,
                    effectIds: cell.effectIds,
                    runtimeState: cell.runtimeState,
                });
            }
        }
        return {
            width: this._width,
            height: this._height,
            boundaryShape: this._boundaryShape,
            cells,
        };
    }

    /** 从 JSON 对象反序列化，数据不合法时返回错误信息 */
    static deserialize(data: any): HexGrid | { error: string } {
        if (!data || typeof data !== 'object') {
            return { error: '输入数据不是有效对象' };
        }
        if (typeof data.width !== 'number' || typeof data.height !== 'number') {
            return { error: '缺少 width 或 height 字段' };
        }
        if (!Array.isArray(data.cells)) {
            return { error: '缺少 cells 数组字段' };
        }

        const grid = new HexGrid(data.width, data.height,
            data.boundaryShape ?? MapBoundaryShape.Rectangle);

        for (let i = 0; i < data.cells.length; i++) {
            const entry = data.cells[i];
            const coord: AxialCoord = entry.coord ?? { q: entry.q, r: entry.r };

            if (typeof coord.q !== 'number' || typeof coord.r !== 'number') {
                return { error: `cells[${i}] 坐标数据不合法` };
            }

            const terrainTypeId = entry.terrainTypeId ?? entry.t;
            if (typeof terrainTypeId !== 'string') {
                return { error: `cells[${i}] 缺少地形类型标识符` };
            }

            const cell: HexCell = {
                coord,
                terrainTypeId,
                elevation: entry.elevation ?? entry.e ?? 0,
                walkable: entry.walkable ?? entry.w ?? true,
                effectIds: entry.effectIds ?? entry.fx ?? [],
                runtimeState: entry.runtimeState ?? {
                    visibility: entry.v ?? CellVisibility.Unexplored,
                    occupied: false,
                },
            };
            grid.setCell(coord, cell);
        }

        return grid;
    }
}
