/**
 * 闪避加成效果实现
 * 森林地形提供的闪避率加成
 */

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';

/** 闪避加成数值 */
const EVASION_BOOST = 0.2;

/**
 * 森林掩护效果
 * 进入森林地形时增加闪避率，离开时恢复
 */
export class EvasionBoostEffect implements ITerrainEffect {
    readonly typeId: string = 'evasion_boost';
    readonly displayName: string = '森林掩护';

    /**
     * 应用效果：增加目标闪避修正
     * @param target 目标实体属性
     */
    apply(target: TerrainEffectTarget): void {
        target.evasionModifier += EVASION_BOOST;
    }

    /**
     * 移除效果：恢复目标闪避修正
     * @param target 目标实体属性
     */
    remove(target: TerrainEffectTarget): void {
        target.evasionModifier -= EVASION_BOOST;
    }

    /**
     * 每帧更新（空操作，闪避加成为静态效果）
     */
    update(_dt: number, _target: TerrainEffectTarget): void {
        // 静态效果，无需每帧更新
    }
}
