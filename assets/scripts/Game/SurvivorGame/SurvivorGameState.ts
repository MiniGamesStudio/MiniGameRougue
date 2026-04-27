import { StorageManager } from '../../framework/StorageManager';

/**
 * 幸存者游戏持久化状态
 */
export class SurvivorGameState {
    private static _instance: SurvivorGameState;

    /** 历史最高存活时间（秒） */
    bestSurvivalTime: number = 0;
    /** 历史最高击杀数 */
    bestKillCount: number = 0;
    /** 累计金币 */
    totalCoins: number = 0;
    /** 已解锁角色 ID 列表 */
    unlockedCharacters: string[] = ['default'];

    private static readonly STORAGE_KEY = 'survivor_save';

    static getInstance(): SurvivorGameState {
        if (!this._instance) {
            this._instance = new SurvivorGameState();
            this._instance.load();
        }
        return this._instance;
    }

    load(): void {
        const data = StorageManager.getInstance().getObject<any>(SurvivorGameState.STORAGE_KEY);
        if (data) {
            this.bestSurvivalTime = data.bestSurvivalTime ?? 0;
            this.bestKillCount = data.bestKillCount ?? 0;
            this.totalCoins = data.totalCoins ?? 0;
            this.unlockedCharacters = data.unlockedCharacters ?? ['default'];
        }
    }

    save(): void {
        StorageManager.getInstance().setObject(SurvivorGameState.STORAGE_KEY, {
            bestSurvivalTime: this.bestSurvivalTime,
            bestKillCount: this.bestKillCount,
            totalCoins: this.totalCoins,
            unlockedCharacters: this.unlockedCharacters,
        });
    }

    /** 更新战斗结算记录 */
    updateBattleResult(survivalTime: number, killCount: number, coins: number): void {
        if (survivalTime > this.bestSurvivalTime) this.bestSurvivalTime = survivalTime;
        if (killCount > this.bestKillCount) this.bestKillCount = killCount;
        this.totalCoins += coins;
        this.save();
    }
}
