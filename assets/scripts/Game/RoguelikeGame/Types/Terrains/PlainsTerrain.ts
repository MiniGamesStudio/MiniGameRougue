/**
 * 平原地形类型实现
 * 基准地形，移动速度无修正，无特殊效果
 */

import { IHexTerrainType, HexTerrainConfig } from '../../Data/Interfaces/IHexTerrainType';

/**
 * 平原地形
 * 移动速度修正系数 1.0（基准），可通行
 */
export class PlainsTerrain implements IHexTerrainType {
    readonly typeId: string = 'plains';
    readonly displayName: string = '平原';
    readonly moveSpeedModifier: number = 1.0;
    readonly walkable: boolean = true;
    readonly effectIds: string[] = ['speed_modifier'];
    readonly visualAsset: string = 'terrain/plains';

    /**
     * 获取平原地形默认配置
     * @returns 默认的平原地形配置
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
