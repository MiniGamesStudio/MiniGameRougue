/**
 * 六角格地形类型接口定义
 * 定义地形类型的基础接口和相关数据结构
 */

/**
 * 地形配置
 * 从配置表加载的地形初始化数据
 */
export interface HexTerrainConfig {
    /** 地形类型标识符 */
    typeId: string;
    /** 显示名称 */
    displayName: string;
    /** 移动速度修正系数（1.0 为基准） */
    moveSpeedModifier: number;
    /** 是否可通行 */
    walkable: boolean;
    /** 关联的地形效果 ID 列表 */
    effectIds: string[];
    /** 视觉资源路径 */
    visualAsset: string;
    /** 海拔范围 [最小值, 最大值]，用于地形生成时的海拔映射 */
    elevationRange?: [number, number];
}

/**
 * 六角格地形类型接口
 * 所有地形类型必须实现此接口
 */
export interface IHexTerrainType {
    /** 类型标识符 */
    typeId: string;
    /** 显示名称 */
    displayName: string;
    /** 移动速度修正系数（1.0 为基准） */
    moveSpeedModifier: number;
    /** 是否可通行 */
    walkable: boolean;
    /** 关联的地形效果 ID 列表 */
    effectIds: string[];
    /** 视觉资源路径 */
    visualAsset: string;
    /** 获取默认配置 */
    getDefaultConfig(): HexTerrainConfig;
}
