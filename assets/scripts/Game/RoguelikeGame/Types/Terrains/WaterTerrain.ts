/**
 * 水域地形类型实现
 * 不可通行的障碍地形
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 水域地形
 * 移动速度修正系数 0.0，不可通行，无地形效果
 */
export class WaterTerrain implements IHexTerrainType {
    readonly typeId: string = 'water';
    readonly displayName: string = '水域';
    readonly moveSpeedModifier: number = 0.0;
    readonly walkable: boolean = false;
    readonly effectIds: string[] = [];
    readonly visualAsset: string = 'terrain/water';

    /**
     * 获取水域地形默认配置
     * @returns 默认的水域地形配置
     */
    getDefaultConfig(): HexTerrainConfig {
        return {
            typeId: this.typeId,
            displayName: this.displayName,
            moveSpeedModifier: this.moveSpeedModifier,
            walkable: this.walkable,
            effectIds: [...this.effectIds],
            visualAsset: this.visualAsset,
            elevationRange: [0.0, 0.3],
        };
    }
}
