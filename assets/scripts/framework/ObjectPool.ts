/**
 * 通用对象池 — 框架层纯逻辑版本
 * 不依赖任何引擎 API，适用于任意对象的池化管理
 *
 * 使用方式:
 *   const pool = new ObjectPool(() => new Bullet(), b => b.reset(), b => b.dispose(), 20);
 *   const bullet = pool.get();
 *   pool.put(bullet);
 */

export class ObjectPool<T> {
    private _pool: T[] = [];
    private _maxSize: number;
    private _factory: () => T;
    private _onGet?: (obj: T) => void;
    private _onPut?: (obj: T) => void;
    private _onDestroy?: (obj: T) => void;

    /**
     * @param factory    创建新对象的工厂函数
     * @param onGet      从池中取出时的回调（可选）
     * @param onPut      放回池中时的回调（可选）
     * @param onDestroy  池满时销毁对象的回调（可选）
     * @param initSize   初始预创建数量
     * @param maxSize    池最大容量
     */
    constructor(
        factory: () => T,
        onGet?: (obj: T) => void,
        onPut?: (obj: T) => void,
        onDestroy?: (obj: T) => void,
        initSize: number = 0,
        maxSize: number = 100,
    ) {
        this._factory = factory;
        this._onGet = onGet;
        this._onPut = onPut;
        this._onDestroy = onDestroy;
        this._maxSize = maxSize;

        for (let i = 0; i < initSize; i++) {
            this._pool.push(this._factory());
        }
    }

    /** 从池中获取一个对象，池空则新建 */
    get(): T {
        let obj: T;
        if (this._pool.length > 0) {
            obj = this._pool.pop()!;
        } else {
            obj = this._factory();
        }
        this._onGet?.(obj);
        return obj;
    }

    /** 回收对象到池中 */
    put(obj: T): void {
        if (obj == null) return;
        this._onPut?.(obj);

        if (this._pool.length < this._maxSize) {
            this._pool.push(obj);
        } else {
            this._onDestroy?.(obj);
        }
    }

    /** 当前池中空闲对象数 */
    get size(): number {
        return this._pool.length;
    }

    /** 清空并销毁池中所有对象 */
    clear(): void {
        if (this._onDestroy) {
            this._pool.forEach(obj => this._onDestroy!(obj));
        }
        this._pool.length = 0;
    }
}

/**
 * 对象池管理器 — 按名称管理多个对象池
 */
export class PoolManager {
    private static _instance: PoolManager;
    private _pools: Map<string, ObjectPool<any>> = new Map();

    static getInstance(): PoolManager {
        if (!this._instance) {
            this._instance = new PoolManager();
        }
        return this._instance;
    }

    /** 注册一个命名对象池 */
    register<T>(name: string, pool: ObjectPool<T>): void {
        if (this._pools.has(name)) {
            console.warn(`PoolManager: 池 [${name}] 已存在，将被覆盖`);
            this._pools.get(name)!.clear();
        }
        this._pools.set(name, pool);
    }

    /** 从命名池获取对象 */
    get<T>(name: string): T | null {
        const pool = this._pools.get(name) as ObjectPool<T> | undefined;
        if (!pool) {
            console.warn(`PoolManager: 池 [${name}] 不存在`);
            return null;
        }
        return pool.get();
    }

    /** 回收对象到命名池 */
    put<T>(name: string, obj: T): void {
        const pool = this._pools.get(name) as ObjectPool<T> | undefined;
        if (!pool) {
            console.warn(`PoolManager: 池 [${name}] 不存在`);
            return;
        }
        pool.put(obj);
    }

    /** 清空指定池 */
    clearPool(name: string): void {
        this._pools.get(name)?.clear();
        this._pools.delete(name);
    }

    /** 清空所有池 */
    clearAll(): void {
        this._pools.forEach(pool => pool.clear());
        this._pools.clear();
    }
}
