/**
 * 沼泽地形类型实现
 * 大幅降低移动速度，施加周期性伤害
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 沼泽地形
 * 移动速度修正系数 0.5，可通行，施加持续伤害效果
 */
export class SwampTerrain implements IHexTerrainType {
    readonly typeId: string = 'swamp';
    readonly displayName: string = '沼泽';
    readonly moveSpeedModifier: number = 0.5;
    readonly walkable: boolean = true;
    readonly effectIds: string[] = ['speed_modifier', 'dot_damage'];
    readonly visualAsset: string = 'terrain/swamp';

    /**
     * 获取沼泽地形默认配置
     * @returns 默认的沼泽地形配置
     */
    getDefaultConfig(): HexTerrainConfig {
        return {
            typeId: this.typeId,
            displayName: this.displayName,
            moveSpeedModifier: this.moveSpeedModifier,
            walkable: this.walkable,
            effectIds: [...this.effectIds],
            visualAsset: this.visualAsset,
            elevationRange: [0.3, 0.4],
        };
    }
}
