import {
    HexGrid,
    HexCell,
    CellVisibility,
    MapBoundaryShape,
    CellRuntimeState,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid';
import { AxialCoord, HexCoordinate } from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';

// ─── Helper ─────────────────────────────────────────

/** 创建一个带默认值的 HexCell */
function makeCell(
    q: number,
    r: number,
    terrainTypeId: string = 'plains',
    overrides: Partial<HexCell> = {},
): HexCell {
    return {
        coord: { q, r },
        terrainTypeId,
        elevation: 0,
        walkable: true,
        effectIds: [],
        runtimeState: { visibility: CellVisibility.Unexplored, occupied: false },
        ...overrides,
    };
}

/** 用简单的矩形坐标填充网格 */
function fillRectGrid(grid: HexGrid, width: number, height: number): void {
    for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
            grid.setCell({ q, r }, makeCell(q, r));
        }
    }
}

// ─── Grid Creation ──────────────────────────────────

describe('HexGrid', () => {

    describe('constructor & properties', () => {
        it('should create a grid with given dimensions and default Rectangle shape', () => {
            const grid = new HexGrid(10, 8);
            expect(grid.width).toBe(10);
            expect(grid.height).toBe(8);
            expect(grid.boundaryShape).toBe(MapBoundaryShape.Rectangle);
            expect(grid.cellCount).toBe(0);
        });

        it('should create a grid with Hexagon boundary shape', () => {
            const grid = new HexGrid(5, 5, MapBoundaryShape.Hexagon);
            expect(grid.boundaryShape).toBe(MapBoundaryShape.Hexagon);
        });

        it('should create a grid with Rhombus boundary shape', () => {
            const grid = new HexGrid(6, 6, MapBoundaryShape.Rhombus);
            expect(grid.boundaryShape).toBe(MapBoundaryShape.Rhombus);
        });
    });

    // ─── setCell / getCell ──────────────────────────

    describe('setCell / getCell', () => {
        it('should store and retrieve a cell by coordinate', () => {
            const grid = new HexGrid(10, 10);
            const cell = makeCell(3, 4, 'forest', { elevation: 0.7 });
            grid.setCell({ q: 3, r: 4 }, cell);

            const retrieved = grid.getCell({ q: 3, r: 4 });
            expect(retrieved).not.toBeNull();
            expect(retrieved!.terrainTypeId).toBe('forest');
            expect(retrieved!.elevation).toBe(0.7);
            expect(retrieved!.coord).toEqual({ q: 3, r: 4 });
        });

        it('should return null for a coordinate that was never set', () => {
            const grid = new HexGrid(10, 10);
            expect(grid.getCell({ q: 99, r: 99 })).toBeNull();
        });

        it('should overwrite an existing cell at the same coordinate', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains'));
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'mountain'));

            const cell = grid.getCell({ q: 0, r: 0 });
            expect(cell!.terrainTypeId).toBe('mountain');
            expect(grid.cellCount).toBe(1);
        });

        it('should handle negative coordinates', () => {
            const grid = new HexGrid(10, 10);
            const cell = makeCell(-3, -5, 'water');
            grid.setCell({ q: -3, r: -5 }, cell);

            expect(grid.getCell({ q: -3, r: -5 })).not.toBeNull();
            expect(grid.getCell({ q: -3, r: -5 })!.terrainTypeId).toBe('water');
        });

        it('should increment cellCount when adding new cells', () => {
            const grid = new HexGrid(10, 10);
            expect(grid.cellCount).toBe(0);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0));
            expect(grid.cellCount).toBe(1);
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0));
            expect(grid.cellCount).toBe(2);
        });
    });

    // ─── isInBounds ─────────────────────────────────

    describe('isInBounds', () => {
        it('should return true for a coordinate that has a cell', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 2, r: 3 }, makeCell(2, 3));
            expect(grid.isInBounds({ q: 2, r: 3 })).toBe(true);
        });

        it('should return false for a coordinate without a cell', () => {
            const grid = new HexGrid(10, 10);
            expect(grid.isInBounds({ q: 2, r: 3 })).toBe(false);
        });

        it('should be consistent with getCell — isInBounds true iff getCell non-null', () => {
            const grid = new HexGrid(5, 5);
            fillRectGrid(grid, 5, 5);

            // Check all coords in a wider range
            for (let q = -2; q < 7; q++) {
                for (let r = -2; r < 7; r++) {
                    const coord = { q, r };
                    const inBounds = grid.isInBounds(coord);
                    const cell = grid.getCell(coord);
                    expect(inBounds).toBe(cell !== null);
                }
            }
        });
    });

    // ─── forEach ────────────────────────────────────

    describe('forEach', () => {
        it('should iterate over all cells', () => {
            const grid = new HexGrid(3, 3);
            fillRectGrid(grid, 3, 3);

            const visited: string[] = [];
            grid.forEach((cell, key) => {
                visited.push(key);
            });

            expect(visited).toHaveLength(9);
        });

        it('should not call callback on empty grid', () => {
            const grid = new HexGrid(5, 5);
            const callback = jest.fn();
            grid.forEach(callback);
            expect(callback).not.toHaveBeenCalled();
        });

        it('should provide correct cell data in callback', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 1, r: 2 }, makeCell(1, 2, 'forest'));

            grid.forEach((cell, key) => {
                expect(key).toBe('1,2');
                expect(cell.terrainTypeId).toBe('forest');
            });
        });
    });

    // ─── cells iterator ─────────────────────────────

    describe('cells', () => {
        it('should return an iterator over all cell values', () => {
            const grid = new HexGrid(3, 3);
            fillRectGrid(grid, 3, 3);

            const allCells = [...grid.cells()];
            expect(allCells).toHaveLength(9);
        });

        it('should return empty iterator for empty grid', () => {
            const grid = new HexGrid(5, 5);
            const allCells = [...grid.cells()];
            expect(allCells).toHaveLength(0);
        });
    });

    // ─── getWalkableNeighbors ───────────────────────

    describe('getWalkableNeighbors', () => {
        it('should return walkable neighbors that exist in the grid', () => {
            const grid = new HexGrid(10, 10);
            // Place center and all 6 neighbors
            grid.setCell({ q: 2, r: 2 }, makeCell(2, 2));
            for (const dir of HexCoordinate.DIRECTIONS) {
                const nq = 2 + dir.q;
                const nr = 2 + dir.r;
                grid.setCell({ q: nq, r: nr }, makeCell(nq, nr));
            }

            const neighbors = grid.getWalkableNeighbors({ q: 2, r: 2 });
            expect(neighbors).toHaveLength(6);
        });

        it('should filter out non-walkable neighbors', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0));
            // One walkable neighbor
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'plains', { walkable: true }));
            // One non-walkable neighbor
            grid.setCell({ q: 0, r: 1 }, makeCell(0, 1, 'water', { walkable: false }));

            const neighbors = grid.getWalkableNeighbors({ q: 0, r: 0 });
            expect(neighbors).toHaveLength(1);
            expect(neighbors[0].coord).toEqual({ q: 1, r: 0 });
        });

        it('should return empty array when no neighbors exist', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0));

            const neighbors = grid.getWalkableNeighbors({ q: 0, r: 0 });
            expect(neighbors).toHaveLength(0);
        });

        it('should return empty array when all neighbors are non-walkable', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0));
            for (const dir of HexCoordinate.DIRECTIONS) {
                grid.setCell(
                    { q: dir.q, r: dir.r },
                    makeCell(dir.q, dir.r, 'water', { walkable: false }),
                );
            }

            const neighbors = grid.getWalkableNeighbors({ q: 0, r: 0 });
            expect(neighbors).toHaveLength(0);
        });
    });

    // ─── serialize (full format) ────────────────────

    describe('serialize (full format)', () => {
        it('should serialize grid metadata and cells', () => {
            const grid = new HexGrid(4, 3, MapBoundaryShape.Hexagon);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains', { elevation: 0.5 }));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'forest'));

            const data = grid.serialize(false) as any;
            expect(data.width).toBe(4);
            expect(data.height).toBe(3);
            expect(data.boundaryShape).toBe(MapBoundaryShape.Hexagon);
            expect(data.cells).toHaveLength(2);
        });

        it('should include all cell fields in full format', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 1, r: 2 }, makeCell(1, 2, 'mountain', {
                elevation: 0.85,
                walkable: false,
                effectIds: ['speed_modifier'],
                runtimeState: { visibility: CellVisibility.Visible, occupied: true },
            }));

            const data = grid.serialize(false) as any;
            const cellData = data.cells[0];
            expect(cellData.coord).toEqual({ q: 1, r: 2 });
            expect(cellData.terrainTypeId).toBe('mountain');
            expect(cellData.elevation).toBe(0.85);
            expect(cellData.walkable).toBe(false);
            expect(cellData.effectIds).toEqual(['speed_modifier']);
            expect(cellData.runtimeState.visibility).toBe(CellVisibility.Visible);
            expect(cellData.runtimeState.occupied).toBe(true);
        });
    });

    // ─── serialize (compact format) ─────────────────

    describe('serialize (compact format)', () => {
        it('should use short keys in compact format', () => {
            const grid = new HexGrid(10, 10);
            grid.setCell({ q: 1, r: 2 }, makeCell(1, 2, 'forest', {
                elevation: 0.6,
                walkable: false,
                effectIds: ['evasion_boost'],
                runtimeState: { visibility: CellVisibility.Explored, occupied: false },
            }));

            const data = grid.serialize(true) as any;
            const cellData = data.cells[0];
            expect(cellData.q).toBe(1);
            expect(cellData.r).toBe(2);
            expect(cellData.t).toBe('forest');
            expect(cellData.e).toBe(0.6);
            expect(cellData.w).toBe(false);
            expect(cellData.fx).toEqual(['evasion_boost']);
            expect(cellData.v).toBe(CellVisibility.Explored);
        });

        it('should omit default values in compact format', () => {
            const grid = new HexGrid(10, 10);
            // Default cell: elevation=0, walkable=true, effectIds=[], visibility=Unexplored
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains'));

            const data = grid.serialize(true) as any;
            const cellData = data.cells[0];
            expect(cellData.q).toBe(0);
            expect(cellData.r).toBe(0);
            expect(cellData.t).toBe('plains');
            // Default values should be omitted
            expect(cellData.e).toBeUndefined();
            expect(cellData.w).toBeUndefined();
            expect(cellData.fx).toBeUndefined();
            expect(cellData.v).toBeUndefined();
        });

        it('should produce smaller output than full format', () => {
            const grid = new HexGrid(5, 5);
            fillRectGrid(grid, 5, 5);

            const fullJson = JSON.stringify(grid.serialize(false));
            const compactJson = JSON.stringify(grid.serialize(true));
            expect(compactJson.length).toBeLessThan(fullJson.length);
        });
    });

    // ─── deserialize ────────────────────────────────

    describe('deserialize', () => {
        it('should deserialize full format data', () => {
            const grid = new HexGrid(4, 3, MapBoundaryShape.Hexagon);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains', { elevation: 0.5 }));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'forest', {
                elevation: 0.65,
                effectIds: ['evasion_boost'],
                runtimeState: { visibility: CellVisibility.Visible, occupied: false },
            }));

            const serialized = grid.serialize(false);
            const result = HexGrid.deserialize(serialized);

            expect(result).toBeInstanceOf(HexGrid);
            const restored = result as HexGrid;
            expect(restored.width).toBe(4);
            expect(restored.height).toBe(3);
            expect(restored.boundaryShape).toBe(MapBoundaryShape.Hexagon);
            expect(restored.cellCount).toBe(2);

            const cell0 = restored.getCell({ q: 0, r: 0 });
            expect(cell0).not.toBeNull();
            expect(cell0!.terrainTypeId).toBe('plains');
            expect(cell0!.elevation).toBe(0.5);

            const cell1 = restored.getCell({ q: 1, r: 0 });
            expect(cell1).not.toBeNull();
            expect(cell1!.terrainTypeId).toBe('forest');
            expect(cell1!.effectIds).toEqual(['evasion_boost']);
            expect(cell1!.runtimeState.visibility).toBe(CellVisibility.Visible);
        });

        it('should deserialize compact format data', () => {
            const grid = new HexGrid(4, 3);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains'));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'mountain', {
                elevation: 0.8,
                walkable: false,
                effectIds: ['defense_boost'],
                runtimeState: { visibility: CellVisibility.Explored, occupied: false },
            }));

            const serialized = grid.serialize(true);
            const result = HexGrid.deserialize(serialized);

            expect(result).toBeInstanceOf(HexGrid);
            const restored = result as HexGrid;
            expect(restored.cellCount).toBe(2);

            const cell0 = restored.getCell({ q: 0, r: 0 });
            expect(cell0!.terrainTypeId).toBe('plains');
            expect(cell0!.elevation).toBe(0);
            expect(cell0!.walkable).toBe(true);

            const cell1 = restored.getCell({ q: 1, r: 0 });
            expect(cell1!.terrainTypeId).toBe('mountain');
            expect(cell1!.elevation).toBe(0.8);
            expect(cell1!.walkable).toBe(false);
            expect(cell1!.effectIds).toEqual(['defense_boost']);
            expect(cell1!.runtimeState.visibility).toBe(CellVisibility.Explored);
        });
    });

    // ─── serialize/deserialize roundtrip ────────────

    describe('serialize/deserialize roundtrip', () => {
        it('should roundtrip full format', () => {
            const grid = new HexGrid(5, 5, MapBoundaryShape.Rhombus);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains', { elevation: 0.4 }));
            grid.setCell({ q: 1, r: 1 }, makeCell(1, 1, 'forest', {
                elevation: 0.7,
                effectIds: ['evasion_boost', 'speed_modifier'],
                runtimeState: { visibility: CellVisibility.Visible, occupied: true },
            }));
            grid.setCell({ q: 2, r: -1 }, makeCell(2, -1, 'water', {
                elevation: 0.1,
                walkable: false,
            }));

            const serialized = grid.serialize(false);
            const result = HexGrid.deserialize(serialized) as HexGrid;

            expect(result.width).toBe(grid.width);
            expect(result.height).toBe(grid.height);
            expect(result.boundaryShape).toBe(grid.boundaryShape);
            expect(result.cellCount).toBe(grid.cellCount);

            // Verify each cell
            grid.forEach((originalCell) => {
                const restoredCell = result.getCell(originalCell.coord);
                expect(restoredCell).not.toBeNull();
                expect(restoredCell!.terrainTypeId).toBe(originalCell.terrainTypeId);
                expect(restoredCell!.elevation).toBe(originalCell.elevation);
                expect(restoredCell!.walkable).toBe(originalCell.walkable);
                expect(restoredCell!.effectIds).toEqual(originalCell.effectIds);
                expect(restoredCell!.runtimeState.visibility).toBe(originalCell.runtimeState.visibility);
                expect(restoredCell!.runtimeState.occupied).toBe(originalCell.runtimeState.occupied);
            });
        });

        it('should roundtrip compact format', () => {
            const grid = new HexGrid(3, 3);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'plains'));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'mountain', {
                elevation: 0.9,
                walkable: false,
                effectIds: ['defense_boost'],
                runtimeState: { visibility: CellVisibility.Explored, occupied: false },
            }));

            const serialized = grid.serialize(true);
            const result = HexGrid.deserialize(serialized) as HexGrid;

            expect(result.width).toBe(grid.width);
            expect(result.height).toBe(grid.height);
            expect(result.cellCount).toBe(grid.cellCount);

            grid.forEach((originalCell) => {
                const restoredCell = result.getCell(originalCell.coord);
                expect(restoredCell).not.toBeNull();
                expect(restoredCell!.terrainTypeId).toBe(originalCell.terrainTypeId);
                expect(restoredCell!.elevation).toBe(originalCell.elevation);
                expect(restoredCell!.walkable).toBe(originalCell.walkable);
                expect(restoredCell!.effectIds).toEqual(originalCell.effectIds);
                expect(restoredCell!.runtimeState.visibility).toBe(originalCell.runtimeState.visibility);
            });
        });

        it('should roundtrip an empty grid', () => {
            const grid = new HexGrid(10, 10, MapBoundaryShape.Hexagon);
            const serialized = grid.serialize(false);
            const result = HexGrid.deserialize(serialized) as HexGrid;

            expect(result.width).toBe(10);
            expect(result.height).toBe(10);
            expect(result.boundaryShape).toBe(MapBoundaryShape.Hexagon);
            expect(result.cellCount).toBe(0);
        });
    });

    // ─── deserialize error handling ─────────────────

    describe('deserialize error handling', () => {
        it('should return error for null input', () => {
            const result = HexGrid.deserialize(null);
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('不是有效对象');
        });

        it('should return error for undefined input', () => {
            const result = HexGrid.deserialize(undefined);
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('不是有效对象');
        });

        it('should return error for non-object input', () => {
            const result = HexGrid.deserialize('not an object');
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('不是有效对象');
        });

        it('should return error when width is missing', () => {
            const result = HexGrid.deserialize({ height: 5, cells: [] });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('width');
        });

        it('should return error when height is missing', () => {
            const result = HexGrid.deserialize({ width: 5, cells: [] });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('height');
        });

        it('should return error when cells is not an array', () => {
            const result = HexGrid.deserialize({ width: 5, height: 5, cells: 'not array' });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('cells');
        });

        it('should return error when cells is missing', () => {
            const result = HexGrid.deserialize({ width: 5, height: 5 });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('cells');
        });

        it('should return error for cell with invalid coordinates', () => {
            const result = HexGrid.deserialize({
                width: 5, height: 5,
                cells: [{ coord: { q: 'bad', r: 0 }, terrainTypeId: 'plains' }],
            });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('cells[0]');
            expect((result as any).error).toContain('坐标');
        });

        it('should return error for cell missing terrain type', () => {
            const result = HexGrid.deserialize({
                width: 5, height: 5,
                cells: [{ coord: { q: 0, r: 0 } }],
            });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('cells[0]');
            expect((result as any).error).toContain('地形类型');
        });

        it('should return error for second cell with invalid data', () => {
            const result = HexGrid.deserialize({
                width: 5, height: 5,
                cells: [
                    { coord: { q: 0, r: 0 }, terrainTypeId: 'plains' },
                    { coord: { q: 1, r: 0 } }, // missing terrainTypeId
                ],
            });
            expect(result).toHaveProperty('error');
            expect((result as any).error).toContain('cells[1]');
        });

        it('should default boundaryShape to Rectangle when missing', () => {
            const result = HexGrid.deserialize({
                width: 5, height: 5, cells: [],
            });
            expect(result).toBeInstanceOf(HexGrid);
            expect((result as HexGrid).boundaryShape).toBe(MapBoundaryShape.Rectangle);
        });
    });
});
