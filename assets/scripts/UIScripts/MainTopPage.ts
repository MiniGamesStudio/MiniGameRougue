import { _decorator } from 'cc';
import { UIBase } from '../Core/UIBase';
const { ccclass, property } = _decorator;

@ccclass('MainTopPage')
export class MainTopPage extends UIBase {
    OnInit(): void {}
    OnOpen(...args: any[]): void {}

    OnClose(): void {
        super.OnClose();
    }
}
