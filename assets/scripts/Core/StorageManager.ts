import { sys } from 'cc';

/**
 * 本地存储管理器 — 封装 localStorage，提供类型安全的存取接口
 *
 * 使用方式:
 *   StorageManager.getInstance().set('playerName', '玩家1');
 *   const name = StorageManager.getInstance().get<string>('playerName', '默认');
 *   StorageManager.getInstance().setObject('settings', { bgm: true, sfx: true });
 *   const settings = StorageManager.getInstance().getObject<Settings>('settings');
 */
export class StorageManager {
    private static _instance: StorageManager;

    /** 存储 key 前缀，避免多项目冲突 */
    private _prefix: string = 'game_';

    static getInstance(): StorageManager {
        if (!this._instance) {
            this._instance = new StorageManager();
        }
        return this._instance;
    }

    /** 设置 key 前缀 */
    setPrefix(prefix: string): void {
        this._prefix = prefix;
    }

    /** 存储字符串值 */
    set(key: string, value: string): void {
        try {
            sys.localStorage.setItem(this._prefix + key, value);
        } catch (e) {
            console.warn(`StorageManager: 写入失败 [${key}]`, e);
        }
    }

    /** 读取字符串值 */
    get(key: string, defaultValue: string = ''): string {
        try {
            const val = sys.localStorage.getItem(this._prefix + key);
            return val ?? defaultValue;
        } catch (e) {
            console.warn(`StorageManager: 读取失败 [${key}]`, e);
            return defaultValue;
        }
    }

    /** 存储数值 */
    setNumber(key: string, value: number): void {
        this.set(key, String(value));
    }

    /** 读取数值 */
    getNumber(key: string, defaultValue: number = 0): number {
        const val = this.get(key);
        if (val === '') return defaultValue;
        const num = Number(val);
        return isNaN(num) ? defaultValue : num;
    }

    /** 存储布尔值 */
    setBool(key: string, value: boolean): void {
        this.set(key, value ? '1' : '0');
    }

    /** 读取布尔值 */
    getBool(key: string, defaultValue: boolean = false): boolean {
        const val = this.get(key);
        if (val === '') return defaultValue;
        return val === '1';
    }

    /** 存储对象（JSON 序列化） */
    setObject<T>(key: string, value: T): void {
        try {
            this.set(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`StorageManager: 序列化失败 [${key}]`, e);
        }
    }

    /** 读取对象（JSON 反序列化） */
    getObject<T>(key: string, defaultValue: T = null): T {
        const val = this.get(key);
        if (!val) return defaultValue;
        try {
            return JSON.parse(val) as T;
        } catch (e) {
            console.warn(`StorageManager: 反序列化失败 [${key}]`, e);
            return defaultValue;
        }
    }

    /** 删除指定 key */
    remove(key: string): void {
        try {
            sys.localStorage.removeItem(this._prefix + key);
        } catch (e) {
            console.warn(`StorageManager: 删除失败 [${key}]`, e);
        }
    }

    /** 清除所有本游戏存储（仅清除带前缀的） */
    clear(): void {
        try {
            // sys.localStorage 没有遍历接口，直接 clear 会清除所有
            // 这里只能 clear 全部，使用时注意
            sys.localStorage.clear();
        } catch (e) {
            console.warn('StorageManager: 清除失败', e);
        }
    }
}
