import { _decorator, ProgressBar } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { FrameworkConst } from '../../../framework/FrameworkConst';
import { FlowerUIID } from '../FlowerUIConfig';
const { ccclass, property } = _decorator;

@ccclass('LoadingPanel')
export class LoadingPanel extends UIBase {
    @property(ProgressBar)
    m_Progress: ProgressBar = null;

    private m_TimeDelta: number = 0;

    OnInit(): void {}

    OnOpen(...args: any[]): void {
        this.m_TimeDelta = 0;
        this.m_Progress.progress = 0;
    }

    OnClose(): void {
        super.OnClose();
    }

    protected update(dt: number): void {
        if (!this.m_Progress) return;

        this.m_TimeDelta += dt;
        this.m_Progress.progress = this.m_TimeDelta / FrameworkConst.LOADING_DURATION;
        if (this.m_Progress.progress >= 1) {
            this.m_TimeDelta = 0;
            UIManager.GetInstance().ClosePanel(FlowerUIID.LoadingPanel);
            UIManager.GetInstance().OpenPanel(FlowerUIID.MainPanel);
        }
    }
}
