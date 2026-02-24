import { _decorator, Button, Component, Node, ProgressBar, Slider } from 'cc';
import { UIBase } from '../Core/UIBase';
import { UIManager } from '../Core/UIManager';
import { UIID } from './UIData';
const { ccclass, property } = _decorator;

@ccclass('GamePage')
export class GamePage extends UIBase {
    @property(Button)
    m_StartBtn:Button = null;

    OnInit(): void {
        
    }

    OnOpen(...args: any[]): void { 
        this.SetBtnEvent(this.m_StartBtn, ()=>{
            UIManager.GetInstance().ClosePanel(UIID.MainPanel);
            UIManager.GetInstance().OpenPanel(UIID.GamePanel);
        });
    }

    OnClose(): void {
        super.OnClose()
    }
}