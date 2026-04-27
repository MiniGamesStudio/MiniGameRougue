import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * UI 层级枚举 — 引擎层，所有游戏通用
 */
export enum UILayer {
    Background = 0,
    Normal = 1000,
    PopUp = 2000,
    Tips = 3000,
    System = 4000,
    TopMost = 9999,
}

/**
 * UI 打开模式
 */
export enum UIShowMode {
    Normal,       // 可同时打开多个
    HideOther,    // 打开时隐藏同层其他 UI
    Single,       // 单例，再次打开复用
    Overlay,      // 叠加，不隐藏其他 UI
}

/**
 * 单条 UI 配置数据
 */
@ccclass('UIData')
export class UIData {
    id: number;
    layer: UILayer;
    name: string;
    prefabPath: string;
    showMode: UIShowMode;
    cacheCount: number;
}

/**
 * UI 数据注册表 — 引擎层提供注册/查找能力，游戏层负责注册具体面板
 */
@ccclass('UIDataRegistry')
export class UIDataRegistry {
    private static m_DataMap: Map<number, UIData> = new Map();

    /** 查找 UI 配置 */
    static FindUIData(id: number): UIData | null {
        return this.m_DataMap.get(id) ?? null;
    }

    /** 注册单个 UI 面板配置 */
    static Register(
        id: number,
        layer: UILayer,
        uiName: string,
        path: string,
        showMode: UIShowMode = UIShowMode.Normal,
        cacheCount: number = 0
    ): void {
        const data = new UIData();
        data.id = id;
        data.layer = layer;
        data.name = uiName;
        data.prefabPath = path;
        data.showMode = showMode;
        data.cacheCount = showMode === UIShowMode.Single ? 1 : cacheCount;
        this.m_DataMap.set(data.id, data);
    }

    /** 清空所有注册数据 */
    static Clear(): void {
        this.m_DataMap.clear();
    }
}
