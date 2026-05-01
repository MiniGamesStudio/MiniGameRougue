/**
 * 类型统一注册模块
 * 创建各系统的 TypeRegistry 实例并注册所有可扩展类型
 * 在 RoguelikeGameEntry 初始化时调用 registerAllTypes()
 */

import { TypeRegistry } from '../../../framework/TypeRegistry';

// 接口导入
import { IRoomType } from '../Data/Interfaces/IRoomType';
import { IEnemyType } from '../Data/Interfaces/IEnemyType';
import { IWeaponType } from '../Data/Interfaces/IWeaponType';
import { IPetType } from '../Data/Interfaces/IPetType';
import { IEventType } from '../Data/Interfaces/IEventType';
import { INpcType } from '../Data/Interfaces/INpcType';
import { IHexTerrainType } from '../Data/Interfaces/IHexTerrainType';
import { ITerrainEffect } from '../Data/Interfaces/ITerrainEffect';

// 房间类型导入
import { BattleRoom } from './Rooms/BattleRoom';
import { EliteRoom } from './Rooms/EliteRoom';
import { BossRoom } from './Rooms/BossRoom';
import { EventRoom } from './Rooms/EventRoom';
import { ShopRoom } from './Rooms/ShopRoom';
import { NpcRoom } from './Rooms/NpcRoom';

// 敌人类型导入
import { MeleeEnemy } from './Enemies/MeleeEnemy';
import { RangedEnemy } from './Enemies/RangedEnemy';
import { EliteEnemy } from './Enemies/EliteEnemy';
import { BossEnemy } from './Enemies/BossEnemy';

// 武器类型导入
import { MeleeWeapon } from './Weapons/MeleeWeapon';
import { ProjectileWeapon } from './Weapons/ProjectileWeapon';
import { AoeWeapon } from './Weapons/AoeWeapon';
import { OrbitWeapon } from './Weapons/OrbitWeapon';

// 宠物类型导入
import { AttackPet } from './Pets/AttackPet';
import { DefensePet } from './Pets/DefensePet';
import { SupportPet } from './Pets/SupportPet';

// 事件类型导入
import { RewardEvent } from './Events/RewardEvent';
import { TrapEvent } from './Events/TrapEvent';
import { NpcInteractEvent } from './Events/NpcInteractEvent';
import { AltarEvent } from './Events/AltarEvent';

// NPC 类型导入
import { BlacksmithNpc } from './Npcs/BlacksmithNpc';
import { SkillMasterNpc } from './Npcs/SkillMasterNpc';
import { ClassMasterNpc } from './Npcs/ClassMasterNpc';
import { MerchantNpc } from './Npcs/MerchantNpc';

// 地形类型导入
import { PlainsTerrain } from './Terrains/PlainsTerrain';
import { ForestTerrain } from './Terrains/ForestTerrain';
import { MountainTerrain } from './Terrains/MountainTerrain';
import { WaterTerrain } from './Terrains/WaterTerrain';
import { DesertTerrain } from './Terrains/DesertTerrain';
import { SwampTerrain } from './Terrains/SwampTerrain';

// 地形效果导入
import { SpeedModifierEffect } from './TerrainEffects/SpeedModifierEffect';
import { DefenseBoostEffect } from './TerrainEffects/DefenseBoostEffect';
import { DotDamageEffect } from './TerrainEffects/DotDamageEffect';
import { CooldownReductionEffect } from './TerrainEffects/CooldownReductionEffect';
import { EvasionBoostEffect } from './TerrainEffects/EvasionBoostEffect';

// ─── 注册表实例（全局单例） ───────────────────────────────

/** 房间类型注册表 */
export const roomRegistry = new TypeRegistry<IRoomType>();

/** 敌人类型注册表 */
export const enemyRegistry = new TypeRegistry<IEnemyType>();

/** 武器类型注册表 */
export const weaponRegistry = new TypeRegistry<IWeaponType>();

/** 宠物类型注册表 */
export const petRegistry = new TypeRegistry<IPetType>();

/** 事件类型注册表 */
export const eventTypeRegistry = new TypeRegistry<IEventType>();

/** NPC 类型注册表 */
export const npcRegistry = new TypeRegistry<INpcType>();

/** 地形类型注册表 */
export const terrainRegistry = new TypeRegistry<IHexTerrainType>();

/** 地形效果注册表 */
export const terrainEffectRegistry = new TypeRegistry<ITerrainEffect>();

// ─── 统一注册函数 ─────────────────────────────────────────

/**
 * 注册所有可扩展类型到各自的 TypeRegistry
 * 在模块初始化时由 RoguelikeGameEntry 调用
 */
export function registerAllTypes(): void {
    // 房间类型
    roomRegistry.register('battle', () => new BattleRoom());
    roomRegistry.register('elite', () => new EliteRoom());
    roomRegistry.register('boss', () => new BossRoom());
    roomRegistry.register('event', () => new EventRoom());
    roomRegistry.register('shop', () => new ShopRoom());
    roomRegistry.register('npc', () => new NpcRoom());

    // 敌人类型
    enemyRegistry.register('melee', () => new MeleeEnemy());
    enemyRegistry.register('ranged', () => new RangedEnemy());
    enemyRegistry.register('elite', () => new EliteEnemy());
    enemyRegistry.register('boss', () => new BossEnemy());

    // 武器类型
    weaponRegistry.register('melee', () => new MeleeWeapon());
    weaponRegistry.register('projectile', () => new ProjectileWeapon());
    weaponRegistry.register('aoe', () => new AoeWeapon());
    weaponRegistry.register('orbit', () => new OrbitWeapon());

    // 宠物类型
    petRegistry.register('attack', () => new AttackPet());
    petRegistry.register('defense', () => new DefensePet());
    petRegistry.register('support', () => new SupportPet());

    // 事件类型
    eventTypeRegistry.register('reward', () => new RewardEvent());
    eventTypeRegistry.register('trap', () => new TrapEvent());
    eventTypeRegistry.register('npc_interact', () => new NpcInteractEvent());
    eventTypeRegistry.register('altar', () => new AltarEvent());

    // NPC 类型
    npcRegistry.register('blacksmith', () => new BlacksmithNpc());
    npcRegistry.register('skill_master', () => new SkillMasterNpc());
    npcRegistry.register('class_master', () => new ClassMasterNpc());
    npcRegistry.register('merchant', () => new MerchantNpc());

    // 地形类型
    terrainRegistry.register('plains', () => new PlainsTerrain());
    terrainRegistry.register('forest', () => new ForestTerrain());
    terrainRegistry.register('mountain', () => new MountainTerrain());
    terrainRegistry.register('water', () => new WaterTerrain());
    terrainRegistry.register('desert', () => new DesertTerrain());
    terrainRegistry.register('swamp', () => new SwampTerrain());

    // 地形效果
    terrainEffectRegistry.register('speed_modifier', () => new SpeedModifierEffect());
    terrainEffectRegistry.register('defense_boost', () => new DefenseBoostEffect());
    terrainEffectRegistry.register('dot_damage', () => new DotDamageEffect());
    terrainEffectRegistry.register('cooldown_reduction', () => new CooldownReductionEffect());
    terrainEffectRegistry.register('evasion_boost', () => new EvasionBoostEffect());

    console.log(
        `[TypeRegistration] 类型注册完成：` +
        `房间 ${roomRegistry.getRegisteredTypes().length} 种，` +
        `敌人 ${enemyRegistry.getRegisteredTypes().length} 种，` +
        `武器 ${weaponRegistry.getRegisteredTypes().length} 种，` +
        `宠物 ${petRegistry.getRegisteredTypes().length} 种，` +
        `事件 ${eventTypeRegistry.getRegisteredTypes().length} 种，` +
        `NPC ${npcRegistry.getRegisteredTypes().length} 种，` +
        `地形 ${terrainRegistry.getRegisteredTypes().length} 种，` +
        `地形效果 ${terrainEffectRegistry.getRegisteredTypes().length} 种`
    );
}
