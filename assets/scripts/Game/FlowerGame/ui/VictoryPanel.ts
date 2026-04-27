import { _decorator, Button, RichText } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { EventManager } from '../../../framework/EventManager';
import { FlowerUIID } from '../FlowerUIConfig';
import { FlowerEvent } from '../FlowerEvent';
const { ccclass, property } = _decorator;

@ccclass('VictoryPanel')
export class VictoryPanel extends UIBase {
    @property(Button)
    m_CloseBtn: Button = null;
    @property(Button)
    m_RetryBtn: Button = null;
    @property(Button)
    m_GoBackBtn: Button = null;
    @property(Button)
    m_NextLvBtn: Button = null;
    @property(RichText)
    m_ContentRichText: RichText = null;

    OnInit(): void {}

    OnOpen(...args: any[]): void {
        if (args == null) {
            this.CloseSelf();
            return;
        }

        let isVictory = false;
        if (args.length > 0) {
            isVictory = args[0];
        }

        this.SetBtnEvent(this.m_CloseBtn, () => {
            this.CloseSelf();
        });

        this.SetBtnEvent(this.m_RetryBtn, () => {
            this.CloseSelf();
            EventManager.getInstance().emit(FlowerEvent.RetryLevel);
        });

        this.SetBtnEvent(this.m_GoBackBtn, () => {
            this.CloseSelf();
            UIManager.GetInstance().OpenPanel(FlowerUIID.MainPanel);
            UIManager.GetInstance().ClosePanel(FlowerUIID.GamePanel);
        });

        this.SetBtnEvent(this.m_NextLvBtn, () => {
            this.CloseSelf();
            EventManager.getInstance().emit(FlowerEvent.NextLevel);
        });

        this.m_GoBackBtn.node.active = !isVictory;
        this.m_CloseBtn.node.active = !isVictory;
        this.m_NextLvBtn.node.active = isVictory;
    }

    OnClose(): void {
        super.OnClose();
    }
}
