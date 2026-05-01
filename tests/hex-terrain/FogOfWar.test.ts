import {
    FogOfWar,
    FogOfWarConfig,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/FogOfWar';
import {
    HexGrid,
    HexCell,
    CellVisibility,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid';
import {
    HexCoordinate,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';

// ─── Helpers ────────────────────────────────────────

function makeCell(
    q: number,
    r: number,
    terrainTypeId: string = 'plains',
): HexCell {
    return {
        coord: { q, r },
        terrainTypeId,
        elevation: 0,
        walkable: true,
        effectIds: [],
        runtimeState: { visibility: CellVisibility.Unexplored, occupied: false },
    };
}

/** Build a hexagonal grid centered at origin with given radius, filled with plains */
function buildGrid(radius: number): HexGrid {
    const size = radius * 2 + 1;
    const grid = new HexGrid(size, size);
    const coords = HexCoordinate.range({ q: 0, r: 0 }, radius);
    for (const coord of coords) {
        grid.setCell(coord, makeCell(coord.q, coord.r));
    }
    return grid;
}

// ─── Tests ──────────────────────────────────────────

describe('FogOfWar', () => {
    describe('init', () => {
        it('should set all cells to Unexplored', () => {
            const grid = buildGrid(3);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);

            // Set some cells to non-Unexplored before init
            const cell = grid.getCell({ q: 0, r: 0 });
            if (cell) cell.runtimeState.visibility = CellVisibility.Visible;

            fog.init(grid);

            grid.forEach((c) => {
                expect(c.runtimeState.visibility).toBe(CellVisibility.Unexplored);
            });
        });
    });

    describe('updateVisibility — reveals cells', () => {
        it('should reveal cells within view radius as Visible', () => {
            const grid = buildGrid(4);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            fog.updateVisibility({ q: 0, r: 0 });

            // All cells within radius 2 of origin should be Visible
            const inRange = HexCoordinate.range({ q: 0, r: 0 }, 2);
            for (const coord of inRange) {
                const cell = grid.getCell(coord);
                if (cell) {
                    expect(cell.runtimeState.visibility).toBe(CellVisibility.Visible);
                }
            }
        });

        it('should return newly revealed coords (those that were Unexplored)', () => {
            const grid = buildGrid(4);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            const revealed = fog.updateVisibility({ q: 0, r: 0 });

            // All cells in range should be newly revealed
            const inRange = HexCoordinate.range({ q: 0, r: 0 }, 2);
            const inRangeInGrid = inRange.filter(c => grid.getCell(c) !== null);
            expect(revealed.length).toBe(inRangeInGrid.length);
        });
    });

    describe('updateVisibility — explored state', () => {
        it('should set cells that leave the view to Explored (not Unexplored)', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            // First update at origin — reveals cells within radius 2
            fog.updateVisibility({ q: 0, r: 0 });

            // Move far away — cells near origin should become Explored
            fog.updateVisibility({ q: 4, r: 0 });

            const originCell = grid.getCell({ q: 0, r: 0 });
            expect(originCell).not.toBeNull();
            expect(originCell!.runtimeState.visibility).toBe(CellVisibility.Explored);
        });

        it('should make Explored cells Visible again when re-entering view', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            // Reveal origin area
            fog.updateVisibility({ q: 0, r: 0 });

            // Move away — origin becomes Explored
            fog.updateVisibility({ q: 4, r: 0 });
            expect(grid.getCell({ q: 0, r: 0 })!.runtimeState.visibility).toBe(CellVisibility.Explored);

            // Move back — origin becomes Visible again
            fog.updateVisibility({ q: 0, r: 0 });
            expect(grid.getCell({ q: 0, r: 0 })!.runtimeState.visibility).toBe(CellVisibility.Visible);
        });
    });

    describe('viewRadiusModifier', () => {
        it('should reduce effective radius with modifier -1', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 3 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            fog.updateVisibility({ q: 0, r: 0 }, -1);

            // Effective radius = 3 - 1 = 2
            // Cell at distance 3 should NOT be visible
            const farCell = grid.getCell({ q: 3, r: 0 });
            if (farCell) {
                expect(farCell.runtimeState.visibility).toBe(CellVisibility.Unexplored);
            }

            // Cell at distance 2 should be visible
            const nearCell = grid.getCell({ q: 2, r: 0 });
            if (nearCell) {
                expect(nearCell.runtimeState.visibility).toBe(CellVisibility.Visible);
            }
        });

        it('should increase effective radius with modifier +1', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            fog.updateVisibility({ q: 0, r: 0 }, 1);

            // Effective radius = 2 + 1 = 3
            // Cell at distance 3 should be visible
            const farCell = grid.getCell({ q: 3, r: 0 });
            if (farCell) {
                expect(farCell.runtimeState.visibility).toBe(CellVisibility.Visible);
            }
        });

        it('should enforce minimum effective radius of 1', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            // Large negative modifier: 2 + (-10) = -8, clamped to 1
            fog.updateVisibility({ q: 0, r: 0 }, -10);

            // Cell at distance 1 should be visible
            const neighbor = grid.getCell({ q: 1, r: 0 });
            if (neighbor) {
                expect(neighbor.runtimeState.visibility).toBe(CellVisibility.Visible);
            }

            // Cell at distance 2 should NOT be visible
            const farCell = grid.getCell({ q: 2, r: 0 });
            if (farCell) {
                expect(farCell.runtimeState.visibility).toBe(CellVisibility.Unexplored);
            }
        });
    });

    describe('getVisibility', () => {
        it('should return correct state for each cell', () => {
            const grid = buildGrid(5);
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);
            fog.init(grid);

            // Before any update, all should be Unexplored
            expect(fog.getVisibility({ q: 0, r: 0 })).toBe(CellVisibility.Unexplored);

            // Reveal origin area
            fog.updateVisibility({ q: 0, r: 0 });
            expect(fog.getVisibility({ q: 0, r: 0 })).toBe(CellVisibility.Visible);
            expect(fog.getVisibility({ q: 1, r: 0 })).toBe(CellVisibility.Visible);

            // Far cell should still be Unexplored
            expect(fog.getVisibility({ q: 5, r: 0 })).toBe(CellVisibility.Unexplored);

            // Move away — origin becomes Explored
            fog.updateVisibility({ q: 4, r: 0 });
            expect(fog.getVisibility({ q: 0, r: 0 })).toBe(CellVisibility.Explored);
        });
    });

    describe('updateVisibility before init', () => {
        it('should return empty array when called before init', () => {
            const config: FogOfWarConfig = { baseViewRadius: 2 };
            const fog = new FogOfWar(config);

            const result = fog.updateVisibility({ q: 0, r: 0 });

            expect(result).toEqual([]);
        });
    });
});
