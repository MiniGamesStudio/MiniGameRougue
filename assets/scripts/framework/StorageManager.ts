/**
 * 本地存储管理器 — 封装 localStorage，提供类型安全的存取接口
 * 框架层：仅依赖 Web 标准 API（localStorage），不依赖引擎
 *
 * 使用方式:
 *   StorageManager.getInstance().set('playerName', '玩家1');
 *   const name = StorageManager.getInstance().get<string>('playerName', '默认');
 *   StorageManager.getInstance().setObject('settings', { bgm: true, sfx: true });
 */

/** 存储后端接口，方便替换为其他实现 */
export interface IStorageBackend {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
    /** 可选：遍历所有 key */
    keys?(): string[];
}

/** 默认使用 Web localStorage */
class WebStorageBackend implements IStorageBackend {
    getItem(key: string): string | null {
        return localStorage.getItem(key);
    }
    setItem(key: string, value: string): void {
        localStorage.setItem(key, value);
    }
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }
    clear(): void {
        localStorage.clear();
    }
    keys(): string[] {
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) result.push(key);
        }
        return result;
    }
}

export class StorageManager {
    private static _instance: StorageManager;

    /** 存储 key 前缀，避免多项目冲突 */
    private _prefix: string = 'game_';
    private _backend: IStorageBackend;

    constructor(backend?: IStorageBackend) {
        this._backend = backend ?? new WebStorageBackend();
    }

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

    /** 替换存储后端 */
    setBackend(backend: IStorageBackend): void {
        this._backend = backend;
    }

    /** 存储字符串值 */
    set(key: string, value: string): void {
        try {
            this._backend.setItem(this._prefix + key, value);
        } catch (e) {
            console.warn(`StorageManager: 写入失败 [${key}]`, e);
        }
    }

    /** 读取字符串值 */
    get(key: string, defaultValue: string = ''): string {
        try {
            const val = this._backend.getItem(this._prefix + key);
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
            this._backend.removeItem(this._prefix + key);
        } catch (e) {
            console.warn(`StorageManager: 删除失败 [${key}]`, e);
        }
    }

    /** 清除所有本游戏存储（仅清除带当前前缀的 key） */
    clear(): void {
        try {
            if (this._backend.keys) {
                const allKeys = this._backend.keys();
                for (const key of allKeys) {
                    if (key.startsWith(this._prefix)) {
                        this._backend.removeItem(key);
                    }
                }
            } else {
                this._backend.clear();
            }
        } catch (e) {
            console.warn('StorageManager: 清除失败', e);
        }
    }
}
