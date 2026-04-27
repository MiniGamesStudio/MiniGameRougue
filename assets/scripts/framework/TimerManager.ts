/**
 * 定时器管理器 — 提供与 Component 生命周期解耦的定时器
 * 框架层：纯逻辑，不依赖任何引擎 API
 *
 * 使用方式:
 *   const id = TimerManager.getInstance().once(2.0, () => { console.log('2秒后'); });
 *   const id = TimerManager.getInstance().loop(1.0, () => { console.log('每秒'); });
 *   TimerManager.getInstance().cancel(id);
 *
 * 需要在引擎层每帧调用 TimerManager.getInstance().update(dt)
 */

interface TimerEntry {
    id: number;
    delay: number;
    elapsed: number;
    callback: () => void;
    repeat: boolean;
    paused: boolean;
}

export class TimerManager {
    private static _instance: TimerManager;
    private _timers: Map<number, TimerEntry> = new Map();
    private _nextId: number = 1;

    static getInstance(): TimerManager {
        if (!this._instance) {
            this._instance = new TimerManager();
        }
        return this._instance;
    }

    /** 注册一次性定时器 */
    once(delay: number, callback: () => void): number {
        return this.addTimer(delay, callback, false);
    }

    /** 注册循环定时器 */
    loop(interval: number, callback: () => void): number {
        return this.addTimer(interval, callback, true);
    }

    /** 取消定时器 */
    cancel(id: number): void {
        this._timers.delete(id);
    }

    /** 暂停定时器 */
    pause(id: number): void {
        const timer = this._timers.get(id);
        if (timer) timer.paused = true;
    }

    /** 恢复定时器 */
    resume(id: number): void {
        const timer = this._timers.get(id);
        if (timer) timer.paused = false;
    }

    /** 暂停所有定时器 */
    pauseAll(): void {
        this._timers.forEach(t => t.paused = true);
    }

    /** 恢复所有定时器 */
    resumeAll(): void {
        this._timers.forEach(t => t.paused = false);
    }

    /** 清除所有定时器 */
    clear(): void {
        this._timers.clear();
    }

    /**
     * 每帧调用，驱动所有定时器
     * 由引擎层 GameManager.Update(dt) 调用
     */
    update(dt: number): void {
        const toRemove: number[] = [];

        this._timers.forEach((timer, id) => {
            if (timer.paused) return;

            timer.elapsed += dt;
            if (timer.elapsed >= timer.delay) {
                timer.callback();
                if (timer.repeat) {
                    timer.elapsed -= timer.delay;
                } else {
                    toRemove.push(id);
                }
            }
        });

        toRemove.forEach(id => this._timers.delete(id));
    }

    private addTimer(delay: number, callback: () => void, repeat: boolean): number {
        const id = this._nextId++;
        this._timers.set(id, {
            id,
            delay,
            elapsed: 0,
            callback,
            repeat,
            paused: false,
        });
        return id;
    }
}
