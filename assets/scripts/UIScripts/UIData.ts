import { _decorator, Component, Node } from 'cc';
import { UIBase } from '../Core/UIBase';
const { ccclass, property } = _decorator;

export enum UILayer{
    Background = 0,    // 背景层（如登录背景）
    Normal = 1000,     // 普通层（主界面、主菜单）
    PopUp = 2000,      // 弹出层（设置、商城）
    Tips = 3000,       // 提示层（飘字提示）
    System = 4000,     // 系统层（加载、断线重连）
    TopMost = 9999     // 最高层（GM命令、截屏提示）
}

export enum UIID{
    None,
    LoadingPanel,
    MainPanel,
    GamePanel,
    VictoryPanel,
}

@ccclass('UIData')
export class UIData{
    id:UIID;
    layer:UILayer;
    name:string;
    prefabPath:string;
    cacheCount:number;
}

@ccclass('UIDataSet')
export class UIDataSet {
    public static m_DataMap:Map<UIID, UIData> = new Map();

    public static FindUIData(id: UIID):UIData{
        if(this.m_DataMap == null){
            return null;
        }

        return this.m_DataMap.get(id);
    }

    public static InitUIDatas(){
        this.InitUI(UIID.LoadingPanel, UILayer.System, "LoadingPanel", "ui/LoadingPanel");
        this.InitUI(UIID.MainPanel, UILayer.Normal, "MainPanel", "ui/MainPanel");
        this.InitUI(UIID.GamePanel, UILayer.Normal, "GamePanel", "ui/GamePanel");
        this.InitUI(UIID.VictoryPanel, UILayer.Normal, "VictoryPanel", "ui/VictoryPanel");
    }

    static InitUI(id:UIID, layer:UILayer, uiName:string, path:string, cacheCount:number = 1){
        var data = new UIData();
        data.id = id;
        data.layer = layer
        data.name = uiName;
        data.prefabPath = path;
        data.cacheCount = cacheCount;
        this.m_DataMap.set(data.id, data);
    }
}


