import { _decorator, Component } from 'cc';
import { UIManager } from './UIManager';
import { UIID } from '../UIScripts/UIData';
const {ccclass, property} = _decorator;

// UI 基类
@ccclass('UIBase')
export abstract class UIBase extends Component {
    public m_PanelID: number = 0;
    public m_UIID:UIID = UIID.None;
    
    // 可供子类重写的方法
    abstract onOpen(...args: any[]): void
    abstract onClose(): void

    CloseSelf():void{
        if(this.m_UIID){
            UIManager.GetInstance().ClosePanel(this.m_UIID);
        }
    }
}