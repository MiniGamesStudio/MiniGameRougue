/**
 * 防御加成效果实现
 * 山地地形提供的防御力加成
 */

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';

/** 防御加成数值 */
const DEFENSE_BOOST_AMOUNT = 5;

/**
 * 山地防御加成效果
 * 进入山地地形时增加防御力，离开时恢复
 */
export class DefenseBoostEffect implements ITerrainEffect {
    readonly typeId: string = 'defense_boost';
    readonly displayName: string = '山地防御加成';

    /**
     * 应用效果：增加目标防御力
     * @param target 目标实体属性
     */
    apply(target: TerrainEffectTarget): void {
        target.defense += DEFENSE_BOOST_AMOUNT;
    }

    /**
     * 移除效果：恢复目标防御力
     * @param target 目标实体属性
     */
    remove(target: TerrainEffectTarget): void {
        target.defense -= DEFENSE_BOOST_AMOUNT;
    }

    /**
     * 每帧更新（空操作，防御加成为静态效果）
     */
    update(_dt: number, _target: TerrainEffectTarget): void {
        // 静态效果，无需每帧更新
    }
}
