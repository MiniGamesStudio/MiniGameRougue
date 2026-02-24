import { _decorator, Button, Component, resources, Prefab, instantiate, Node } from 'cc';
import { UIManager } from './UIManager';
import { UIID } from '../UIScripts/UIData';
const {ccclass, property} = _decorator;

// UI 基类
@ccclass('UIBase')
export abstract class UIBase extends Component {
    public m_PanelID: number = 0;
    public m_UIID:UIID = UIID.None;
    
    protected m_SubPageMap:Map<string, Node> = new Map();

    // 可供子类重写的方法
    OnInit(): void {}

    OnOpen(...args: any[]): void {}

    OnClose(): void{
        this.m_SubPageMap.forEach((value, key)=>{
            if(value){
                this.DettachUIPage(key, value);
            }
        });
    }

    CloseSelf():void{
        if(this.m_UIID){
            UIManager.GetInstance().ClosePanel(this.m_UIID);
        }
    }

    SetBtnEvent(btn:Button, callback:Function, eventName:string = "click"):void {
        if(btn){
            btn.node.off(eventName);
            btn.node.on(eventName, callback);
        }
    }

    //加载子页面 每个界面加载的子页面pageName是唯一的
    AttachUIPage(root:Node, pageName:string, prefabPath:string, ...args: any[]):Boolean {
        if(root)
        {
            var subPageNode = this.m_SubPageMap.get(pageName);
            if(subPageNode)
            {
                subPageNode.active = true
                var uiScript = subPageNode.getComponent(UIBase);
                if(uiScript){
                    uiScript.OnOpen(...args);
                }

                return true;
            }

            resources.load(prefabPath, Prefab, (err, prefab)=>{
                if(root == null){
                    return false;
                }

                var pageNode = instantiate(prefab);
                pageNode.parent = root;
                pageNode.setPosition(0, 0);
                pageNode.active = true
                var uiScript = pageNode.getComponent(UIBase);
                if(uiScript){
                    uiScript.OnInit();
                    uiScript.OnOpen(...args);
                }

                this.m_SubPageMap.set(pageName, pageNode);
            });
                
            return true;
        }
                    
        return false;
    }

    DettachUIPage(subPageName:string, subPageNode:Node):Boolean {
        if(subPageNode)
        {
            var uiScript = subPageNode.getComponent(UIBase);
            if(uiScript){
                uiScript.OnClose();
            }
            subPageNode.removeFromParent();
            subPageNode.destroy();

            var has = this.m_SubPageMap.has(subPageName)
            if(has){
                this.m_SubPageMap.delete(subPageName)
            }
            return true;
        }

        return false;
    }
}