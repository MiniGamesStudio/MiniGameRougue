/**
 * 沙漠地形类型实现
 * 轻微降低移动速度，加速技能冷却恢复
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 沙漠地形
 * 移动速度修正系数 0.8，可通行，提供冷却缩减效果
 */
export class DesertTerrain implements IHexTerrainType {
    readonly typeId: string = 'desert';
    readonly displayName: string = '沙漠';
    readonly moveSpeedModifier: number = 0.8;
    readonly walkable: boolean = true;
    readonly effectIds: string[] = ['speed_modifier', 'cooldown_reduction'];
    readonly visualAsset: string = 'terrain/desert';

    /**
     * 获取沙漠地形默认配置
     * @returns 默认的沙漠地形配置
     */
    getDefaultConfig(): HexTerrainConfig {
        return {
            typeId: this.typeId,
            displayName: this.displayName,
            moveSpeedModifier: this.moveSpeedModifier,
            walkable: this.walkable,
            effectIds: [...this.effectIds],
            visualAsset: this.visualAsset,
            elevationRange: [0.4, 0.6],
        };
    }
}
