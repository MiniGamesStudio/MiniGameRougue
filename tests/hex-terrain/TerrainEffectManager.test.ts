import {
    TerrainEffectManager,
    EffectTypeLookup,
    TerrainTypeLookup,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/TerrainEffectManager';
import {
    HexGrid,
    HexCell,
    CellVisibility,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexGrid';
import {
    HexCoordinate,
} from '../../assets/scripts/Game/RoguelikeGame/Runtime/HexTerrain/HexCoordinate';
import {
    ITerrainEffect,
    TerrainEffectTarget,
} from '../../assets/scripts/Game/RoguelikeGame/Data/Interfaces/ITerrainEffect';
import {
    IHexTerrainType,
} from '../../assets/scripts/Game/RoguelikeGame/Data/Interfaces/IHexTerrainType';

// ─── Helpers ────────────────────────────────────────

function makeTarget(overrides: Partial<TerrainEffectTarget> = {}): TerrainEffectTarget {
    return {
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        moveSpeed: 100,
        baseMoveSpeed: 100,
        cooldownModifier: 1.0,
        evasionModifier: 0,
        ...overrides,
    };
}

/** DefenseBoostEffect: adds 5 defense on apply, removes 5 on remove */
class DefenseBoostEffect implements ITerrainEffect {
    typeId = 'defense_boost';
    displayName = 'Defense Boost';
    apply(target: TerrainEffectTarget): void {
        target.defense += 5;
    }
    remove(target: TerrainEffectTarget): void {
        target.defense -= 5;
    }
    update(_dt: number, _target: TerrainEffectTarget): void {
        // no-op for static effect
    }
}

/** DotDamageEffect: deals 2 damage per second */
class DotDamageEffect implements ITerrainEffect {
    typeId = 'dot_damage';
    displayName = 'DoT Damage';
    apply(_target: TerrainEffectTarget): void {
        // no immediate effect
    }
    remove(_target: TerrainEffectTarget): void {
        // no removal effect
    }
    update(dt: number, target: TerrainEffectTarget): void {
        target.hp -= 2 * dt;
    }
}

function createTerrainLookup(): TerrainTypeLookup {
    const types: Record<string, IHexTerrainType> = {
        plains: {
            typeId: 'plains',
            displayName: 'Plains',
            moveSpeedModifier: 1.0,
            walkable: true,
            effectIds: [],
            visualAsset: '',
            getDefaultConfig() {
                return { typeId: 'plains', displayName: 'Plains', moveSpeedModifier: 1.0, walkable: true, effectIds: [], visualAsset: '' };
            },
        },
        forest: {
            typeId: 'forest',
            displayName: 'Forest',
            moveSpeedModifier: 0.7,
            walkable: true,
            effectIds: ['defense_boost'],
            visualAsset: '',
            getDefaultConfig() {
                return { typeId: 'forest', displayName: 'Forest', moveSpeedModifier: 0.7, walkable: true, effectIds: ['defense_boost'], visualAsset: '' };
            },
        },
        swamp: {
            typeId: 'swamp',
            displayName: 'Swamp',
            moveSpeedModifier: 0.5,
            walkable: true,
            effectIds: ['dot_damage'],
            visualAsset: '',
            getDefaultConfig() {
                return { typeId: 'swamp', displayName: 'Swamp', moveSpeedModifier: 0.5, walkable: true, effectIds: ['dot_damage'], visualAsset: '' };
            },
        },
    };
    return {
        create(typeId: string): IHexTerrainType | null {
            return types[typeId] ?? null;
        },
    };
}

function createEffectLookup(): EffectTypeLookup {
    return {
        create(typeId: string): ITerrainEffect | null {
            if (typeId === 'defense_boost') return new DefenseBoostEffect();
            if (typeId === 'dot_damage') return new DotDamageEffect();
            return null;
        },
    };
}

function makeCell(
    q: number,
    r: number,
    terrainTypeId: string = 'plains',
    effectIds: string[] = [],
): HexCell {
    const terrainLookup = createTerrainLookup();
    const terrain = terrainLookup.create(terrainTypeId);
    return {
        coord: { q, r },
        terrainTypeId,
        elevation: 0,
        walkable: terrain?.walkable ?? true,
        effectIds: effectIds.length > 0 ? effectIds : (terrain?.effectIds ?? []),
        runtimeState: { visibility: CellVisibility.Unexplored, occupied: false },
    };
}

// ─── Tests ──────────────────────────────────────────

describe('TerrainEffectManager', () => {
    let terrainLookup: TerrainTypeLookup;
    let effectLookup: EffectTypeLookup;
    let manager: TerrainEffectManager;

    beforeEach(() => {
        terrainLookup = createTerrainLookup();
        effectLookup = createEffectLookup();
        manager = new TerrainEffectManager(effectLookup, terrainLookup);
    });

    describe('updateEntityTerrain — moveSpeed', () => {
        it('should apply moveSpeed = baseMoveSpeed * moveSpeedModifier when entering a cell', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));

            const target = makeTarget({ baseMoveSpeed: 100, moveSpeed: 100 });
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);

            // forest moveSpeedModifier = 0.7
            expect(target.moveSpeed).toBeCloseTo(70);
        });
    });

    describe('updateEntityTerrain — apply effects', () => {
        it('should apply effects when entering a new cell', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));

            const target = makeTarget({ defense: 5 });
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);

            // DefenseBoostEffect adds 5 defense
            expect(target.defense).toBe(10);
        });
    });

    describe('updateEntityTerrain — terrain change', () => {
        it('should remove old effects and apply new effects when moving to different terrain', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'swamp'));

            const target = makeTarget({ defense: 5, hp: 100 });

            // Enter forest — defense +5
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);
            expect(target.defense).toBe(10);

            // Move to swamp — defense boost removed, dot_damage applied
            manager.updateEntityTerrain('entity1', { q: 1, r: 0 }, target, grid);
            expect(target.defense).toBe(5); // defense boost removed
            // swamp moveSpeedModifier = 0.5
            expect(target.moveSpeed).toBeCloseTo(50);
        });
    });

    describe('updateEntityTerrain — same cell', () => {
        it('should NOT re-apply effects when staying on same cell', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));

            const target = makeTarget({ defense: 5 });

            // Enter forest
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);
            expect(target.defense).toBe(10);

            // Stay on same cell — defense should not increase again
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);
            expect(target.defense).toBe(10);
        });
    });

    describe('updateEffects — DoT damage', () => {
        it('should call update on active effects (test DoT damage)', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'swamp'));

            const target = makeTarget({ hp: 100 });

            // Enter swamp to activate dot_damage effect
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);

            // Simulate 1 second of DoT (2 damage per second)
            manager.updateEffects(1.0, 'entity1', target);
            expect(target.hp).toBeCloseTo(98);

            // Simulate another 0.5 seconds
            manager.updateEffects(0.5, 'entity1', target);
            expect(target.hp).toBeCloseTo(97);
        });
    });

    describe('removeAllEffects', () => {
        it('should remove all effects and clear tracking', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));

            const target = makeTarget({ defense: 5 });

            // Enter forest — defense +5
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);
            expect(target.defense).toBe(10);

            // Remove all effects
            manager.removeAllEffects('entity1', target);
            expect(target.defense).toBe(5); // defense boost removed

            // Re-entering the same cell should re-apply effects (tracking was cleared)
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target, grid);
            expect(target.defense).toBe(10);
        });
    });

    describe('clear', () => {
        it('should clear all tracking data', () => {
            const grid = new HexGrid(5, 5);
            grid.setCell({ q: 0, r: 0 }, makeCell(0, 0, 'forest'));
            grid.setCell({ q: 1, r: 0 }, makeCell(1, 0, 'plains'));

            const target1 = makeTarget({ defense: 5 });
            const target2 = makeTarget({ defense: 5 });

            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target1, grid);
            manager.updateEntityTerrain('entity2', { q: 1, r: 0 }, target2, grid);

            // Clear all tracking
            manager.clear();

            // After clear, entering the same cell should re-apply effects
            // (because tracking was wiped, it treats it as a new cell)
            const target3 = makeTarget({ defense: 5 });
            manager.updateEntityTerrain('entity1', { q: 0, r: 0 }, target3, grid);
            expect(target3.defense).toBe(10);
        });
    });
});
