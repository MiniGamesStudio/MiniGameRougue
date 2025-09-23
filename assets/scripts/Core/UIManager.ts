import { _decorator, Component, instantiate, Node, Prefab, resources } from 'cc';
import { UIDataSet, UIID, UIData } from '../UIScripts/UIData';
import { UIBase } from './UIBase';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager {
    private static m_Instance:UIManager = null;

    public static GetInstance(): UIManager {
        if(this.m_Instance == null){
            this.m_Instance = new UIManager();
        }

        return this.m_Instance;
    }
    
    private m_PanelID = 1;
    private m_UIRoot : Node = null
    private m_PanelDataMap:Map<UIID, Array<number>> = new Map();
    private m_PanelNodeMap:Map<number, Node> = new Map();

    public Init(uiRoot : Node): void {
        this.m_UIRoot = uiRoot;
        this.m_PanelDataMap.clear();
        this.m_PanelNodeMap.clear();
        UIDataSet.InitUIDatas();
    }

    public ClosePanelByID(panelID: number):Boolean {
        var node = this.m_PanelNodeMap.get(panelID);
        if(node){
            var nodeScript = node.getComponent(UIBase);
            if(nodeScript){
                nodeScript.onClose();
            }
            node.removeFromParent();
            node.destroy();
            this.m_PanelNodeMap.delete(panelID);
            return true;
        }

        return false;
    }

    public ClosePanel(id: UIID): Boolean {
        var datas = this.m_PanelDataMap.get(id);
        if(datas){
            datas.forEach(pID =>{
                this.ClosePanelByID(pID);
            });
            this.m_PanelDataMap.delete(id);
            return true;
        }

        return false;
    }

    public OpenPanel(id: UIID, ...args: any[]):number {
        var uidata = UIDataSet.FindUIData(id);
        if(uidata == null || uidata == undefined){
            return 0;
        }

        var temp = this.CheckPanel(id);
        if(temp > 0){
            return temp;
        }

        resources.load(uidata.prefabPath, Prefab, (err, prefab)=>{
            if(this.m_UIRoot == null){
                return 0;
            }

            var uiNode = instantiate(prefab);
            uiNode.parent = this.m_UIRoot;
            var uiScript = uiNode.getComponent(UIBase);
            if(uiScript){
                uiScript.m_PanelID = this.m_PanelID;
                uiScript.m_UIID = id;
                uiScript.onOpen(...args);
            }

            var uiDatas = this.m_PanelDataMap.get(id);
            if(uiDatas){
                uiDatas.push(this.m_PanelID);
                this.m_PanelDataMap.set(id, uiDatas);
            }
            else{
                var arr = new Array();
                arr.push(this.m_PanelID);
                this.m_PanelDataMap.set(id, arr);
            }

            this.m_PanelNodeMap.set(this.m_PanelID, uiNode);
            ++this.m_PanelID;
        });

        return 0;
    }

    private CheckPanel(id: UIID):number{
        var uiDatas = this.m_PanelDataMap.get(id);
        if(uiDatas == null || uiDatas == undefined){
            return 0;
        }

        var temp = new Array<number>();
        uiDatas.forEach(panelID => {
            var panelNode = this.m_PanelNodeMap.get(panelID);
            if(panelNode){
                if(panelNode.active == false){
                    panelNode.active = true;
                    var uiScript = panelNode.getComponent(UIBase);
                    if(uiScript){
                        uiScript.m_PanelID = panelID;
                        uiScript.m_UIID = id;
                        uiScript.onOpen();
                    }
                    return panelID;
                }
            }
            else{
                temp.push(panelID);
            }
        });

        temp.forEach(pID => {
            uiDatas.filter(v => v !== pID);
        });

        return 0;
    }
}


