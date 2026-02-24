import { _decorator, Component, Node, ProgressBar, Slider } from 'cc';
import { UIBase } from '../Core/UIBase';
import { UIManager } from '../Core/UIManager';
import { UIID } from './UIData';
const { ccclass, property } = _decorator;

@ccclass('LoadingPanel')
export class LoadingPanel extends UIBase {
    @property(ProgressBar)
    m_Progress:ProgressBar = null;

    private m_TimeDelta:number = 0;

    OnInit(): void {
        
    }

    OnOpen(...args: any[]): void {   
        this.m_TimeDelta = 0;
        this.m_Progress.progress = 0;     
    }

    OnClose(): void {
        super.OnClose()        
    }

    protected update(dt: number): void {
        if(this.m_Progress == null || this.m_Progress == undefined){
            return
        }
        
        this.m_TimeDelta += dt;
        this.m_Progress.progress = this.m_TimeDelta/1
        if(this.m_Progress.progress >= 1){
            this.m_TimeDelta = 0;
            UIManager.GetInstance().ClosePanel(UIID.LoadingPanel);
            UIManager.GetInstance().OpenPanel(UIID.MainPanel);
        }
    }
}