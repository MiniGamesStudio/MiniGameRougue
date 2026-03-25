import { _decorator, Node } from "cc";
import { UIManager } from "./UIManager";
import { AudioManager } from "./AudioManager";
import { TimerManager } from "./TimerManager";
import { StorageManager } from "./StorageManager";
import { ResManager } from "./ResManager";
import { PoolManager } from "./ObjectPool";
import { EventManager } from "./EventManager";
import { GameState } from "../Model/GameState";
import { UIID } from "../UIScripts/UIData";
import { CustomClientEvent } from "../Config/Config";
const { ccclass } = _decorator;

/**
 * 游戏管理器 — 全局生命周期管理，统一初始化和驱动所有子系统
 *
 * 子系统初始化顺序:
 *   StorageManager → AudioManager → UIManager → GameState
 *
 * 每帧驱动:
 *   TimerManager.update(dt)
 */
@ccclass('GameManager')
export class GameManager {
    private static m_Instance: GameManager = null;

    static GetInstance(): GameManager {
        if (this.m_Instance == null) {
            this.m_Instance = new GameManager();
        }
        return this.m_Instance;
    }

    private m_GameWorldRoot: Node = null;
    private m_Initialized: boolean = false;

    /**
     * 初始化所有子系统
     * @param gameWorldRoot 游戏世界根节点
     * @param uiRoot UI 根节点
     * @param persistNode 常驻节点（用于挂载 AudioSource 等）
     */
    Init(gameWorldRoot: Node, uiRoot: Node, persistNode: Node): void {
        if (this.m_Initialized) return;
        this.m_Initialized = true;

        this.m_GameWorldRoot = gameWorldRoot;

        // 1. 存储（最先，其他模块可能需要读取配置）
        StorageManager.getInstance().setPrefix('flower_');

        // 2. 音频
        AudioManager.getInstance().init(persistNode);

        // 3. UI
        UIManager.GetInstance().Init(uiRoot);

        // 4. 游戏状态（会从 StorageManager 读取存档）
        GameState.getInstance();

        // 5. 打开首屏
        UIManager.GetInstance().OpenPanel(UIID.LoadingPanel);
    }

    /** 每帧更新，由 Launcher 调用 */
    Update(dt: number): void {
        TimerManager.getInstance().update(dt);
    }

    /** 每帧 LateUpdate，由 Launcher 调用 */
    LateUpdate(dt: number): void {
        // 预留
    }

    /** 销毁所有子系统 */
    Destroy(): void {
        TimerManager.getInstance().clear();
        PoolManager.getInstance().clearAll();
        AudioManager.getInstance().destroy();
        EventManager.getInstance().clear();
        ResManager.getInstance().releaseAll();
        this.m_Initialized = false;
    }

    /** 游戏进入后台 */
    PauseGame(): void {
        const state = GameState.getInstance();
        state.isPaused = true;
        AudioManager.getInstance().pauseBGM();
        TimerManager.getInstance().pauseAll();
        EventManager.getInstance().emit(CustomClientEvent.GamePaused);
    }

    /** 游戏回到前台 */
    ResumeGame(): void {
        const state = GameState.getInstance();
        state.isPaused = false;
        AudioManager.getInstance().resumeBGM();
        TimerManager.getInstance().resumeAll();
        EventManager.getInstance().emit(CustomClientEvent.GameResumed);
    }

    /** 获取游戏世界根节点 */
    getGameWorldRoot(): Node {
        return this.m_GameWorldRoot;
    }
}
