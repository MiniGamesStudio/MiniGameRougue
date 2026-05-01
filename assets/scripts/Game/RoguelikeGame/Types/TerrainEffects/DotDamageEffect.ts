/**
 * 持续伤害效果实现
 * 沼泽地形施加的周期性伤害
 */

import { ITerrainEffect, TerrainEffectTarget } from '../../Data/Interfaces/ITerrainEffect';

/** 伤害触发间隔（秒） */
const DOT_INTERVAL = 1.0;
/** 每次伤害数值 */
const DOT_DAMAGE = 2;

/**
 * 沼泽腐蚀效果
 * 在沼泽地形上每隔固定时间对目标造成少量伤害
 */
export class DotDamageEffect implements ITerrainEffect {
    readonly typeId: string = 'dot_damage';
    readonly displayName: string = '沼泽腐蚀';

    /** 内部计时器 */
    private _timer: number = 0;

    /**
     * 应用效果：重置计时器
     */
    apply(_target: TerrainEffectTarget): void {
        this._timer = 0;
    }

    /**
     * 移除效果：重置计时器
     */
    remove(_target: TerrainEffectTarget): void {
        this._timer = 0;
    }

    /**
     * 每帧更新：累积计时器，达到间隔时对目标造成伤害
     * @param dt 帧间隔时间（秒）
     * @param target 目标实体属性
     */
    update(dt: number, target: TerrainEffectTarget): void {
        this._timer += dt;
        while (this._timer >= DOT_INTERVAL) {
            target.hp -= DOT_DAMAGE;
            this._timer -= DOT_INTERVAL;
        }
    }
}
