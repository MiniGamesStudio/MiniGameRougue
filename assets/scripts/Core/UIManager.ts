import { _decorator, Component, instantiate, Node, Prefab, resources } from 'cc';
import { UIDataSet, UIID, UIData, UILayer } from '../UIScripts/UIData';
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

    private m_UIBackgroundRoot : Node = null
    private m_UINormalRoot : Node = null
    private m_UIPopupRoot : Node = null
    private m_UITipsRoot : Node = null
    private m_UISystemRoot : Node = null
    private m_UITopRoot : Node = null

    public Init(uiRoot : Node): void {
        this.m_UIRoot = uiRoot;
        this.m_PanelDataMap.clear();
        this.m_PanelNodeMap.clear();
        UIDataSet.InitUIDatas();

        this.m_UIBackgroundRoot = new Node("UI_Background");     // 背景层（如登录背景）
        this.m_UIBackgroundRoot.parent = this.m_UIRoot;
        
        this.m_UINormalRoot = new Node("UI_Normal");     // 普通层（主界面、主菜单）
        this.m_UINormalRoot.parent = this.m_UIRoot;
        
        this.m_UIPopupRoot = new Node("UI_Popup");       // 弹出层（设置、商城）
        this.m_UIPopupRoot.parent = this.m_UIRoot;
        
        this.m_UITipsRoot = new Node("UI_Tips");         // 提示层（飘字提示）
        this.m_UITipsRoot.parent = this.m_UIRoot;
        
        this.m_UISystemRoot = new Node("UI_System");        // 系统层（加载、断线重连）
        this.m_UISystemRoot.parent = this.m_UIRoot;
        
        this.m_UITopRoot = new Node("UI_Top");           // 最高层（GM命令、截屏提示）
        this.m_UITopRoot.parent = this.m_UIRoot;
    }

    public GetUIRootByUILayer(layer:UILayer):Node {
        var uiRoot:Node = null
        switch(layer){
            case UILayer.Background:
                uiRoot = this.m_UIBackgroundRoot
                break
            case UILayer.Normal:
                uiRoot = this.m_UINormalRoot
                break
            case UILayer.PopUp:
                uiRoot = this.m_UIPopupRoot
                break
            case UILayer.Tips:
                uiRoot = this.m_UITipsRoot
                break
            case UILayer.System:
                uiRoot = this.m_UISystemRoot
                break
            case UILayer.TopMost:
                uiRoot = this.m_UITopRoot
                break
        }

        return uiRoot
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
            var root = this.GetUIRootByUILayer(uidata.layer)
            if(root == null){
                return 0;
            }

            var uiNode = instantiate(prefab);
            uiNode.parent = root;
            uiNode.setPosition(0, 0);
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


