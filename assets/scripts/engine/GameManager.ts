import { _decorator, Node } from "cc";
import { UIManager } from "./ui/UIManager";
import { AudioManager } from "./AudioManager";
import { ResManager } from "./ResManager";
import { NodePoolManager } from "./NodePool";
import { TimerManager } from "../framework/TimerManager";
import { StorageManager } from "../framework/StorageManager";
import { PoolManager } from "../framework/ObjectPool";
import { EventManager } from "../framework/EventManager";
import { FrameworkEvent } from "../framework/FrameworkEvent";

const { ccclass } = _decorator;

/**
 * 游戏管理器 — 引擎层，统一初始化和驱动所有子系统
 * 桥接框架层（纯逻辑）和引擎层（Cocos 依赖），
 * 业务初始化通过 onGameReady 回调注入
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
     * @param onGameReady 游戏层初始化回调（注册 UI、加载首屏等）
     */
    Init(
        gameWorldRoot: Node,
        uiRoot: Node,
        persistNode: Node,
        onGameReady?: () => void
    ): void {
        if (this.m_Initialized) return;
        this.m_Initialized = true;

        this.m_GameWorldRoot = gameWorldRoot;

        // 1. 框架层 — 存储
        StorageManager.getInstance();

        // 2. 引擎层 — 音频
        AudioManager.getInstance().init(persistNode);

        // 3. 引擎层 — UI
        UIManager.GetInstance().Init(uiRoot);

        // 4. 游戏层初始化（注册 UI 面板、设置存储前缀、打开首屏等）
        if (onGameReady) {
            onGameReady();
        }
    }

    /** 每帧更新，由 Launcher 调用 */
    Update(dt: number): void {
        TimerManager.getInstance().update(dt);
    }

    /** 每帧 LateUpdate，由 Launcher 调用 */
    LateUpdate(_dt: number): void {
        // 预留
    }

    /** 销毁所有子系统 */
    Destroy(): void {
        TimerManager.getInstance().clear();
        PoolManager.getInstance().clearAll();
        NodePoolManager.getInstance().clearAll();
        AudioManager.getInstance().destroy();
        EventManager.getInstance().clear();
        ResManager.getInstance().releaseAll();
        this.m_Initialized = false;
    }

    /** 游戏进入后台 */
    PauseGame(): void {
        AudioManager.getInstance().pauseBGM();
        TimerManager.getInstance().pauseAll();
        EventManager.getInstance().emit(FrameworkEvent.GamePaused);
    }

    /** 游戏回到前台 */
    ResumeGame(): void {
        AudioManager.getInstance().resumeBGM();
        TimerManager.getInstance().resumeAll();
        EventManager.getInstance().emit(FrameworkEvent.GameResumed);
    }

    /** 获取游戏世界根节点 */
    getGameWorldRoot(): Node {
        return this.m_GameWorldRoot;
    }
}
