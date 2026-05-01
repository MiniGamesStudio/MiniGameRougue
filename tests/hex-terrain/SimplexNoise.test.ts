import { SimplexNoise } from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/SimplexNoise';

describe('SimplexNoise', () => {

    // ─── Determinism ────────────────────────────────

    describe('determinism', () => {
        it('same seed produces same noise2D output', () => {
            const a = new SimplexNoise(42);
            const b = new SimplexNoise(42);

            for (let x = -5; x <= 5; x++) {
                for (let y = -5; y <= 5; y++) {
                    expect(a.noise2D(x, y)).toBe(b.noise2D(x, y));
                }
            }
        });

        it('same seed produces same fbm output', () => {
            const a = new SimplexNoise(42);
            const b = new SimplexNoise(42);

            for (let x = -3; x <= 3; x++) {
                for (let y = -3; y <= 3; y++) {
                    expect(a.fbm(x, y, 4, 0.5, 1.0)).toBe(b.fbm(x, y, 4, 0.5, 1.0));
                }
            }
        });

        it('calling noise2D twice with same params gives same result', () => {
            const noise = new SimplexNoise(123);
            const first = noise.noise2D(3.7, -2.1);
            const second = noise.noise2D(3.7, -2.1);
            expect(first).toBe(second);
        });
    });

    // ─── Different seeds ────────────────────────────

    describe('different seeds', () => {
        it('different seeds produce different noise2D output', () => {
            const a = new SimplexNoise(42);
            const b = new SimplexNoise(999);

            // At least some values should differ across a grid of samples
            let differenceFound = false;
            for (let x = -5; x <= 5; x++) {
                for (let y = -5; y <= 5; y++) {
                    if (a.noise2D(x, y) !== b.noise2D(x, y)) {
                        differenceFound = true;
                        break;
                    }
                }
                if (differenceFound) break;
            }
            expect(differenceFound).toBe(true);
        });

        it('different seeds produce different fbm output', () => {
            const a = new SimplexNoise(42);
            const b = new SimplexNoise(999);

            let differenceFound = false;
            for (let x = -3; x <= 3; x++) {
                for (let y = -3; y <= 3; y++) {
                    if (a.fbm(x, y, 4, 0.5, 1.0) !== b.fbm(x, y, 4, 0.5, 1.0)) {
                        differenceFound = true;
                        break;
                    }
                }
                if (differenceFound) break;
            }
            expect(differenceFound).toBe(true);
        });
    });

    // ─── noise2D output range ───────────────────────

    describe('noise2D output range [-1, 1]', () => {
        it('returns values in [-1, 1] for integer coordinates', () => {
            const noise = new SimplexNoise(42);
            for (let x = -20; x <= 20; x++) {
                for (let y = -20; y <= 20; y++) {
                    const v = noise.noise2D(x, y);
                    expect(v).toBeGreaterThanOrEqual(-1);
                    expect(v).toBeLessThanOrEqual(1);
                }
            }
        });

        it('returns values in [-1, 1] for fractional coordinates', () => {
            const noise = new SimplexNoise(77);
            for (let i = 0; i < 500; i++) {
                const x = (i * 0.37) - 100;
                const y = (i * 0.53) - 100;
                const v = noise.noise2D(x, y);
                expect(v).toBeGreaterThanOrEqual(-1);
                expect(v).toBeLessThanOrEqual(1);
            }
        });

        it('returns values in [-1, 1] for large coordinates', () => {
            const noise = new SimplexNoise(55);
            const coords = [1000, -1000, 5000, -5000, 10000, -10000];
            for (const x of coords) {
                for (const y of coords) {
                    const v = noise.noise2D(x, y);
                    expect(v).toBeGreaterThanOrEqual(-1);
                    expect(v).toBeLessThanOrEqual(1);
                }
            }
        });

        it('returns values in [-1, 1] for zero coordinates', () => {
            const noise = new SimplexNoise(42);
            const v = noise.noise2D(0, 0);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });
    });

    // ─── fbm output range ───────────────────────────

    describe('fbm output range [0, 1]', () => {
        it('returns values in [0, 1] for various inputs', () => {
            const noise = new SimplexNoise(42);
            for (let x = -10; x <= 10; x++) {
                for (let y = -10; y <= 10; y++) {
                    const v = noise.fbm(x, y, 4, 0.5, 1.0);
                    expect(v).toBeGreaterThanOrEqual(0);
                    expect(v).toBeLessThanOrEqual(1);
                }
            }
        });

        it('returns values in [0, 1] with different octave counts', () => {
            const noise = new SimplexNoise(42);
            const octaves = [1, 2, 3, 6, 8];
            for (const oct of octaves) {
                for (let x = -5; x <= 5; x++) {
                    for (let y = -5; y <= 5; y++) {
                        const v = noise.fbm(x, y, oct, 0.5, 1.0);
                        expect(v).toBeGreaterThanOrEqual(0);
                        expect(v).toBeLessThanOrEqual(1);
                    }
                }
            }
        });

        it('returns values in [0, 1] with different frequency and amplitude', () => {
            const noise = new SimplexNoise(42);
            const params = [
                { freq: 0.1, amp: 1.0 },
                { freq: 1.0, amp: 0.5 },
                { freq: 2.0, amp: 2.0 },
                { freq: 0.01, amp: 0.1 },
            ];
            for (const { freq, amp } of params) {
                for (let x = -5; x <= 5; x++) {
                    for (let y = -5; y <= 5; y++) {
                        const v = noise.fbm(x, y, 4, freq, amp);
                        expect(v).toBeGreaterThanOrEqual(0);
                        expect(v).toBeLessThanOrEqual(1);
                    }
                }
            }
        });

        it('returns values in [0, 1] with custom lacunarity and persistence', () => {
            const noise = new SimplexNoise(42);
            const v1 = noise.fbm(3.5, -2.1, 4, 0.5, 1.0, 2.5, 0.3);
            expect(v1).toBeGreaterThanOrEqual(0);
            expect(v1).toBeLessThanOrEqual(1);

            const v2 = noise.fbm(-7.2, 4.8, 6, 1.0, 1.0, 1.5, 0.7);
            expect(v2).toBeGreaterThanOrEqual(0);
            expect(v2).toBeLessThanOrEqual(1);
        });
    });

    // ─── Noise produces variation ───────────────────

    describe('noise variation', () => {
        it('noise2D produces non-zero values (not a flat function)', () => {
            const noise = new SimplexNoise(42);
            let hasNonZero = false;
            for (let x = -10; x <= 10; x++) {
                for (let y = -10; y <= 10; y++) {
                    if (noise.noise2D(x * 0.5, y * 0.5) !== 0) {
                        hasNonZero = true;
                        break;
                    }
                }
                if (hasNonZero) break;
            }
            expect(hasNonZero).toBe(true);
        });

        it('fbm produces varied values (not constant)', () => {
            const noise = new SimplexNoise(42);
            const values = new Set<number>();
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 10; y++) {
                    values.add(noise.fbm(x, y, 4, 0.5, 1.0));
                }
            }
            // Should have many distinct values
            expect(values.size).toBeGreaterThan(10);
        });
    });

    // ─── Seed edge cases ────────────────────────────

    describe('seed edge cases', () => {
        it('works with seed 0', () => {
            const noise = new SimplexNoise(0);
            const v = noise.noise2D(1, 1);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });

        it('works with negative seed', () => {
            const noise = new SimplexNoise(-12345);
            const v = noise.noise2D(1, 1);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });

        it('works with very large seed', () => {
            const noise = new SimplexNoise(2147483647);
            const v = noise.noise2D(1, 1);
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });
    });
});
