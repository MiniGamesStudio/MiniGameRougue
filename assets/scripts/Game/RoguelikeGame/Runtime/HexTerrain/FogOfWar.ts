// Runtime/HexTerrain/FogOfWar.ts

import { HexGrid, CellVisibility } from './HexGrid';
import { AxialCoord, HexCoordinate } from './HexCoordinate';

/** 迷雾配置 */
export interface FogOfWarConfig {
    /** 基础视野半径（格子数） */
    baseViewRadius: number;
}

/**
 * 战争迷雾系统
 * 管理六角格地图的可见状态，根据玩家位置和地形类型动态更新视野
 */
export class FogOfWar {
    private _config: FogOfWarConfig;
    private _grid: HexGrid | null = null;
    /** 当前视野内的格子坐标键集合 */
    private _currentVisible: Set<string> = new Set();

    constructor(config: FogOfWarConfig) {
        this._config = config;
    }

    /**
     * 初始化迷雾，将所有格子设为未探索状态
     * @param grid 六角格网格
     */
    init(grid: HexGrid): void {
        this._grid = grid;
        this._currentVisible.clear();
        grid.forEach(cell => {
            cell.runtimeState.visibility = CellVisibility.Unexplored;
        });
    }

    /**
     * 更新玩家视野
     * @param playerCoord 玩家当前所在的轴向坐标
     * @param viewRadiusModifier 视野半径修正值（森林 -1，山地 +1），默认 0
     * @returns 新揭开的格子坐标列表（从 Unexplored 变为 Visible 的格子）
     */
    updateVisibility(
        playerCoord: AxialCoord,
        viewRadiusModifier: number = 0
    ): AxialCoord[] {
        if (!this._grid) return [];

        const radius = Math.max(1, this._config.baseViewRadius + viewRadiusModifier);
        const newVisible = new Set<string>();
        const newlyRevealed: AxialCoord[] = [];

        // 计算新视野范围
        const visibleCoords = HexCoordinate.range(playerCoord, radius);
        for (const coord of visibleCoords) {
            const cell = this._grid.getCell(coord);
            if (!cell) continue;

            const key = HexCoordinate.toKey(coord);
            newVisible.add(key);

            if (cell.runtimeState.visibility !== CellVisibility.Visible) {
                if (cell.runtimeState.visibility === CellVisibility.Unexplored) {
                    newlyRevealed.push(coord);
                }
                cell.runtimeState.visibility = CellVisibility.Visible;
            }
        }

        // 将离开视野的格子设为已探索（不回退到 Unexplored）
        for (const prevKey of this._currentVisible) {
            if (!newVisible.has(prevKey)) {
                const coord = HexCoordinate.fromKey(prevKey);
                const cell = this._grid.getCell(coord);
                if (cell) {
                    cell.runtimeState.visibility = CellVisibility.Explored;
                }
            }
        }

        this._currentVisible = newVisible;
        return newlyRevealed;
    }

    /**
     * 获取指定格子的可见状态
     * @param coord 轴向坐标
     * @returns 格子的可见状态
     */
    getVisibility(coord: AxialCoord): CellVisibility {
        if (!this._grid) return CellVisibility.Unexplored;
        const cell = this._grid.getCell(coord);
        return cell?.runtimeState.visibility ?? CellVisibility.Unexplored;
    }
}
