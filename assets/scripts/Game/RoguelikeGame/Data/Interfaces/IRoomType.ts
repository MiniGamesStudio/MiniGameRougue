/**
 * 房间类型接口定义
 * 定义地牢房间的基础接口和相关数据结构
 */

/** 二维向量 */
export interface Vec2 {
    x: number;
    y: number;
}

/**
 * 房间运行时上下文
 * 提供房间逻辑执行所需的运行时信息
 */
export interface RoomContext {
    /** 当前楼层索引 */
    floorIndex: number;
    /** 当前房间节点 */
    currentRoom: RoomNode;
    /** 玩家位置 */
    playerPosition: Vec2;
    /** 房间内剩余敌人数量 */
    remainingEnemies: number;
    /** 房间已经过的时间（秒） */
    elapsedTime: number;
}

/**
 * 房间节点
 * 表示地牢中的一个房间实例
 */
export interface RoomNode {
    /** 房间唯一标识 */
    id: string;
    /** 对应 TypeRegistry 中的类型 ID */
    typeId: string;
    /** 在地图上的位置 */
    position: Vec2;
    /** 是否已清除 */
    cleared: boolean;
    /** 从 Type_Config 加载的配置数据 */
    config: any;
    /** 房间内的六角格地图数据（可选，战斗房间使用） */
    hexGrid?: import('../../Runtime/HexTerrain/HexGrid').HexGrid;
}

/**
 * 房间连接
 * 表示两个房间之间的通道
 */
export interface RoomConnection {
    /** 起始房间 ID */
    fromRoomId: string;
    /** 目标房间 ID */
    toRoomId: string;
}

/**
 * 地牢楼层
 * 表示一个完整的地牢楼层结构
 */
export interface DungeonFloor {
    /** 楼层索引（从 0 开始） */
    floorIndex: number;
    /** 楼层内所有房间 */
    rooms: RoomNode[];
    /** 房间之间的连接关系 */
    connections: RoomConnection[];
    /** 起始房间 ID */
    startRoomId: string;
    /** Boss 房间 ID */
    bossRoomId: string;
}

/**
 * 楼层生成配置
 * 控制楼层生成的参数
 */
export interface FloorConfig {
    /** 基础房间数量 */
    baseRoomCount: number;
    /** 每层增长的房间数 */
    roomGrowth: number;
    /** 房间类型分布权重：typeId → 权重 */
    typeWeights: Record<string, number>;
    /** 精英房间最小楼层要求 */
    eliteMinFloor: number;
    /** Boss 房间是否必定出现 */
    bossRequired: boolean;
}

/**
 * 房间类型接口
 * 所有房间类型必须实现此接口
 */
export interface IRoomType {
    /** 类型标识符 */
    typeId: string;
    /** 进入房间时的初始化逻辑 */
    onEnter(context: RoomContext): void;
    /** 房间清除条件检查 */
    checkClearCondition(context: RoomContext): boolean;
    /** 房间清除后的奖励逻辑 */
    onClear(context: RoomContext): void;
    /** 获取默认配置 */
    getDefaultConfig(): any;
}
