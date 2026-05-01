/**
 * 冷却缩减效果实现
 * 沙漠地形提供的技能冷却加速
 */

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';

/** 冷却修正系数（0.8 表示冷却时间缩短 20%） */
const COOLDOWN_FACTOR = 0.8;

/**
 * 沙漠热风效果
 * 进入沙漠地形时加速技能冷却恢复，离开时恢复
 */
export class CooldownReductionEffect implements ITerrainEffect {
    readonly typeId: string = 'cooldown_reduction';
    readonly displayName: string = '沙漠热风';

    /**
     * 应用效果：降低冷却修正系数（加速冷却）
     * @param target 目标实体属性
     */
    apply(target: TerrainEffectTarget): void {
        target.cooldownModifier *= COOLDOWN_FACTOR;
    }

    /**
     * 移除效果：恢复冷却修正系数
     * @param target 目标实体属性
     */
    remove(target: TerrainEffectTarget): void {
        target.cooldownModifier /= COOLDOWN_FACTOR;
    }

    /**
     * 每帧更新（空操作，冷却缩减为静态效果）
     */
    update(_dt: number, _target: TerrainEffectTarget): void {
        // 静态效果，无需每帧更新
    }
}
