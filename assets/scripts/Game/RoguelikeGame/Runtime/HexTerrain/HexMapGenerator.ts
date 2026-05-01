// Runtime/HexTerrain/HexMapGenerator.ts

import { IHexTerrainType } from '../../Data/Interfaces/IHexTerrainType';
import { HexGrid, HexCell, CellVisibility, MapBoundaryShape } from './HexGrid';
import { AxialCoord, HexCoordinate } from './HexCoordinate';
import { SimplexNoise } from './SimplexNoise';

/**
 * 地形类型查找接口
 * 用于解耦 TypeRegistry（可能依赖 Cocos Creator）的直接引用，
 * 使 HexMapGenerator 可在 Node.js 环境中测试
 */
export interface TerrainTypeLookup {
    create(typeId: string): IHexTerrainType | null;
}

/** 地图生成配置 */
export interface HexMapConfig {
    /** 地图宽度（格子数） */
    width: number;
    /** 地图高度（格子数） */
    height: number;
    /** 地图边界形状 */
    boundaryShape: MapBoundaryShape;
    /** 随机种子 */
    seed: number;
    /** 噪声基础频率 */
    noiseFrequency: number;
    /** 噪声基础振幅 */
    noiseAmplitude: number;
    /** 噪声叠加层数 */
    noiseOctaves: number;
    /** 地形海拔阈值映射：terrainTypeId → [minElevation, maxElevation) */
    elevationThresholds: Record<string, [number, number]>;
    /** 温度噪声频率（用于沙漠判定） */
    temperatureFrequency: number;
    /** 温度阈值（高于此值的平原区域转为沙漠） */
    temperatureThreshold: number;
    /** 楼层深度（影响地形分布） */
    floorDepth: number;
    /** 楼层难度曲线：每层增加的山地/沼泽比例偏移 */
    difficultyBias: number;
}

/**
 * 六角格地图生成器
 * 使用 Simplex Noise 程序化生成六角格地形地图
 */
export class HexMapGenerator {
    private _terrainRegistry: TerrainTypeLookup;

    constructor(terrainRegistry: TerrainTypeLookup) {
        this._terrainRegistry = terrainRegistry;
    }

    /**
     * 生成六角格地图
     * @param config 地图生成配置
     * @returns 填充完成的 HexGrid 实例
     */
    generate(config: HexMapConfig): HexGrid {
        const grid = new HexGrid(config.width, config.height, config.boundaryShape);
        const noise = new SimplexNoise(config.seed);
        const tempNoise = new SimplexNoise(config.seed + 1);

        // 1. 生成边界内的所有坐标
        const coords = this._generateBoundaryCoords(config);

        // 2. 为每个坐标生成海拔值和地形类型
        for (const coord of coords) {
            const elevation = noise.fbm(
                coord.q, coord.r,
                config.noiseOctaves,
                config.noiseFrequency,
                config.noiseAmplitude
            );

            // 楼层深度偏移：更深楼层增加高海拔和低海拔比例
            const biasedElevation = this._applyDifficultyBias(
                elevation, config.floorDepth, config.difficultyBias
            );

            // 温度噪声（用于沙漠判定）
            const temperature = tempNoise.fbm(
                coord.q, coord.r, 2,
                config.temperatureFrequency, 1.0
            );

            const terrainTypeId = this._mapElevationToTerrain(
                biasedElevation, temperature, config
            );

            const terrainType = this._terrainRegistry.create(terrainTypeId);

            const cell: HexCell = {
                coord,
                terrainTypeId,
                elevation: biasedElevation,
                walkable: terrainType?.walkable ?? true,
                effectIds: terrainType?.effectIds ?? [],
                runtimeState: {
                    visibility: CellVisibility.Unexplored,
                    occupied: false,
                },
            };
            grid.setCell(coord, cell);
        }

        // 3. 验证并修复连通性
        this._ensureConnectivity(grid);

        return grid;
    }

    /** 根据地图边界形状生成所有有效坐标 */
    private _generateBoundaryCoords(config: HexMapConfig): AxialCoord[] {
        const coords: AxialCoord[] = [];
        const { width, height, boundaryShape } = config;

        switch (boundaryShape) {
            case MapBoundaryShape.Rectangle:
                for (let r = 0; r < height; r++) {
                    const rOffset = Math.floor(r / 2);
                    for (let q = -rOffset; q < width - rOffset; q++) {
                        coords.push({ q, r });
                    }
                }
                break;
            case MapBoundaryShape.Hexagon: {
                const radius = Math.floor(Math.min(width, height) / 2);
                coords.push(...HexCoordinate.range({ q: 0, r: 0 }, radius));
                break;
            }
            case MapBoundaryShape.Rhombus:
                for (let q = 0; q < width; q++) {
                    for (let r = 0; r < height; r++) {
                        coords.push({ q, r });
                    }
                }
                break;
        }
        return coords;
    }

    /** 根据海拔值和温度映射到地形类型 */
    private _mapElevationToTerrain(
        elevation: number, temperature: number, config: HexMapConfig
    ): string {
        // 优先检查沙漠条件：平原海拔范围 + 高温
        const plainsRange = config.elevationThresholds['plains'];
        if (plainsRange &&
            elevation >= plainsRange[0] && elevation < plainsRange[1] &&
            temperature > config.temperatureThreshold) {
            return 'desert';
        }

        // 按海拔阈值匹配地形类型
        const thresholds = config.elevationThresholds;
        const typeIds = Object.keys(thresholds);
        for (let i = 0; i < typeIds.length; i++) {
            const typeId = typeIds[i];
            const range = thresholds[typeId];
            if (elevation >= range[0] && elevation < range[1]) {
                return typeId;
            }
        }

        return 'plains'; // 默认平原
    }

    /** 应用楼层难度偏移 */
    private _applyDifficultyBias(
        elevation: number, floorDepth: number, bias: number
    ): number {
        // 更深楼层将中间海拔向两端推移，增加极端地形比例
        const offset = floorDepth * bias;
        const centered = elevation - 0.5;
        const biased = centered * (1 + offset) + 0.5;
        return Math.max(0, Math.min(1, biased));
    }

    /**
     * 验证并修复地图连通性
     * 使用 BFS 检查所有可通行格子是否连通，
     * 不连通时将隔断格子转换为平原
     */
    private _ensureConnectivity(grid: HexGrid): void {
        // 找到第一个可通行格子作为起点
        let startCoord: AxialCoord | null = null;
        const walkableCoords: AxialCoord[] = [];

        grid.forEach(cell => {
            if (cell.walkable) {
                walkableCoords.push(cell.coord);
                if (!startCoord) startCoord = cell.coord;
            }
        });

        if (!startCoord || walkableCoords.length <= 1) return;

        // BFS 从起点遍历所有可达的可通行格子
        const visited = new Set<string>();
        const queue: AxialCoord[] = [startCoord];
        visited.add(HexCoordinate.toKey(startCoord));

        while (queue.length > 0) {
            const current = queue.shift()!;
            for (const neighbor of grid.getWalkableNeighbors(current)) {
                const key = HexCoordinate.toKey(neighbor.coord);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(neighbor.coord);
                }
            }
        }

        // 检查是否有不可达的可通行格子
        const unreachable = walkableCoords.filter(
            c => !visited.has(HexCoordinate.toKey(c))
        );

        if (unreachable.length === 0) return;

        // 修复：在已达区域和未达区域之间找到最短路径上的不可通行格子，转为平原
        for (const target of unreachable) {
            this._connectToMainland(grid, target, visited);
        }
    }

    /** 将孤立的可通行格子连接到主连通区域 */
    private _connectToMainland(
        grid: HexGrid, target: AxialCoord, mainlandKeys: Set<string>
    ): void {
        // 从 target 向外 BFS 扩展，直到碰到 mainland 中的格子
        // 沿途将不可通行格子转为平原
        const visited = new Set<string>();
        const queue: Array<{ coord: AxialCoord; path: AxialCoord[] }> = [
            { coord: target, path: [] }
        ];
        visited.add(HexCoordinate.toKey(target));

        while (queue.length > 0) {
            const { coord, path } = queue.shift()!;

            for (const neighborCoord of HexCoordinate.neighbors(coord)) {
                const key = HexCoordinate.toKey(neighborCoord);
                if (visited.has(key)) continue;
                visited.add(key);

                const cell = grid.getCell(neighborCoord);
                if (!cell) continue;

                const newPath = [...path, neighborCoord];

                if (mainlandKeys.has(key)) {
                    // 找到连接点，将路径上的不可通行格子转为平原
                    for (const pathCoord of newPath) {
                        const pathCell = grid.getCell(pathCoord);
                        if (pathCell && !pathCell.walkable) {
                            pathCell.terrainTypeId = 'plains';
                            pathCell.walkable = true;
                            pathCell.effectIds = [];
                            mainlandKeys.add(HexCoordinate.toKey(pathCoord));
                        }
                    }
                    return;
                }

                queue.push({ coord: neighborCoord, path: newPath });
            }
        }
    }
}
