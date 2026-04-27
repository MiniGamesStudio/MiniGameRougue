import { _decorator, Button } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { FlowerUIID } from '../FlowerUIConfig';
const { ccclass, property } = _decorator;

@ccclass('GamePage')
export class GamePage extends UIBase {
    @property(Button)
    m_StartBtn: Button = null;

    OnInit(): void {}

    OnOpen(...args: any[]): void {
        this.SetBtnEvent(this.m_StartBtn, () => {
            UIManager.GetInstance().ClosePanel(FlowerUIID.MainPanel);
            UIManager.GetInstance().OpenPanel(FlowerUIID.GamePanel);
        });
    }

    OnClose(): void {
        super.OnClose();
    }
}
