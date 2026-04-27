/**
 * 事件管理器 — 全局事件总线
 * 框架层：纯逻辑，不依赖任何引擎 API
 */

interface EventHandler {
    callback: Function;
    target: any;
    once: boolean;
}

export class EventManager {
    private static _instance: EventManager;
    private _events: Map<string, EventHandler[]> = new Map();

    static getInstance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    on(eventName: string, callback: Function, target?: any): void {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        const handlers = this._events.get(eventName)!;
        const exists = handlers.some(h => h.callback === callback && h.target === (target ?? null));
        if (!exists) {
            handlers.push({ callback, target: target ?? null, once: false });
        }
    }

    /** 注册一次性监听，触发后自动移除 */
    once(eventName: string, callback: Function, target?: any): void {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName)!.push({ callback, target: target ?? null, once: true });
    }

    off(eventName: string, callback: Function, target?: any): void {
        const handlers = this._events.get(eventName);
        if (!handlers) return;
        const t = target ?? null;
        for (let i = handlers.length - 1; i >= 0; i--) {
            if (handlers[i].callback === callback && handlers[i].target === t) {
                handlers.splice(i, 1);
            }
        }
        if (handlers.length === 0) {
            this._events.delete(eventName);
        }
    }

    emit(eventName: string, ...args: any[]): void {
        const handlers = this._events.get(eventName);
        if (!handlers || handlers.length === 0) return;

        const snapshot = handlers.slice();
        for (const handler of snapshot) {
            handler.callback.call(handler.target, ...args);
            if (handler.once) {
                this.off(eventName, handler.callback, handler.target);
            }
        }
    }

    /** 移除某个 target 的所有监听 */
    offAllByTarget(target: any): void {
        if (target == null) return;
        this._events.forEach((handlers, eventName) => {
            for (let i = handlers.length - 1; i >= 0; i--) {
                if (handlers[i].target === target) {
                    handlers.splice(i, 1);
                }
            }
            if (handlers.length === 0) {
                this._events.delete(eventName);
            }
        });
    }

    /** 检查某事件是否有监听 */
    hasListeners(eventName: string): boolean {
        const handlers = this._events.get(eventName);
        return !!handlers && handlers.length > 0;
    }

    /** 清除所有事件 */
    clear(): void {
        this._events.clear();
    }
}
