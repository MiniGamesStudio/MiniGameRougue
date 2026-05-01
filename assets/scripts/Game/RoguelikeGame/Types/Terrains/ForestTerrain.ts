/**
 * 森林地形类型实现
 * 降低移动速度，提供闪避加成
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 森林地形
 * 移动速度修正系数 0.7，可通行，提供闪避加成
 */
export class ForestTerrain implements IHexTerrainType {
    readonly typeId: string = 'forest';
    readonly displayName: string = '森林';
    readonly moveSpeedModifier: number = 0.7;
    readonly walkable: boolean = true;
    readonly effectIds: string[] = ['speed_modifier', 'evasion_boost'];
    readonly visualAsset: string = 'terrain/forest';

    /**
     * 获取森林地形默认配置
     * @returns 默认的森林地形配置
     */
    getDefaultConfig(): HexTerrainConfig {
        return {
            typeId: this.typeId,
            displayName: this.displayName,
            moveSpeedModifier: this.moveSpeedModifier,
            walkable: this.walkable,
            effectIds: [...this.effectIds],
            visualAsset: this.visualAsset,
            elevationRange: [0.6, 0.75],
        };
    }
}
