/**
 * 配置表接口定义与访问器注册
 * 定义所有配置表的 TypeScript 接口，映射到对应的 Excel 表结构
 * 提供 registerConfigAccessors 辅助函数注册占位访问器到 ConfigManager
 */

import { ConfigManager, IConfigAccessor } from '../../../engine/ConfigManager';

// ─── 敌人配置表 ────────────────────────────────────────────

/**
 * 敌人配置表
 * 对应 enemy.xlsx
 */
export interface EnemyConfigTable {
    /** 敌人 ID */
    id: number;
    /** 敌人名称 */
    name: string;
    /** 敌人类型标识 */
    typeId: string;
    /** 最大生命值 */
    maxHp: number;
    /** 攻击力 */
    attack: number;
    /** 防御力 */
    defense: number;
    /** 移动速度 */
    moveSpeed: number;
    /** 攻击范围 */
    attackRange: number;
    /** 攻击冷却时间（秒） */
    attackCooldown: number;
    /** 击杀掉落经验值 */
    expDrop: number;
    /** 击杀掉落金币数 */
    goldDrop: number;
    /** 技能列表 ID */
    skillIds: number[];
}

// ─── 武器配置表 ────────────────────────────────────────────

/**
 * 武器配置表
 * 对应 weapon.xlsx
 */
export interface WeaponConfigTable {
    /** 武器 ID */
    id: number;
    /** 武器名称 */
    name: string;
    /** 武器类型标识 */
    typeId: string;
    /** 基础伤害 */
    baseDamage: number;
    /** 攻击速度 */
    attackSpeed: number;
    /** 攻击范围 */
    range: number;
    /** 冷却时间（秒） */
    cooldown: number;
    /** 投射物数量 */
    projectileCount: number;
    /** 稀有度 */
    rarity: string;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 道具配置表 ────────────────────────────────────────────

/**
 * 道具配置表
 * 对应 item.xlsx
 */
export interface ItemConfigTable {
    /** 道具 ID */
    id: number;
    /** 道具名称 */
    name: string;
    /** 道具类型标识 */
    typeId: string;
    /** 目标属性名称 */
    attribute: string;
    /** 修改类型：flat 或 percent */
    modType: string;
    /** 基础数值 */
    baseValue: number;
    /** 每级增长数值 */
    valuePerLevel: number;
    /** 最大等级 */
    maxLevel: number;
    /** 稀有度 */
    rarity: string;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 宠物配置表 ────────────────────────────────────────────

/**
 * 宠物配置表
 * 对应 pet.xlsx
 */
export interface PetConfigTable {
    /** 宠物 ID */
    id: number;
    /** 宠物名称 */
    name: string;
    /** 宠物类型标识 */
    typeId: string;
    /** 基础攻击力 */
    baseAttack: number;
    /** 跟随距离 */
    followDistance: number;
    /** 攻击范围 */
    attackRange: number;
    /** 攻击冷却时间（秒） */
    attackCooldown: number;
    /** 被动效果属性名称 */
    passiveAttribute: string;
    /** 被动效果修改类型 */
    passiveModType: string;
    /** 被动效果数值 */
    passiveValue: number;
    /** 最大等级 */
    maxLevel: number;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 职业配置表 ────────────────────────────────────────────

/**
 * 职业配置表
 * 对应 class.xlsx
 */
export interface ClassConfigTable {
    /** 职业 ID */
    id: number;
    /** 职业名称 */
    name: string;
    /** 职业类型标识 */
    typeId: string;
    /** 稀有度 */
    rarity: string;
    /** 最大生命值加成 */
    bonusMaxHp: number;
    /** 攻击力加成 */
    bonusAttack: number;
    /** 防御力加成 */
    bonusDefense: number;
    /** 移动速度加成 */
    bonusMoveSpeed: number;
    /** 解锁条件类型 */
    unlockType: string;
    /** 解锁条件目标值 */
    unlockTargetValue: number;
    /** 解锁条件描述 */
    unlockDescription: string;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── NPC 配置表 ────────────────────────────────────────────

/**
 * NPC 配置表
 * 对应 npc.xlsx
 */
export interface NpcConfigTable {
    /** NPC ID */
    id: number;
    /** NPC 名称 */
    name: string;
    /** NPC 类型标识 */
    typeId: string;
    /** 服务列表（JSON 字符串） */
    services: string;
    /** 基础对话内容 */
    baseDialogue: string;
    /** 好感度对话内容 */
    affinityDialogue: string;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 换装配置表 ────────────────────────────────────────────

/**
 * 换装配置表
 * 对应 costume.xlsx
 */
export interface CostumeConfigTable {
    /** 装扮 ID */
    id: number;
    /** 装扮名称 */
    name: string;
    /** 装扮部位：head / body / effect */
    slot: string;
    /** 解锁方式 */
    unlockMethod: string;
    /** 解锁条件值 */
    unlockValue: number;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 事件配置表 ────────────────────────────────────────────

/**
 * 事件配置表
 * 对应 event.xlsx
 */
export interface EventConfigTable {
    /** 事件 ID */
    id: number;
    /** 事件名称 */
    name: string;
    /** 事件类型标识 */
    typeId: string;
    /** 事件描述 */
    description: string;
    /** 选项列表（JSON 字符串） */
    options: string;
    /** 出现权重 */
    weight: number;
    /** 图标资源路径 */
    icon: string;
}

// ─── 商店配置表 ────────────────────────────────────────────

/**
 * 商店配置表
 * 对应 shop.xlsx
 */
export interface ShopConfigTable {
    /** 商品 ID */
    id: number;
    /** 商品名称 */
    name: string;
    /** 商品类型标识 */
    goodsTypeId: string;
    /** 基础价格 */
    basePrice: number;
    /** 每层价格增长 */
    priceGrowth: number;
    /** 稀有度 */
    rarity: string;
    /** 出现权重 */
    weight: number;
    /** 图标资源路径 */
    icon: string;
    /** 描述 */
    description: string;
}

// ─── 地牢配置表 ────────────────────────────────────────────

/**
 * 地牢配置表
 * 对应 dungeon.xlsx
 */
export interface DungeonConfigTable {
    /** 楼层 ID */
    id: number;
    /** 楼层名称 */
    name: string;
    /** 基础房间数量 */
    baseRoomCount: number;
    /** 每层房间增长数 */
    roomGrowth: number;
    /** 房间类型权重（JSON 字符串） */
    typeWeights: string;
    /** 精英房间最小楼层 */
    eliteMinFloor: number;
    /** Boss 是否必定出现 */
    bossRequired: boolean;
    /** 敌人难度系数 */
    difficultyMultiplier: number;
}

// ─── 永久升级配置表 ────────────────────────────────────────

/**
 * 永久升级配置表
 * 对应 meta_upgrade 配置
 */
export interface MetaUpgradeConfigTable {
    /** 升级项 ID */
    id: string;
    /** 升级名称 */
    name: string;
    /** 升级描述 */
    description: string;
    /** 目标属性名称 */
    attributeType: string;
    /** 每级提供的属性增量 */
    valuePerLevel: number;
    /** 基础费用 */
    baseCost: number;
    /** 每级费用增长 */
    costGrowth: number;
    /** 最大等级 */
    maxLevel: number;
}

// ─── 配置表名常量 ──────────────────────────────────────────

/** 配置表名称映射 */
export const CONFIG_TABLE_NAMES = {
    ENEMY: 'enemy',
    WEAPON: 'weapon',
    ITEM: 'item',
    PET: 'pet',
    CLASS: 'class',
    NPC: 'npc',
    COSTUME: 'costume',
    EVENT: 'event',
    SHOP: 'shop',
    DUNGEON: 'dungeon',
    META_UPGRADE: 'meta_upgrade',
    TERRAIN_TYPE: 'terrain_type',
    BIOME: 'biome',
    MAP_GEN: 'map_gen',
} as const;

// ─── 占位访问器 ────────────────────────────────────────────

/**
 * 占位配置访问器
 * 在 FlatBuffers 生成代码就绪前提供空实现
 * 后续由 Excel 导出工具生成的代码替换
 */
class PlaceholderAccessor<T> implements IConfigAccessor<T> {
    private _tableName: string;

    constructor(tableName: string) {
        this._tableName = tableName;
    }

    getCount(): number {
        return 0;
    }

    getByIndex(_index: number): T | null {
        return null;
    }

    getById(_id: number | string): T | null {
        return null;
    }

    forEach(_callback: (item: T, index: number) => void): void {
        // 占位实现，无数据可遍历
    }

    getAll(): T[] {
        return [];
    }
}

// ─── 注册函数 ──────────────────────────────────────────────

/**
 * 注册所有配置表的占位访问器到 ConfigManager
 * 在 FlatBuffers 生成代码就绪前提供空实现，确保各系统可正常初始化
 * 后续由 Excel 导出工具生成的真实访问器替换
 */
export function registerConfigAccessors(): void {
    const cm = ConfigManager.getInstance();

    cm.registerAccessor<EnemyConfigTable>(
        CONFIG_TABLE_NAMES.ENEMY,
        new PlaceholderAccessor<EnemyConfigTable>(CONFIG_TABLE_NAMES.ENEMY)
    );

    cm.registerAccessor<WeaponConfigTable>(
        CONFIG_TABLE_NAMES.WEAPON,
        new PlaceholderAccessor<WeaponConfigTable>(CONFIG_TABLE_NAMES.WEAPON)
    );

    cm.registerAccessor<ItemConfigTable>(
        CONFIG_TABLE_NAMES.ITEM,
        new PlaceholderAccessor<ItemConfigTable>(CONFIG_TABLE_NAMES.ITEM)
    );

    cm.registerAccessor<PetConfigTable>(
        CONFIG_TABLE_NAMES.PET,
        new PlaceholderAccessor<PetConfigTable>(CONFIG_TABLE_NAMES.PET)
    );

    cm.registerAccessor<ClassConfigTable>(
        CONFIG_TABLE_NAMES.CLASS,
        new PlaceholderAccessor<ClassConfigTable>(CONFIG_TABLE_NAMES.CLASS)
    );

    cm.registerAccessor<NpcConfigTable>(
        CONFIG_TABLE_NAMES.NPC,
        new PlaceholderAccessor<NpcConfigTable>(CONFIG_TABLE_NAMES.NPC)
    );

    cm.registerAccessor<CostumeConfigTable>(
        CONFIG_TABLE_NAMES.COSTUME,
        new PlaceholderAccessor<CostumeConfigTable>(CONFIG_TABLE_NAMES.COSTUME)
    );

    cm.registerAccessor<EventConfigTable>(
        CONFIG_TABLE_NAMES.EVENT,
        new PlaceholderAccessor<EventConfigTable>(CONFIG_TABLE_NAMES.EVENT)
    );

    cm.registerAccessor<ShopConfigTable>(
        CONFIG_TABLE_NAMES.SHOP,
        new PlaceholderAccessor<ShopConfigTable>(CONFIG_TABLE_NAMES.SHOP)
    );

    cm.registerAccessor<DungeonConfigTable>(
        CONFIG_TABLE_NAMES.DUNGEON,
        new PlaceholderAccessor<DungeonConfigTable>(CONFIG_TABLE_NAMES.DUNGEON)
    );

    cm.registerAccessor<MetaUpgradeConfigTable>(
        CONFIG_TABLE_NAMES.META_UPGRADE,
        new PlaceholderAccessor<MetaUpgradeConfigTable>(CONFIG_TABLE_NAMES.META_UPGRADE)
    );

    console.log(
        `[ConfigTables] 已注册 ${Object.keys(CONFIG_TABLE_NAMES).length} 个配置表占位访问器`
    );
}

// ─── 地形类型配置表 ────────────────────────────────────────

export interface TerrainTypeConfigRow {
    typeId: string;
    displayName: string;
    moveSpeedModifier: number;
    walkable: boolean;
    effectIds: string[];
    visualAsset: string;
    elevationMin: number;
    elevationMax: number;
}

export interface TerrainTypeConfigTable {
    terrains: TerrainTypeConfigRow[];
}

// ─── 生态群落配置表 ────────────────────────────────────────

export interface BiomeConfigRow {
    biomeId: string;
    terrainWeights: Record<string, number>;
    minFloor: number;
    maxFloor: number;
}

export interface BiomeConfigTable {
    biomes: BiomeConfigRow[];
}

// ─── 地图生成配置表 ────────────────────────────────────────

export interface MapGenConfigRow {
    roomTypeId: string;
    mapWidth: number;
    mapHeight: number;
    boundaryShape: number;
    noiseFrequency: number;
    noiseAmplitude: number;
    noiseOctaves: number;
    temperatureFrequency: number;
    temperatureThreshold: number;
    difficultyBias: number;
}

export interface MapGenConfigTable {
    configs: MapGenConfigRow[];
}

// ─── 默认地形配置数据 ──────────────────────────────────────

export const DEFAULT_TERRAIN_CONFIGS: TerrainTypeConfigRow[] = [
    { typeId: 'plains', displayName: '平原', moveSpeedModifier: 1.0, walkable: true, effectIds: ['speed_modifier'], visualAsset: 'terrain/plains', elevationMin: 0.4, elevationMax: 0.6 },
    { typeId: 'forest', displayName: '森林', moveSpeedModifier: 0.7, walkable: true, effectIds: ['speed_modifier', 'evasion_boost'], visualAsset: 'terrain/forest', elevationMin: 0.6, elevationMax: 0.75 },
    { typeId: 'mountain', displayName: '山地', moveSpeedModifier: 0.4, walkable: true, effectIds: ['speed_modifier', 'defense_boost'], visualAsset: 'terrain/mountain', elevationMin: 0.75, elevationMax: 0.9 },
    { typeId: 'water', displayName: '水域', moveSpeedModifier: 0.0, walkable: false, effectIds: [], visualAsset: 'terrain/water', elevationMin: 0.0, elevationMax: 0.3 },
    { typeId: 'desert', displayName: '沙漠', moveSpeedModifier: 0.8, walkable: true, effectIds: ['speed_modifier', 'cooldown_reduction'], visualAsset: 'terrain/desert', elevationMin: 0.4, elevationMax: 0.6 },
    { typeId: 'swamp', displayName: '沼泽', moveSpeedModifier: 0.5, walkable: true, effectIds: ['speed_modifier', 'dot_damage'], visualAsset: 'terrain/swamp', elevationMin: 0.3, elevationMax: 0.4 },
];

export const DEFAULT_MAP_GEN_CONFIGS: MapGenConfigRow[] = [
    { roomTypeId: 'battle', mapWidth: 15, mapHeight: 15, boundaryShape: 0, noiseFrequency: 0.08, noiseAmplitude: 1.0, noiseOctaves: 3, temperatureFrequency: 0.1, temperatureThreshold: 0.7, difficultyBias: 0.05 },
    { roomTypeId: 'elite', mapWidth: 12, mapHeight: 12, boundaryShape: 0, noiseFrequency: 0.12, noiseAmplitude: 1.0, noiseOctaves: 4, temperatureFrequency: 0.1, temperatureThreshold: 0.7, difficultyBias: 0.08 },
    { roomTypeId: 'boss', mapWidth: 18, mapHeight: 18, boundaryShape: 1, noiseFrequency: 0.05, noiseAmplitude: 1.0, noiseOctaves: 2, temperatureFrequency: 0.1, temperatureThreshold: 0.7, difficultyBias: 0.03 },
];
