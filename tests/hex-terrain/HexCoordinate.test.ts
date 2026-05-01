import {
    HexCoordinate,
    HexOrientation,
    HexLayout,
    AxialCoord,
    CubeCoord,
    PixelCoord,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';

describe('HexCoordinate', () => {

    // ─── axialToCube / cubeToAxial ──────────────────

    describe('axialToCube', () => {
        it('should satisfy q + r + s = 0', () => {
            const cube = HexCoordinate.axialToCube({ q: 3, r: -2 });
            expect(cube.q + cube.r + cube.s).toBe(0);
        });

        it('should compute s = -q - r', () => {
            const cube = HexCoordinate.axialToCube({ q: 1, r: 2 });
            expect(cube).toEqual({ q: 1, r: 2, s: -3 });
        });

        it('should handle origin', () => {
            const cube = HexCoordinate.axialToCube({ q: 0, r: 0 });
            expect(cube.q).toBe(0);
            expect(cube.r).toBe(0);
            expect(cube.q + cube.r + cube.s).toBe(0);
        });
    });

    describe('cubeToAxial', () => {
        it('should take q and r from cube', () => {
            const axial = HexCoordinate.cubeToAxial({ q: 3, r: -1, s: -2 });
            expect(axial).toEqual({ q: 3, r: -1 });
        });
    });

    // ─── axialToPixel / pixelToAxial ────────────────

    describe('axialToPixel (FlatTop)', () => {
        const layout: HexLayout = {
            orientation: HexOrientation.FlatTop,
            size: 10,
            origin: { x: 0, y: 0 },
        };

        it('should return origin for (0,0)', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 0, r: 0 }, layout);
            expect(pixel.x).toBeCloseTo(0);
            expect(pixel.y).toBeCloseTo(0);
        });

        it('should compute correct pixel for (1,0) FlatTop', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 1, r: 0 }, layout);
            // FlatTop: x = size * (3/2 * q) = 10 * 1.5 = 15
            // y = size * (sqrt(3)/2 * q + sqrt(3) * r) = 10 * (sqrt(3)/2) ≈ 8.66
            expect(pixel.x).toBeCloseTo(15);
            expect(pixel.y).toBeCloseTo(10 * Math.sqrt(3) / 2);
        });

        it('should compute correct pixel for (0,1) FlatTop', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 0, r: 1 }, layout);
            // FlatTop: x = 0, y = size * sqrt(3) = 10 * sqrt(3) ≈ 17.32
            expect(pixel.x).toBeCloseTo(0);
            expect(pixel.y).toBeCloseTo(10 * Math.sqrt(3));
        });
    });

    describe('axialToPixel (PointyTop)', () => {
        const layout: HexLayout = {
            orientation: HexOrientation.PointyTop,
            size: 10,
            origin: { x: 0, y: 0 },
        };

        it('should return origin for (0,0)', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 0, r: 0 }, layout);
            expect(pixel.x).toBeCloseTo(0);
            expect(pixel.y).toBeCloseTo(0);
        });

        it('should compute correct pixel for (1,0) PointyTop', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 1, r: 0 }, layout);
            // PointyTop: x = size * sqrt(3) * q = 10 * sqrt(3) ≈ 17.32
            // y = size * (3/2 * r) = 0
            expect(pixel.x).toBeCloseTo(10 * Math.sqrt(3));
            expect(pixel.y).toBeCloseTo(0);
        });

        it('should compute correct pixel for (0,1) PointyTop', () => {
            const pixel = HexCoordinate.axialToPixel({ q: 0, r: 1 }, layout);
            // PointyTop: x = size * sqrt(3)/2 * r = 10 * sqrt(3)/2 ≈ 8.66
            // y = size * 3/2 * r = 15
            expect(pixel.x).toBeCloseTo(10 * Math.sqrt(3) / 2);
            expect(pixel.y).toBeCloseTo(15);
        });
    });

    describe('pixelToAxial roundtrip', () => {
        const flatLayout: HexLayout = {
            orientation: HexOrientation.FlatTop,
            size: 10,
            origin: { x: 0, y: 0 },
        };
        const pointyLayout: HexLayout = {
            orientation: HexOrientation.PointyTop,
            size: 10,
            origin: { x: 0, y: 0 },
        };

        it('should roundtrip FlatTop (1, 2)', () => {
            const original: AxialCoord = { q: 1, r: 2 };
            const pixel = HexCoordinate.axialToPixel(original, flatLayout);
            const result = HexCoordinate.pixelToAxial(pixel, flatLayout);
            expect(result).toEqual(original);
        });

        it('should roundtrip PointyTop (-3, 4)', () => {
            const original: AxialCoord = { q: -3, r: 4 };
            const pixel = HexCoordinate.axialToPixel(original, pointyLayout);
            const result = HexCoordinate.pixelToAxial(pixel, pointyLayout);
            expect(result).toEqual(original);
        });
    });

    describe('pixelToAxial error handling', () => {
        const layout: HexLayout = {
            orientation: HexOrientation.FlatTop,
            size: 10,
            origin: { x: 0, y: 0 },
        };

        it('should return {q:0, r:0} for NaN input', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = HexCoordinate.pixelToAxial({ x: NaN, y: 5 }, layout);
            expect(result).toEqual({ q: 0, r: 0 });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should return {q:0, r:0} for Infinity input', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const result = HexCoordinate.pixelToAxial({ x: Infinity, y: 0 }, layout);
            expect(result).toEqual({ q: 0, r: 0 });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    // ─── cubeRound ──────────────────────────────────

    describe('cubeRound', () => {
        it('should round to nearest hex', () => {
            const result = HexCoordinate.cubeRound({ q: 0.3, r: 0.3, s: -0.6 });
            expect(result).toEqual({ q: 0, r: 0 });
        });

        it('should round exact integer cube coords', () => {
            const result = HexCoordinate.cubeRound({ q: 2, r: -1, s: -1 });
            expect(result).toEqual({ q: 2, r: -1 });
        });
    });

    // ─── distance ───────────────────────────────────

    describe('distance', () => {
        it('should return 0 for same coordinate', () => {
            expect(HexCoordinate.distance({ q: 3, r: -2 }, { q: 3, r: -2 })).toBe(0);
        });

        it('should return 1 for adjacent hexes', () => {
            expect(HexCoordinate.distance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
        });

        it('should be symmetric', () => {
            const a: AxialCoord = { q: 1, r: 2 };
            const b: AxialCoord = { q: -3, r: 4 };
            expect(HexCoordinate.distance(a, b)).toBe(HexCoordinate.distance(b, a));
        });

        it('should compute correct distance for known pair', () => {
            // (0,0) to (2,1): cube (0,0,0) to (2,1,-3) → max(2,1,3) = 3
            expect(HexCoordinate.distance({ q: 0, r: 0 }, { q: 2, r: 1 })).toBe(3);
        });
    });

    // ─── neighbors ──────────────────────────────────

    describe('neighbors', () => {
        it('should return exactly 6 neighbors', () => {
            const n = HexCoordinate.neighbors({ q: 0, r: 0 });
            expect(n).toHaveLength(6);
        });

        it('should return all neighbors at distance 1', () => {
            const center: AxialCoord = { q: 2, r: -3 };
            const n = HexCoordinate.neighbors(center);
            for (const neighbor of n) {
                expect(HexCoordinate.distance(center, neighbor)).toBe(1);
            }
        });

        it('should return correct neighbors for origin', () => {
            const n = HexCoordinate.neighbors({ q: 0, r: 0 });
            expect(n).toEqual(expect.arrayContaining([
                { q: 1, r: 0 },
                { q: 1, r: -1 },
                { q: 0, r: -1 },
                { q: -1, r: 0 },
                { q: -1, r: 1 },
                { q: 0, r: 1 },
            ]));
        });
    });

    // ─── range ──────────────────────────────────────

    describe('range', () => {
        it('should return only center for radius 0', () => {
            const result = HexCoordinate.range({ q: 0, r: 0 }, 0);
            expect(result).toEqual([{ q: 0, r: 0 }]);
        });

        it('should return 7 hexes for radius 1', () => {
            // 1 center + 6 neighbors = 7
            const result = HexCoordinate.range({ q: 0, r: 0 }, 1);
            expect(result).toHaveLength(7);
        });

        it('should return 19 hexes for radius 2', () => {
            // 1 + 6 + 12 = 19
            const result = HexCoordinate.range({ q: 0, r: 0 }, 2);
            expect(result).toHaveLength(19);
        });

        it('should return empty array for negative radius', () => {
            const result = HexCoordinate.range({ q: 0, r: 0 }, -1);
            expect(result).toEqual([]);
        });

        it('should include all hexes within distance', () => {
            const center: AxialCoord = { q: 1, r: -1 };
            const radius = 2;
            const result = HexCoordinate.range(center, radius);
            for (const coord of result) {
                expect(HexCoordinate.distance(center, coord)).toBeLessThanOrEqual(radius);
            }
        });
    });

    // ─── equals ─────────────────────────────────────

    describe('equals', () => {
        it('should return true for same coordinates', () => {
            expect(HexCoordinate.equals({ q: 1, r: 2 }, { q: 1, r: 2 })).toBe(true);
        });

        it('should return false for different coordinates', () => {
            expect(HexCoordinate.equals({ q: 1, r: 2 }, { q: 1, r: 3 })).toBe(false);
        });
    });

    // ─── toKey / fromKey ────────────────────────────

    describe('toKey', () => {
        it('should produce "q,r" format', () => {
            expect(HexCoordinate.toKey({ q: 3, r: -2 })).toBe('3,-2');
        });
    });

    describe('fromKey', () => {
        it('should parse valid key', () => {
            expect(HexCoordinate.fromKey('3,-2')).toEqual({ q: 3, r: -2 });
        });

        it('should return {q:0, r:0} for invalid format (no comma)', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(HexCoordinate.fromKey('invalid')).toEqual({ q: 0, r: 0 });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should return {q:0, r:0} for non-numeric values', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(HexCoordinate.fromKey('a,b')).toEqual({ q: 0, r: 0 });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should return {q:0, r:0} for too many parts', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            expect(HexCoordinate.fromKey('1,2,3')).toEqual({ q: 0, r: 0 });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should roundtrip with toKey', () => {
            const original: AxialCoord = { q: -5, r: 7 };
            const key = HexCoordinate.toKey(original);
            const result = HexCoordinate.fromKey(key);
            expect(result).toEqual(original);
        });
    });
});
