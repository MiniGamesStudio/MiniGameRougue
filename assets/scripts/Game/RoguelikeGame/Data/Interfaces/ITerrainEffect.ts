/**
 * 地形效果接口定义
 * 定义地形效果的基础接口和相关数据结构
 */

/**
 * 地形效果目标
 * 描述受地形效果影响的实体属性
 */
export interface TerrainEffectTarget {
    /** 当前生命值 */
    hp: number;
    /** 最大生命值 */
    maxHp: number;
    /** 攻击力 */
    attack: number;
    /** 防御力 */
    defense: number;
    /** 当前移动速度 */
    moveSpeed: number;
    /** 基础移动速度 */
    baseMoveSpeed: number;
    /** 技能冷却修正系数 */
    cooldownModifier: number;
    /** 闪避修正系数 */
    evasionModifier: number;
}

/**
 * 地形效果接口
 * 所有地形效果必须实现此接口
 */
export interface ITerrainEffect {
    /** 效果类型标识符 */
    typeId: string;
    /** 显示名称 */
    displayName: string;
    /** 应用效果到目标 */
    apply(target: TerrainEffectTarget): void;
    /** 从目标移除效果 */
    remove(target: TerrainEffectTarget): void;
    /** 每帧更新效果（用于持续性效果，如沼泽周期伤害） */
    update(dt: number, target: TerrainEffectTarget): void;
}
