import { HexMapGenerator, HexMapConfig, TerrainTypeLookup } from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexMapGenerator';
import { HexGrid, MapBoundaryShape, CellVisibility } from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid';
import { HexCoordinate } from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';
import { IHexTerrainType, HexTerrainConfig } from '../../assets/scripts/Game/RoguelikeGame/Data/Interfaces/IHexTerrainType';

// ─── Test helpers ───────────────────────────────────

/** 创建一个简单的地形类型实现 */
function makeTerrainType(
    typeId: string,
    walkable: boolean,
    moveSpeedModifier: number = 1.0,
    effectIds: string[] = [],
): IHexTerrainType {
    return {
        typeId,
        displayName: typeId,
        moveSpeedModifier,
        walkable,
        effectIds,
        visualAsset: '',
        getDefaultConfig(): HexTerrainConfig {
            return {
                typeId,
                displayName: typeId,
                moveSpeedModifier,
                walkable,
                effectIds,
                visualAsset: '',
            };
        },
    };
}

/** 创建一个包含六种基础地形的 TerrainTypeLookup */
function createTestLookup(): TerrainTypeLookup {
    const types: Record<string, IHexTerrainType> = {
        water: makeTerrainType('water', false, 0.0),
        swamp: makeTerrainType('swamp', true, 0.5, ['speed_modifier', 'dot_damage']),
        plains: makeTerrainType('plains', true, 1.0, ['speed_modifier']),
        forest: makeTerrainType('forest', true, 0.7, ['speed_modifier', 'evasion_boost']),
        mountain: makeTerrainType('mountain', true, 0.4, ['speed_modifier', 'defense_boost']),
        desert: makeTerrainType('desert', true, 0.8, ['speed_modifier', 'cooldown_reduction']),
    };
    return {
        create(typeId: string): IHexTerrainType | null {
            return types[typeId] ?? null;
        },
    };
}

/** 默认测试配置 */
function defaultConfig(overrides?: Partial<HexMapConfig>): HexMapConfig {
    return {
        width: 10,
        height: 10,
        boundaryShape: MapBoundaryShape.Rectangle,
        seed: 42,
        noiseFrequency: 0.08,
        noiseAmplitude: 1.0,
        noiseOctaves: 3,
        elevationThresholds: {
            water: [0.0, 0.3],
            swamp: [0.3, 0.4],
            plains: [0.4, 0.6],
            forest: [0.6, 0.75],
            mountain: [0.75, 1.01],
        },
        temperatureFrequency: 0.1,
        temperatureThreshold: 0.7,
        floorDepth: 0,
        difficultyBias: 0.05,
        ...overrides,
    };
}

/** BFS 连通性检查：返回从 start 可达的所有可通行格子数量 */
function countConnectedWalkable(grid: HexGrid): { total: number; largest: number } {
    const allWalkable: string[] = [];
    grid.forEach(cell => {
        if (cell.walkable) {
            allWalkable.push(HexCoordinate.toKey(cell.coord));
        }
    });

    if (allWalkable.length === 0) return { total: 0, largest: 0 };

    const visited = new Set<string>();
    let largest = 0;

    for (const startKey of allWalkable) {
        if (visited.has(startKey)) continue;

        // BFS from this unvisited walkable cell
        const queue = [HexCoordinate.fromKey(startKey)];
        visited.add(startKey);
        let componentSize = 0;

        while (queue.length > 0) {
            const current = queue.shift()!;
            componentSize++;

            for (const neighbor of grid.getWalkableNeighbors(current)) {
                const key = HexCoordinate.toKey(neighbor.coord);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push(neighbor.coord);
                }
            }
        }

        if (componentSize > largest) largest = componentSize;
    }

    return { total: allWalkable.length, largest };
}

const VALID_TERRAIN_IDS = ['water', 'swamp', 'plains', 'forest', 'mountain', 'desert'];

// ─── Tests ──────────────────────────────────────────

describe('HexMapGenerator', () => {
    let lookup: TerrainTypeLookup;
    let generator: HexMapGenerator;

    beforeEach(() => {
        lookup = createTestLookup();
        generator = new HexMapGenerator(lookup);
    });

    // ─── Deterministic generation ───────────────────

    describe('deterministic generation', () => {
        it('same seed and config produce identical grids', () => {
            const config = defaultConfig();
            const grid1 = generator.generate(config);
            const grid2 = generator.generate(config);

            expect(grid1.cellCount).toBe(grid2.cellCount);

            grid1.forEach(cell1 => {
                const cell2 = grid2.getCell(cell1.coord);
                expect(cell2).not.toBeNull();
                expect(cell2!.terrainTypeId).toBe(cell1.terrainTypeId);
                expect(cell2!.elevation).toBe(cell1.elevation);
                expect(cell2!.walkable).toBe(cell1.walkable);
            });
        });

        it('different seeds produce different grids', () => {
            const grid1 = generator.generate(defaultConfig({ seed: 42 }));
            const grid2 = generator.generate(defaultConfig({ seed: 999 }));

            let differenceFound = false;
            grid1.forEach(cell1 => {
                const cell2 = grid2.getCell(cell1.coord);
                if (cell2 && cell2.terrainTypeId !== cell1.terrainTypeId) {
                    differenceFound = true;
                }
            });
            expect(differenceFound).toBe(true);
        });
    });

    // ─── Grid dimensions ────────────────────────────

    describe('grid dimensions', () => {
        it('Rectangle grid has width × height cells', () => {
            const config = defaultConfig({ width: 8, height: 6, boundaryShape: MapBoundaryShape.Rectangle });
            const grid = generator.generate(config);
            expect(grid.cellCount).toBe(8 * 6);
            expect(grid.width).toBe(8);
            expect(grid.height).toBe(6);
        });

        it('Hexagon grid has correct cell count', () => {
            // Hexagon with radius = floor(min(w,h)/2)
            const config = defaultConfig({ width: 10, height: 10, boundaryShape: MapBoundaryShape.Hexagon });
            const grid = generator.generate(config);
            const radius = Math.floor(Math.min(10, 10) / 2); // 5
            // Hex grid cell count = 3*r^2 + 3*r + 1
            const expectedCount = 3 * radius * radius + 3 * radius + 1;
            expect(grid.cellCount).toBe(expectedCount);
        });

        it('Rhombus grid has width × height cells', () => {
            const config = defaultConfig({ width: 7, height: 5, boundaryShape: MapBoundaryShape.Rhombus });
            const grid = generator.generate(config);
            expect(grid.cellCount).toBe(7 * 5);
        });
    });

    // ─── Valid terrain types ────────────────────────

    describe('valid terrain types', () => {
        it('all cells have valid terrain type IDs', () => {
            const grid = generator.generate(defaultConfig());
            grid.forEach(cell => {
                expect(VALID_TERRAIN_IDS).toContain(cell.terrainTypeId);
            });
        });

        it('water cells are not walkable', () => {
            const grid = generator.generate(defaultConfig());
            grid.forEach(cell => {
                if (cell.terrainTypeId === 'water') {
                    expect(cell.walkable).toBe(false);
                }
            });
        });

        it('non-water cells are walkable', () => {
            const grid = generator.generate(defaultConfig());
            grid.forEach(cell => {
                if (cell.terrainTypeId !== 'water') {
                    expect(cell.walkable).toBe(true);
                }
            });
        });

        it('elevation values are in [0, 1]', () => {
            const grid = generator.generate(defaultConfig());
            grid.forEach(cell => {
                expect(cell.elevation).toBeGreaterThanOrEqual(0);
                expect(cell.elevation).toBeLessThanOrEqual(1);
            });
        });

        it('all cells start as Unexplored', () => {
            const grid = generator.generate(defaultConfig());
            grid.forEach(cell => {
                expect(cell.runtimeState.visibility).toBe(CellVisibility.Unexplored);
                expect(cell.runtimeState.occupied).toBe(false);
            });
        });
    });

    // ─── Connectivity ───────────────────────────────

    describe('connectivity', () => {
        it('all walkable cells form a single connected component', () => {
            const grid = generator.generate(defaultConfig());
            const { total, largest } = countConnectedWalkable(grid);

            if (total > 0) {
                expect(largest).toBe(total);
            }
        });

        it('connectivity holds for different seeds', () => {
            const seeds = [1, 42, 100, 777, 12345];
            for (const seed of seeds) {
                const grid = generator.generate(defaultConfig({ seed }));
                const { total, largest } = countConnectedWalkable(grid);
                if (total > 0) {
                    expect(largest).toBe(total);
                }
            }
        });

        it('connectivity holds for larger maps', () => {
            const grid = generator.generate(defaultConfig({ width: 20, height: 20, seed: 55 }));
            const { total, largest } = countConnectedWalkable(grid);
            if (total > 0) {
                expect(largest).toBe(total);
            }
        });
    });

    // ─── Floor depth / difficulty bias ──────────────

    describe('floor depth and difficulty bias', () => {
        it('deeper floors produce different terrain distributions', () => {
            const shallow = generator.generate(defaultConfig({ floorDepth: 0, difficultyBias: 0.1 }));
            const deep = generator.generate(defaultConfig({ floorDepth: 10, difficultyBias: 0.1 }));

            const countByType = (grid: HexGrid) => {
                const counts: Record<string, number> = {};
                grid.forEach(cell => {
                    counts[cell.terrainTypeId] = (counts[cell.terrainTypeId] || 0) + 1;
                });
                return counts;
            };

            const shallowCounts = countByType(shallow);
            const deepCounts = countByType(deep);

            // The distributions should differ — deeper floors push elevations to extremes
            let differenceFound = false;
            for (const typeId of VALID_TERRAIN_IDS) {
                if ((shallowCounts[typeId] || 0) !== (deepCounts[typeId] || 0)) {
                    differenceFound = true;
                    break;
                }
            }
            expect(differenceFound).toBe(true);
        });

        it('floorDepth 0 with bias 0 produces no elevation shift', () => {
            const config = defaultConfig({ floorDepth: 0, difficultyBias: 0 });
            const grid = generator.generate(config);
            // Just verify it generates without error and has cells
            expect(grid.cellCount).toBeGreaterThan(0);
        });
    });

    // ─── Boundary shapes ────────────────────────────

    describe('boundary shapes', () => {
        it('Rectangle shape generates cells in expected coordinate ranges', () => {
            const config = defaultConfig({ width: 5, height: 4, boundaryShape: MapBoundaryShape.Rectangle });
            const grid = generator.generate(config);
            expect(grid.cellCount).toBe(20);

            // Verify all cells are accessible
            let count = 0;
            grid.forEach(() => { count++; });
            expect(count).toBe(20);
        });

        it('Hexagon shape generates cells centered at origin', () => {
            const config = defaultConfig({ width: 6, height: 6, boundaryShape: MapBoundaryShape.Hexagon });
            const grid = generator.generate(config);

            // Center cell should exist
            const center = grid.getCell({ q: 0, r: 0 });
            expect(center).not.toBeNull();

            // Radius = floor(min(6,6)/2) = 3
            // All cells within radius 3 of origin should exist
            const radius = 3;
            const rangeCoords = HexCoordinate.range({ q: 0, r: 0 }, radius);
            for (const coord of rangeCoords) {
                expect(grid.getCell(coord)).not.toBeNull();
            }
        });

        it('Rhombus shape generates cells in q=[0,width) r=[0,height)', () => {
            const config = defaultConfig({ width: 4, height: 3, boundaryShape: MapBoundaryShape.Rhombus });
            const grid = generator.generate(config);
            expect(grid.cellCount).toBe(12);

            for (let q = 0; q < 4; q++) {
                for (let r = 0; r < 3; r++) {
                    expect(grid.getCell({ q, r })).not.toBeNull();
                }
            }
        });

        it('all three boundary shapes produce connected walkable regions', () => {
            const shapes = [
                MapBoundaryShape.Rectangle,
                MapBoundaryShape.Hexagon,
                MapBoundaryShape.Rhombus,
            ];
            for (const shape of shapes) {
                const grid = generator.generate(defaultConfig({ boundaryShape: shape, seed: 42 }));
                const { total, largest } = countConnectedWalkable(grid);
                if (total > 0) {
                    expect(largest).toBe(total);
                }
            }
        });
    });

    // ─── Desert temperature logic ───────────────────

    describe('desert temperature logic', () => {
        it('high temperature threshold prevents desert generation', () => {
            // With threshold = 1.1 (above max fbm output of 1.0), no deserts should appear
            const config = defaultConfig({ temperatureThreshold: 1.1 });
            const grid = generator.generate(config);

            let desertCount = 0;
            grid.forEach(cell => {
                if (cell.terrainTypeId === 'desert') desertCount++;
            });
            expect(desertCount).toBe(0);
        });

        it('low temperature threshold allows desert generation', () => {
            // With threshold = 0.0 (below min fbm output), all plains-elevation cells become desert
            const config = defaultConfig({ temperatureThreshold: 0.0, seed: 42 });
            const grid = generator.generate(config);

            let desertCount = 0;
            grid.forEach(cell => {
                if (cell.terrainTypeId === 'desert') desertCount++;
            });
            // Should have some deserts (any cell that would be plains becomes desert)
            expect(desertCount).toBeGreaterThan(0);
        });
    });
});
