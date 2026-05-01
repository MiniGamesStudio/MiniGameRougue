/**
 * 六角格渲染器
 * 管理六角格瓦片节点的创建、回收和视觉更新
 * 使用抽象接口解耦 Cocos Creator API 依赖，实际运行时由引擎层提供实现
 */

import { HexGrid, CellVisibility } from './HexGrid';
import { AxialCoord, HexCoordinate, HexLayout } from './HexCoordinate';

// ─── 抽象接口（运行时映射到 Cocos Creator 类型） ─────────

/** 抽象瓦片节点接口（映射到 cc.Node） */
export interface IHexTileNode {
    setPosition(x: number, y: number, z: number): void;
    removeFromParent(): void;
    active: boolean;
}

/** 抽象对象池接口（映射到 ObjectPool） */
export interface IHexTilePool {
    get(): IHexTileNode;
    put(node: IHexTileNode): void;
}

/** 抽象父节点接口 */
export interface IHexRootNode {
    addChild(node: IHexTileNode): void;
}

/**
 * 六角格渲染器
 * 按需渲染视野范围内的六角格瓦片，回收离开视野的瓦片节点
 */
export class HexRenderer {
    private _rootNode: IHexRootNode;
    private _tilePool: IHexTilePool;
    private _layout: HexLayout;

    /** 当前活跃的瓦片节点：坐标键 → 瓦片节点 */
    private _activeTiles: Map<string, IHexTileNode> = new Map();
    /** 当前高亮的格子坐标键 */
    private _highlightedKey: string | null = null;

    /**
     * @param rootNode 瓦片节点的父容器
     * @param tilePool 瓦片节点对象池
     * @param layout 六角格布局参数
     */
    constructor(rootNode: IHexRootNode, tilePool: IHexTilePool, layout: HexLayout) {
        this._rootNode = rootNode;
        this._tilePool = tilePool;
        this._layout = layout;
    }

    /**
     * 更新视野范围内的瓦片渲染
     * 创建新进入视野的瓦片，回收离开视野的瓦片
     * @param grid 六角格网格数据
     * @param centerCoord 视野中心坐标
     * @param viewRadius 视野半径（格子数）
     */
    updateView(grid: HexGrid, centerCoord: AxialCoord, viewRadius: number): void {
        const visibleCoords = HexCoordinate.range(centerCoord, viewRadius);
        const newVisibleKeys = new Set<string>();

        // 1. 渲染视野范围内的格子
        for (const coord of visibleCoords) {
            const cell = grid.getCell(coord);
            if (!cell) continue;

            const key = HexCoordinate.toKey(coord);
            newVisibleKeys.add(key);

            let tileNode = this._activeTiles.get(key);
            if (!tileNode) {
                // 新进入视野的格子，从对象池获取节点
                tileNode = this._tilePool.get();
                this._setupTileNode(tileNode, coord);
                this._rootNode.addChild(tileNode);
                this._activeTiles.set(key, tileNode);
            }

            // 更新地形视觉
            this._applyTerrainVisual(tileNode, cell.terrainTypeId);
            this._applyTerrainIcon(tileNode, cell.terrainTypeId);
            this._updateTileVisibility(tileNode, cell.runtimeState.visibility);
        }

        // 2. 回收离开视野的瓦片
        for (const [key, tileNode] of this._activeTiles) {
            if (!newVisibleKeys.has(key)) {
                tileNode.removeFromParent();
                this._tilePool.put(tileNode);
                this._activeTiles.delete(key);

                // 如果回收的是高亮格子，清除高亮状态
                if (this._highlightedKey === key) {
                    this._highlightedKey = null;
                }
            }
        }
    }

    /**
     * 高亮指定格子
     * @param coord 要高亮的格子坐标
     */
    highlightCell(coord: AxialCoord): void {
        const key = HexCoordinate.toKey(coord);

        // 取消之前的高亮
        if (this._highlightedKey && this._highlightedKey !== key) {
            const prevTile = this._activeTiles.get(this._highlightedKey);
            if (prevTile) {
                this._setHighlight(prevTile, false);
            }
        }

        // 设置新高亮
        const tileNode = this._activeTiles.get(key);
        if (tileNode) {
            this._setHighlight(tileNode, true);
            this._highlightedKey = key;
        }
    }

    /**
     * 清空所有渲染瓦片，回收到对象池
     */
    clear(): void {
        for (const [_key, tileNode] of this._activeTiles) {
            tileNode.removeFromParent();
            this._tilePool.put(tileNode);
        }
        this._activeTiles.clear();
        this._highlightedKey = null;
    }

    /** 获取当前活跃瓦片数量（用于调试） */
    get activeTileCount(): number {
        return this._activeTiles.size;
    }

    // ─── 私有方法 ───────────────────────────────────

    /**
     * 设置瓦片节点的位置
     * @param tileNode 瓦片节点
     * @param coord 轴向坐标
     */
    private _setupTileNode(tileNode: IHexTileNode, coord: AxialCoord): void {
        const pixel = HexCoordinate.axialToPixel(coord, this._layout);
        tileNode.setPosition(pixel.x, pixel.y, 0);
        tileNode.active = true;
    }

    /**
     * 应用地形类型的视觉样式（颜色/纹理）
     * 实际实现中会根据 terrainTypeId 设置 Sprite 纹理
     * @param _tileNode 瓦片节点
     * @param _terrainTypeId 地形类型标识符
     */
    private _applyTerrainVisual(_tileNode: IHexTileNode, _terrainTypeId: string): void {
        // 运行时实现：根据 terrainTypeId 加载对应纹理并设置到 Sprite 组件
        // 此处为框架占位，具体视觉逻辑在 Cocos Creator 环境中实现
    }

    /**
     * 应用地形类型的图标标识
     * @param _tileNode 瓦片节点
     * @param _terrainTypeId 地形类型标识符
     */
    private _applyTerrainIcon(_tileNode: IHexTileNode, _terrainTypeId: string): void {
        // 运行时实现：根据 terrainTypeId 设置地形图标
        // 此处为框架占位
    }

    /**
     * 根据迷雾可见状态更新瓦片的显示效果
     * @param tileNode 瓦片节点
     * @param visibility 格子可见状态
     */
    private _updateTileVisibility(tileNode: IHexTileNode, visibility: CellVisibility): void {
        switch (visibility) {
            case CellVisibility.Unexplored:
                tileNode.active = false;
                break;
            case CellVisibility.Explored:
                tileNode.active = true;
                // 运行时实现：设置半透明遮罩效果
                break;
            case CellVisibility.Visible:
                tileNode.active = true;
                // 运行时实现：完全可见，无遮罩
                break;
        }
    }

    /**
     * 设置瓦片的高亮状态
     * @param _tileNode 瓦片节点
     * @param _highlighted 是否高亮
     */
    private _setHighlight(_tileNode: IHexTileNode, _highlighted: boolean): void {
        // 运行时实现：设置高亮边框或发光效果
        // 此处为框架占位
    }
}
