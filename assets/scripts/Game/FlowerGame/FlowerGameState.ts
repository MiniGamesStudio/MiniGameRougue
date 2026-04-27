import { StorageManager } from '../../framework/StorageManager';

/**
 * 插花游戏状态
 */
export class FlowerGameState {
    private static _instance: FlowerGameState;

    currentLevel: number = 1;
    score: number = 0;
    isPaused: boolean = false;
    maxUnlockedLevel: number = 1;

    private static readonly STORAGE_KEY = 'save_data';

    static getInstance(): FlowerGameState {
        if (!this._instance) {
            this._instance = new FlowerGameState();
            this._instance.load();
        }
        return this._instance;
    }

    load(): void {
        const data = StorageManager.getInstance().getObject<{ maxUnlockedLevel?: number }>(FlowerGameState.STORAGE_KEY);
        if (data) {
            this.maxUnlockedLevel = data.maxUnlockedLevel ?? 1;
        }
    }

    save(): void {
        StorageManager.getInstance().setObject(FlowerGameState.STORAGE_KEY, {
            maxUnlockedLevel: this.maxUnlockedLevel,
        });
    }

    completeLevel(): void {
        if (this.currentLevel >= this.maxUnlockedLevel) {
            this.maxUnlockedLevel = this.currentLevel + 1;
            this.save();
        }
    }

    resetRuntimeState(): void {
        this.score = 0;
        this.isPaused = false;
    }
}
