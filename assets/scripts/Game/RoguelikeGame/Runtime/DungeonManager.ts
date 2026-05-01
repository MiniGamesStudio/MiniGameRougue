/**
 * 地牢管理器
 * 管理当前地牢状态：当前楼层、当前房间、已探索房间
 * 通过 RoomGenerator 生成楼层，通过 EventManager 发送事件
 */

import { EventManager } from '../../../framework/EventManager';
import { RoguelikeEvent } from '../RoguelikeEvent';
import { RoomGenerator } from './RoomGenerator';
import {
    DungeonFloor,
    FloorConfig,
    RoomNode,
} from '../Data/Interfaces/IRoomType';
import { HexGrid } from './HexTerrain/HexGrid';
import { HexRenderer } from './HexTerrain/HexRenderer';
import { FogOfWar } from './HexTerrain/FogOfWar';
import { TerrainEffectManager } from './HexTerrain/TerrainEffectManager';

/**
 * 地牢管理器
 * 负责楼层生成、房间进入/清除、楼层切换等核心地牢逻辑
 */
export class DungeonManager {
    /** 房间生成器 */
    private _roomGenerator: RoomGenerator;
    /** 楼层生成配置 */
    private _floorConfig: FloorConfig;
    /** 当前楼层数据 */
    private _currentFloor: DungeonFloor | null = null;
    /** 当前所在房间 ID */
    private _currentRoomId: string | null = null;
    /** 已探索的房间 ID 集合 */
    private _exploredRoomIds: Set<string> = new Set();
    /** 当前楼层索引 */
    private _currentFloorIndex: number = 0;

    /** 六角格渲染器（可选，运行时注入） */
    private _hexRenderer: HexRenderer | null = null;
    /** 战争迷雾系统（可选，运行时注入） */
    private _fogOfWar: FogOfWar | null = null;
    /** 地形效果管理器（可选，运行时注入） */
    private _terrainEffectManager: TerrainEffectManager | null = null;

    /**
     * @param roomGenerator 房间生成器实例
     * @param floorConfig 楼层生成配置
     */
    constructor(roomGenerator: RoomGenerator, floorConfig: FloorConfig) {
        this._roomGenerator = roomGenerator;
        this._floorConfig = floorConfig;
    }

    // ─── 属性访问 ───────────────────────────────────────────

    /** 获取当前楼层数据 */
    get currentFloor(): DungeonFloor | null {
        return this._currentFloor;
    }

    /** 获取当前楼层索引 */
    get currentFloorIndex(): number {
        return this._currentFloorIndex;
    }

    /** 获取当前房间 ID */
    get currentRoomId(): string | null {
        return this._currentRoomId;
    }

    /** 获取已探索房间 ID 集合 */
    get exploredRoomIds(): ReadonlySet<string> {
        return this._exploredRoomIds;
    }

    /** 获取六角格渲染器 */
    get hexRenderer(): HexRenderer | null {
        return this._hexRenderer;
    }

    /** 获取战争迷雾系统 */
    get fogOfWar(): FogOfWar | null {
        return this._fogOfWar;
    }

    /** 获取地形效果管理器 */
    get terrainEffectManager(): TerrainEffectManager | null {
        return this._terrainEffectManager;
    }

    // ─── 六角格系统注入 ─────────────────────────────────────

    /**
     * 设置六角格渲染器
     * @param renderer 六角格渲染器实例
     */
    setHexRenderer(renderer: HexRenderer): void {
        this._hexRenderer = renderer;
    }

    /**
     * 设置战争迷雾系统
     * @param fogOfWar 战争迷雾实例
     */
    setFogOfWar(fogOfWar: FogOfWar): void {
        this._fogOfWar = fogOfWar;
    }

    /**
     * 设置地形效果管理器
     * @param manager 地形效果管理器实例
     */
    setTerrainEffectManager(manager: TerrainEffectManager): void {
        this._terrainEffectManager = manager;
    }

    // ─── 核心方法 ───────────────────────────────────────────

    /**
     * 获取当前所在的房间节点
     * @returns 当前房间节点，若未进入任何房间则返回 null
     */
    getCurrentRoom(): RoomNode | null {
        if (!this._currentFloor || !this._currentRoomId) {
            return null;
        }
        return this._currentFloor.rooms.find(r => r.id === this._currentRoomId) ?? null;
    }

    /**
     * 生成第一个楼层并进入起始房间
     * 用于开始新的 Run
     */
    startDungeon(): void {
        this._currentFloorIndex = 0;
        this._exploredRoomIds.clear();
        this._currentFloor = this._roomGenerator.generateFloor(
            this._currentFloorIndex,
            this._floorConfig
        );

        EventManager.getInstance().emit(
            RoguelikeEvent.FloorEnter,
            this._currentFloor
        );

        // 自动进入起始房间
        if (this._currentFloor.startRoomId) {
            this.enterRoom(this._currentFloor.startRoomId);
        }
    }

    /**
     * 进入指定房间
     * @param roomId 目标房间 ID
     * @returns 是否成功进入
     */
    enterRoom(roomId: string): boolean {
        if (!this._currentFloor) {
            console.warn('DungeonManager: 尚未生成楼层，无法进入房间');
            return false;
        }

        const room = this._currentFloor.rooms.find(r => r.id === roomId);
        if (!room) {
            console.warn(`DungeonManager: 房间 [${roomId}] 不存在`);
            return false;
        }

        this._currentRoomId = roomId;
        this._exploredRoomIds.add(roomId);

        // 如果房间包含六角格地图，初始化/更新六角格子系统
        if (room.hexGrid) {
            this._initHexSystems(room.hexGrid);
        }

        EventManager.getInstance().emit(
            RoguelikeEvent.RoomEnter,
            room
        );

        return true;
    }

    /**
     * 标记当前房间为已清除
     * @returns 是否成功标记
     */
    clearRoom(): boolean {
        const room = this.getCurrentRoom();
        if (!room) {
            console.warn('DungeonManager: 当前没有所在房间，无法清除');
            return false;
        }

        room.cleared = true;

        // 清除地形效果管理器的跟踪数据
        if (this._terrainEffectManager) {
            this._terrainEffectManager.clear();
        }

        EventManager.getInstance().emit(
            RoguelikeEvent.RoomClear,
            room
        );

        return true;
    }

    /**
     * 生成下一楼层并进入起始房间
     * @returns 是否成功生成
     */
    generateNextFloor(): boolean {
        this._currentFloorIndex++;
        this._exploredRoomIds.clear();
        this._currentRoomId = null;

        // 清理上一楼层的六角格渲染
        if (this._hexRenderer) {
            this._hexRenderer.clear();
        }

        this._currentFloor = this._roomGenerator.generateFloor(
            this._currentFloorIndex,
            this._floorConfig
        );

        EventManager.getInstance().emit(
            RoguelikeEvent.FloorEnter,
            this._currentFloor
        );

        // 自动进入起始房间
        if (this._currentFloor.startRoomId) {
            this.enterRoom(this._currentFloor.startRoomId);
        }

        return true;
    }

    /**
     * 获取当前房间的相邻房间列表
     * @returns 可前往的房间节点数组
     */
    getAdjacentRooms(): RoomNode[] {
        if (!this._currentFloor || !this._currentRoomId) {
            return [];
        }

        const adjacentIds = new Set<string>();
        for (const conn of this._currentFloor.connections) {
            if (conn.fromRoomId === this._currentRoomId) {
                adjacentIds.add(conn.toRoomId);
            }
            if (conn.toRoomId === this._currentRoomId) {
                adjacentIds.add(conn.fromRoomId);
            }
        }

        return this._currentFloor.rooms.filter(r => adjacentIds.has(r.id));
    }

    /**
     * 重置地牢状态
     */
    reset(): void {
        // 清理六角格系统
        if (this._hexRenderer) {
            this._hexRenderer.clear();
        }
        if (this._terrainEffectManager) {
            this._terrainEffectManager.clear();
        }

        this._currentFloor = null;
        this._currentRoomId = null;
        this._exploredRoomIds.clear();
        this._currentFloorIndex = 0;
    }

    // ─── 六角格系统初始化 ───────────────────────────────────

    /**
     * 初始化/更新六角格子系统
     * 当进入包含六角格地图的房间时调用
     * @param hexGrid 房间的六角格网格数据
     */
    private _initHexSystems(hexGrid: HexGrid): void {
        // 初始化战争迷雾
        if (this._fogOfWar) {
            this._fogOfWar.init(hexGrid);
        }

        // 清除之前房间的地形效果
        if (this._terrainEffectManager) {
            this._terrainEffectManager.clear();
        }

        // 清除之前的渲染并准备新地图
        if (this._hexRenderer) {
            this._hexRenderer.clear();
        }
    }
}
