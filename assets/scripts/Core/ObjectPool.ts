import { instantiate, Node, Prefab } from 'cc';

/**
 * 通用对象池 — 减少频繁 instantiate/destroy 的开销
 *
 * 使用方式:
 *   // 创建池
 *   const pool = new ObjectPool(bulletPrefab, 20);
 *   // 获取节点
 *   const bullet = pool.get();
 *   bullet.parent = this.node;
 *   // 回收节点
 *   pool.put(bullet);
 *   // 销毁池
 *   pool.clear();
 */
export class ObjectPool {
    private _prefab: Prefab;
    private _pool: Node[] = [];
    private _maxSize: number;

    /**
     * @param prefab 预制体
     * @param initSize 初始预创建数量
     * @param maxSize 池最大容量（超出的回收节点直接销毁）
     */
    constructor(prefab: Prefab, initSize: number = 0, maxSize: number = 100) {
        this._prefab = prefab;
        this._maxSize = maxSize;

        for (let i = 0; i < initSize; i++) {
            const node = instantiate(this._prefab);
            node.active = false;
            this._pool.push(node);
        }
    }

    /** 从池中获取一个节点，池空则新建 */
    get(): Node {
        let node: Node;
        if (this._pool.length > 0) {
            node = this._pool.pop()!;
        } else {
            node = instantiate(this._prefab);
        }
        node.active = true;
        return node;
    }

    /** 回收节点到池中 */
    put(node: Node): void {
        if (!node || !node.isValid) return;

        node.removeFromParent();
        node.active = false;

        if (this._pool.length < this._maxSize) {
            this._pool.push(node);
        } else {
            node.destroy();
        }
    }

    /** 当前池中空闲节点数 */
    get size(): number {
        return this._pool.length;
    }

    /** 清空并销毁池中所有节点 */
    clear(): void {
        this._pool.forEach(node => {
            if (node && node.isValid) {
                node.destroy();
            }
        });
        this._pool.length = 0;
    }
}

/**
 * 对象池管理器 — 按名称管理多个对象池
 *
 * 使用方式:
 *   PoolManager.getInstance().createPool('bullet', bulletPrefab, 20);
 *   const bullet = PoolManager.getInstance().get('bullet');
 *   PoolManager.getInstance().put('bullet', bullet);
 */
export class PoolManager {
    private static _instance: PoolManager;
    private _pools: Map<string, ObjectPool> = new Map();

    static getInstance(): PoolManager {
        if (!this._instance) {
            this._instance = new PoolManager();
        }
        return this._instance;
    }

    /** 创建一个命名对象池 */
    createPool(name: string, prefab: Prefab, initSize: number = 0, maxSize: number = 100): ObjectPool {
        if (this._pools.has(name)) {
            console.warn(`PoolManager: 池 [${name}] 已存在，将被覆盖`);
            this._pools.get(name)!.clear();
        }
        const pool = new ObjectPool(prefab, initSize, maxSize);
        this._pools.set(name, pool);
        return pool;
    }

    /** 从命名池获取节点 */
    get(name: string): Node | null {
        const pool = this._pools.get(name);
        if (!pool) {
            console.warn(`PoolManager: 池 [${name}] 不存在`);
            return null;
        }
        return pool.get();
    }

    /** 回收节点到命名池 */
    put(name: string, node: Node): void {
        const pool = this._pools.get(name);
        if (!pool) {
            console.warn(`PoolManager: 池 [${name}] 不存在，节点将被销毁`);
            node.destroy();
            return;
        }
        pool.put(node);
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
