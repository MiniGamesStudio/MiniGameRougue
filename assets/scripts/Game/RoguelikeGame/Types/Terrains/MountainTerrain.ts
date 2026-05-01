/**
 * 山地地形类型实现
 * 大幅降低移动速度，提供防御加成
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 山地地形
 * 移动速度修正系数 0.4，可通行，提供防御加成
 */
export class MountainTerrain implements IHexTerrainType {
    readonly typeId: string = 'mountain';
    readonly displayName: string = '山地';
    readonly moveSpeedModifier: number = 0.4;
    readonly walkable: boolean = true;
    readonly effectIds: string[] = ['speed_modifier', 'defense_boost'];
    readonly visualAsset: string = 'terrain/mountain';

    /**
     * 获取山地地形默认配置
     * @returns 默认的山地地形配置
     */
    getDefaultConfig(): HexTerrainConfig {
        return {
            typeId: this.typeId,
            displayName: this.displayName,
            moveSpeedModifier: this.moveSpeedModifier,
            walkable: this.walkable,
            effectIds: [...this.effectIds],
            visualAsset: this.visualAsset,
            elevationRange: [0.75, 0.9],
        };
    }
}
