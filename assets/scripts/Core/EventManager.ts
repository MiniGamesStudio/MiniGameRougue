import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EventManager')
export class EventManager extends Component {
    private static _instance: EventManager;
    private _events: Map<string, Array<{callback: Function, target: any}>> = new Map();

    static getInstance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    on(eventName: string, callback: Function, target?: any) {
        if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
        }
        this._events.get(eventName).push({callback, target});
    }

    off(eventName: string, callback: Function, target?: any) {
        const handlers = this._events.get(eventName);
        if (handlers) {
            for (let i = handlers.length - 1; i >= 0; i--) {
                if (handlers[i].callback === callback && handlers[i].target === target) {
                    handlers.splice(i, 1);
                }
            }
        }
    }

    emit(eventName: string, data?: any) {
        const handlers = this._events.get(eventName);
        if (handlers) {
            handlers.forEach(handler => {
                handler.callback.call(handler.target, data);
            });
        }
    }
}


