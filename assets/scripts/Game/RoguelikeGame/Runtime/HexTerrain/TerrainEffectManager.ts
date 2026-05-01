// Runtime/HexTerrain/TerrainEffectManager.ts

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';
import { IHexTerrainType } from '../../Data/Interfaces/IHexTerrainType';
import { HexGrid } from './HexGrid';
import { AxialCoord, HexCoordinate } from './HexCoordinate';

/**
 * 地形效果查找接口
 * 用于解耦 TypeRegistry 的直接引用，使 TerrainEffectManager 可在 Node.js 环境中测试
 */
export interface EffectTypeLookup {
    create(typeId: string): ITerrainEffect | null;
}

/**
 * 地形类型查找接口
 * 用于获取地形的 moveSpeedModifier
 */
export interface TerrainTypeLookup {
    create(typeId: string): IHexTerrainType | null;
}

/**
 * 地形效果管理器
 * 跟踪实体所在的六角格，当格子变化时自动移除旧效果、应用新效果
 */
export class TerrainEffectManager {
    private _effectRegistry: EffectTypeLookup;
    private _terrainRegistry: TerrainTypeLookup;
    /** 实体 ID → 当前所在格子坐标键 */
    private _entityCells: Map<string, string> = new Map();
    /** 实体 ID → 当前生效的效果实例列表 */
    private _activeEffects: Map<string, ITerrainEffect[]> = new Map();

    constructor(effectRegistry: EffectTypeLookup, terrainRegistry: TerrainTypeLookup) {
        this._effectRegistry = effectRegistry;
        this._terrainRegistry = terrainRegistry;
    }

    /**
     * 更新实体的地形效果
     * 当实体移动到新格子时，移除旧效果并应用新效果
     * @param entityId 实体唯一标识
     * @param currentCoord 实体当前所在的轴向坐标
     * @param target 实体的可修改属性
     * @param grid 当前六角格网格
     */
    updateEntityTerrain(
        entityId: string,
        currentCoord: AxialCoord,
        target: TerrainEffectTarget,
        grid: HexGrid
    ): void {
        const currentKey = HexCoordinate.toKey(currentCoord);
        const previousKey = this._entityCells.get(entityId);

        if (previousKey === currentKey) {
            // 格子未变化，仅更新持续性效果
            this._updateActiveEffects(entityId, 0, target);
            return;
        }

        // 格子发生变化
        // 1. 移除旧效果
        this._removeEffects(entityId, target);

        // 2. 获取新格子信息
        const cell = grid.getCell(currentCoord);
        if (cell) {
            // 3. 应用移动速度修正
            const terrainType = this._terrainRegistry.create(cell.terrainTypeId);
            if (terrainType) {
                target.moveSpeed = target.baseMoveSpeed * terrainType.moveSpeedModifier;
            }

            // 4. 应用新效果
            const effects: ITerrainEffect[] = [];
            for (const effectId of cell.effectIds) {
                const effect = this._effectRegistry.create(effectId);
                if (effect) {
                    effect.apply(target);
                    effects.push(effect);
                }
            }
            this._activeEffects.set(entityId, effects);
        }

        this._entityCells.set(entityId, currentKey);
    }

    /**
     * 每帧更新持续性效果（如 DoT 伤害）
     * @param dt 帧间隔时间（秒）
     * @param entityId 实体唯一标识
     * @param target 实体的可修改属性
     */
    updateEffects(dt: number, entityId: string, target: TerrainEffectTarget): void {
        this._updateActiveEffects(entityId, dt, target);
    }

    /**
     * 移除实体的所有地形效果（实体离开地图或死亡时调用）
     * @param entityId 实体唯一标识
     * @param target 实体的可修改属性
     */
    removeAllEffects(entityId: string, target: TerrainEffectTarget): void {
        this._removeEffects(entityId, target);
        this._entityCells.delete(entityId);
    }

    /** 清空所有跟踪数据 */
    clear(): void {
        this._entityCells.clear();
        this._activeEffects.clear();
    }

    private _removeEffects(entityId: string, target: TerrainEffectTarget): void {
        const effects = this._activeEffects.get(entityId);
        if (effects) {
            for (const effect of effects) {
                effect.remove(target);
            }
            this._activeEffects.delete(entityId);
        }
    }

    private _updateActiveEffects(
        entityId: string, dt: number, target: TerrainEffectTarget
    ): void {
        const effects = this._activeEffects.get(entityId);
        if (effects) {
            for (const effect of effects) {
                effect.update(dt, target);
            }
        }
    }
}
