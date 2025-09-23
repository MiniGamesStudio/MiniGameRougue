import { _decorator, Component, Node } from 'cc';
import { UIBase } from '../Core/UIBase';
const { ccclass, property } = _decorator;

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
        this.InitUI(UIID.LoadingPanel, "LoadingPanel", "ui/LoadingPanel");
        this.InitUI(UIID.MainPanel, "MainPanel", "ui/MainPanel");
        this.InitUI(UIID.GamePanel, "GamePanel", "ui/GamePanel");
        this.InitUI(UIID.VictoryPanel, "VictoryPanel", "ui/VictoryPanel");
    }

    static InitUI(id:UIID, uiName:string, path:string, cacheCount:number = 1){
        var data = new UIData();
        data.id = id;
        data.name = uiName;
        data.prefabPath = path;
        data.cacheCount = cacheCount;
        this.m_DataMap.set(data.id, data);
    }
}


