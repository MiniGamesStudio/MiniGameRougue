import {
    HexPathfinder,
    PathResult,
    TerrainTypeLookup,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexPathfinder';
import {
    HexGrid,
    HexCell,
    CellVisibility,
    MapBoundaryShape,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid';
import {
    HexCoordinate,
    AxialCoord,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';
import {
    IHexTerrainType,
    HexTerrainConfig,
} from '../../assets/scripts/Game/RoguelikeGame/Data/Interfaces/IHexTerrainType';

// ─── Helpers ────────────────────────────────────────

function makeTerrainType(
    typeId: string,
    walkable: boolean,
    moveSpeedModifier: number,
): IHexTerrainType {
    return {
        typeId,
        displayName: typeId,
        moveSpeedModifier,
        walkable,
        effectIds: [],
        visualAsset: '',
        getDefaultConfig(): HexTerrainConfig {
            return {
                typeId,
                displayName: typeId,
                moveSpeedModifier,
                walkable,
                effectIds: [],
                visualAsset: '',
            };
        },
    };
}

function createTestLookup(): TerrainTypeLookup {
    const types: Record<string, IHexTerrainType> = {
        plains: makeTerrainType('plains', true, 1.0),
        forest: makeTerrainType('forest', true, 0.7),
        mountain: makeTerrainType('mountain', true, 0.4),
        water: makeTerrainType('water', false, 0.0),
        desert: makeTerrainType('desert', true, 0.8),
        swamp: makeTerrainType('swamp', true, 0.5),
    };
    return {
        create(typeId: string): IHexTerrainType | null {
            return types[typeId] ?? null;
        },
    };
}

function makeCell(
    q: number,
    r: number,
    terrainTypeId: string = 'plains',
    overrides: Partial<HexCell> = {},
): HexCell {
    const lookup = createTestLookup();
    const terrain = lookup.create(terrainTypeId);
    return {
        coord: { q, r },
        terrainTypeId,
        elevation: 0,
        walkable: terrain?.walkable ?? true,
        effectIds: [],
        runtimeState: { visibility: CellVisibility.Unexplored, occupied: false },
        ...overrides,
    };
}

/** Build a simple rectangular grid filled with plains cells */
function buildSimpleGrid(width: number, height: number): HexGrid {
    const grid = new HexGrid(width, height);
    for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
            grid.setCell({ q, r }, makeCell(q, r, 'plains'));
        }
    }
    return grid;
}

// ─── Tests ──────────────────────────────────────────

describe('HexPathfinder', () => {
    let lookup: TerrainTypeLookup;
    let pathfinder: HexPathfinder;

    beforeEach(() => {
        lookup = createTestLookup();
        pathfinder = new HexPathfinder(lookup);
    });

    describe('adjacent cells', () => {
        it('should return found=true for adjacent cells with path length 2', () => {
            const grid = buildSimpleGrid(5, 5);
            const start: AxialCoord = { q: 1, r: 1 };
            const goal: AxialCoord = { q: 2, r: 1 };

            const result = pathfinder.findPath(grid, start, goal);

            expect(result.found).toBe(true);
            expect(result.path).toHaveLength(2);
            expect(result.path[0]).toEqual(start);
            expect(result.path[1]).toEqual(goal);
        });
    });

    describe('clear path', () => {
        it('should return found=true for cells with a clear path, and path is valid', () => {
            const grid = buildSimpleGrid(5, 5);
            const start: AxialCoord = { q: 0, r: 0 };
            const goal: AxialCoord = { q: 3, r: 3 };

            const result = pathfinder.findPath(grid, start, goal);

            expect(result.found).toBe(true);
            expect(result.path.length).toBeGreaterThanOrEqual(2);

            // Each consecutive step should be distance 1
            for (let i = 1; i < result.path.length; i++) {
                const dist = HexCoordinate.distance(result.path[i - 1], result.path[i]);
                expect(dist).toBe(1);
            }

            // All cells in path should be walkable
            for (const coord of result.path) {
                const cell = grid.getCell(coord);
                expect(cell).not.toBeNull();
                expect(cell!.walkable).toBe(true);
            }
        });
    });

    describe('out of bounds', () => {
        it('should return found=false when start is out of bounds', () => {
            const grid = buildSimpleGrid(5, 5);
            const start: AxialCoord = { q: 99, r: 99 };
            const goal: AxialCoord = { q: 2, r: 2 };

            const result = pathfinder.findPath(grid, start, goal);

            expect(result.found).toBe(false);
            expect(result.path).toHaveLength(0);
        });

        it('should return found=false when goal is out of bounds', () => {
            const grid = buildSimpleGrid(5, 5);
            const start: AxialCoord = { q: 2, r: 2 };
            const goal: AxialCoord = { q: 99, r: 99 };

            const result = pathfinder.findPath(grid, start, goal);

            expect(result.found).toBe(false);
            expect(result.path).toHaveLength(0);
        });
    });

    describe('unwalkable goal', () => {
        it('should return found=false when goal is not walkable (water)', () => {
            const grid = buildSimpleGrid(5, 5);
            // Replace goal cell with water
            grid.setCell({ q: 3, r: 3 }, makeCell(3, 3, 'water'));

            const result = pathfinder.findPath(grid, { q: 0, r: 0 }, { q: 3, r: 3 });

            expect(result.found).toBe(false);
            expect(result.path).toHaveLength(0);
        });
    });

    describe('no path exists', () => {
        it('should return found=false when surrounded by water', () => {
            const grid = buildSimpleGrid(5, 5);
            const center: AxialCoord = { q: 2, r: 2 };

            // Surround center with water
            for (const dir of HexCoordinate.DIRECTIONS) {
                const nCoord = { q: center.q + dir.q, r: center.r + dir.r };
                grid.setCell(nCoord, makeCell(nCoord.q, nCoord.r, 'water'));
            }

            const result = pathfinder.findPath(grid, center, { q: 0, r: 0 });

            expect(result.found).toBe(false);
            expect(result.path).toHaveLength(0);
        });
    });

    describe('start equals goal', () => {
        it('should return found=true with path=[start] when start equals goal', () => {
            const grid = buildSimpleGrid(5, 5);
            const coord: AxialCoord = { q: 2, r: 2 };

            const result = pathfinder.findPath(grid, coord, coord);

            expect(result.found).toBe(true);
            expect(result.path).toHaveLength(1);
            expect(result.path[0]).toEqual(coord);
            expect(result.totalCost).toBe(0);
        });
    });

    describe('terrain cost preference', () => {
        it('should prefer lower-cost terrain (plains over mountain)', () => {
            // Build a small grid where there are two routes from (0,0) to (2,0):
            // Route A (direct, 2 steps): (0,0) -> (1,0)[mountain] -> (2,0)
            //   cost = 1/0.4 + 1/1.0 = 2.5 + 1.0 = 3.5
            // Route B (detour, 3 steps): (0,0) -> (1,-1)[plains] -> (2,-1)[plains] -> (2,0)
            //   cost = 1.0 + 1.0 + 1.0 = 3.0
            // Route B should be preferred because total cost is lower.
            const grid = new HexGrid(5, 5);

            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains'));
            grid.setCell({ q: 2, r: 0 }, makeCell(2, 0, 'plains'));

            // Direct route through mountain
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'mountain'));

            // Alternative route through plains
            grid.setCell({ q: 1, r: -1 }, makeCell(1, -1, 'plains'));
            grid.setCell({ q: 2, r: -1 }, makeCell(2, -1, 'plains'));

            const result = pathfinder.findPath(grid, { q: 0, r: 0 }, { q: 2, r: 0 });

            expect(result.found).toBe(true);

            // The path should avoid the mountain and take the plains detour
            const pathKeys = result.path.map(c => HexCoordinate.toKey(c));
            expect(pathKeys).not.toContain('1,0');
            // Should go through the plains cells
            expect(pathKeys).toContain('1,-1');
            expect(pathKeys).toContain('2,-1');
        });
    });

    describe('path endpoints', () => {
        it('should have start as first element and goal as last element', () => {
            const grid = buildSimpleGrid(5, 5);
            const start: AxialCoord = { q: 0, r: 0 };
            const goal: AxialCoord = { q: 4, r: 4 };

            const result = pathfinder.findPath(grid, start, goal);

            expect(result.found).toBe(true);
            expect(result.path[0]).toEqual(start);
            expect(result.path[result.path.length - 1]).toEqual(goal);
        });
    });

    describe('all cells walkable', () => {
        it('should have all cells in path be walkable', () => {
            const grid = buildSimpleGrid(5, 5);
            // Add some non-walkable cells that the path must avoid
            grid.setCell({ q: 1, r: 1 }, makeCell(1, 1, 'water'));
            grid.setCell({ q: 2, r: 1 }, makeCell(2, 1, 'water'));

            const result = pathfinder.findPath(grid, { q: 0, r: 0 }, { q: 3, r: 2 });

            expect(result.found).toBe(true);
            for (const coord of result.path) {
                const cell = grid.getCell(coord);
                expect(cell).not.toBeNull();
                expect(cell!.walkable).toBe(true);
            }
        });
    });
});
