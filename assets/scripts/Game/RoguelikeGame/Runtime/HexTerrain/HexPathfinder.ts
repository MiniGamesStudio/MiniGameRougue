// Runtime/HexTerrain/HexPathfinder.ts

import { AxialCoord, HexCoordinate } from './HexCoordinate';
import { HexGrid } from './HexGrid';
import { IHexTerrainType } from '../../Data/Interfaces/IHexTerrainType';

/** 寻路结果 */
export interface PathResult {
    /** 是否找到路径 */
    found: boolean;
    /** 路径坐标序列（从起点到终点，包含两端） */
    path: AxialCoord[];
    /** 路径总代价 */
    totalCost: number;
}

/**
 * 地形类型查找接口
 * 用于解耦 TypeRegistry 的直接引用，使 HexPathfinder 可在 Node.js 环境中测试
 */
export interface TerrainTypeLookup {
    create(typeId: string): IHexTerrainType | null;
}

/**
 * 六角格 A* 寻路器
 * 路径代价 = 1 / moveSpeedModifier（移动速度越慢代价越高）
 * 不可通行格子不会出现在路径中
 */
export class HexPathfinder {
    private _terrainRegistry: TerrainTypeLookup;

    constructor(terrainRegistry: TerrainTypeLookup) {
        this._terrainRegistry = terrainRegistry;
    }

    /**
     * 在六角格网格上执行 A* 寻路
     * @param grid 六角格网格
     * @param start 起点坐标
     * @param goal 终点坐标
     * @returns 寻路结果
     */
    findPath(grid: HexGrid, start: AxialCoord, goal: AxialCoord): PathResult {
        // 边界检查：起点或终点不在地图内
        if (!grid.isInBounds(start) || !grid.isInBounds(goal)) {
            return { found: false, path: [], totalCost: 0 };
        }

        // 终点不可通行
        const goalCell = grid.getCell(goal);
        if (!goalCell || !goalCell.walkable) {
            return { found: false, path: [], totalCost: 0 };
        }

        // 起点不可通行
        const startCell = grid.getCell(start);
        if (!startCell || !startCell.walkable) {
            return { found: false, path: [], totalCost: 0 };
        }

        const startKey = HexCoordinate.toKey(start);
        const goalKey = HexCoordinate.toKey(goal);

        // 起点和终点相同
        if (startKey === goalKey) {
            return { found: true, path: [start], totalCost: 0 };
        }

        // A* 数据结构
        const openSet = new Map<string, number>(); // key → fScore
        const cameFrom = new Map<string, string>();
        const gScore = new Map<string, number>();

        gScore.set(startKey, 0);
        openSet.set(startKey, HexCoordinate.distance(start, goal));

        while (openSet.size > 0) {
            // 取 fScore 最小的节点
            let currentKey = '';
            let minF = Infinity;
            for (const [key, f] of openSet) {
                if (f < minF) {
                    minF = f;
                    currentKey = key;
                }
            }

            if (currentKey === goalKey) {
                return this._reconstructPath(cameFrom, gScore, currentKey);
            }

            openSet.delete(currentKey);
            const currentCoord = HexCoordinate.fromKey(currentKey);

            for (const neighbor of grid.getWalkableNeighbors(currentCoord)) {
                const neighborKey = HexCoordinate.toKey(neighbor.coord);

                // 移动代价 = 1 / moveSpeedModifier
                const terrain = this._terrainRegistry.create(neighbor.terrainTypeId);
                const moveSpeedMod = terrain
                    ? Math.max(0.01, terrain.moveSpeedModifier)
                    : 1;
                const moveCost = 1 / moveSpeedMod;

                const tentativeG = (gScore.get(currentKey) ?? Infinity) + moveCost;

                if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
                    cameFrom.set(neighborKey, currentKey);
                    gScore.set(neighborKey, tentativeG);
                    const fScore = tentativeG + HexCoordinate.distance(neighbor.coord, goal);
                    openSet.set(neighborKey, fScore);
                }
            }
        }

        // 未找到路径
        return { found: false, path: [], totalCost: 0 };
    }

    /** 从 cameFrom 映射重建路径 */
    private _reconstructPath(
        cameFrom: Map<string, string>,
        gScore: Map<string, number>,
        goalKey: string
    ): PathResult {
        const path: AxialCoord[] = [];
        let current: string | undefined = goalKey;

        while (current !== undefined) {
            path.unshift(HexCoordinate.fromKey(current));
            current = cameFrom.get(current);
        }

        return {
            found: true,
            path,
            totalCost: gScore.get(goalKey) ?? 0,
        };
    }
}
