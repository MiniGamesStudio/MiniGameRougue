/**
 * 速度修正效果实现
 * 移动速度修正由 TerrainEffectManager 直接处理，此效果为空操作占位
 */

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';

/**
 * 速度修正效果
 * 移动速度修正通过 TerrainEffectManager 根据地形的 moveSpeedModifier 直接计算，
 * 此效果作为占位符存在，apply/remove/update 均为空操作。
 */
export class SpeedModifierEffect implements ITerrainEffect {
    readonly typeId: string = 'speed_modifier';
    readonly displayName: string = '速度修正';

    /**
     * 应用效果（空操作，速度修正由管理器直接处理）
     */
    apply(_target: TerrainEffectTarget): void {
        // 速度修正由 TerrainEffectManager 直接计算
    }

    /**
     * 移除效果（空操作）
     */
    remove(_target: TerrainEffectTarget): void {
        // 速度修正由 TerrainEffectManager 直接计算
    }

    /**
     * 每帧更新（空操作）
     */
    update(_dt: number, _target: TerrainEffectTarget): void {
        // 无持续性逻辑
    }
}
