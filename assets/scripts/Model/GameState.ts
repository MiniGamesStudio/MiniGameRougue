import { StorageManager } from '../Core/StorageManager';

/**
 * 游戏状态管理 — 集中管理游戏运行时数据
 * 使用 StorageManager 进行持久化
 */
export class GameState {
    private static _instance: GameState;

    /** 当前关卡 */
    currentLevel: number = 1;
    /** 当前得分 */
    score: number = 0;
    /** 是否暂停 */
    isPaused: boolean = false;
    /** 已解锁的最高关卡 */
    maxUnlockedLevel: number = 1;

    private static readonly STORAGE_KEY = 'save_data';

    static getInstance(): GameState {
        if (!this._instance) {
            this._instance = new GameState();
            this._instance.load();
        }
        return this._instance;
    }

    /** 从本地存储加载进度 */
    load(): void {
        const storage = StorageManager.getInstance();
        const data = storage.getObject<{ maxUnlockedLevel?: number }>(GameState.STORAGE_KEY);
        if (data) {
            this.maxUnlockedLevel = data.maxUnlockedLevel ?? 1;
        }
    }

    /** 保存进度到本地存储 */
    save(): void {
        StorageManager.getInstance().setObject(GameState.STORAGE_KEY, {
            maxUnlockedLevel: this.maxUnlockedLevel,
        });
    }

    /** 通关当前关卡 */
    completeLevel(): void {
        if (this.currentLevel >= this.maxUnlockedLevel) {
            this.maxUnlockedLevel = this.currentLevel + 1;
            this.save();
        }
    }

    /** 重置运行时状态 */
    resetRuntimeState(): void {
        this.score = 0;
        this.isPaused = false;
    }
}
