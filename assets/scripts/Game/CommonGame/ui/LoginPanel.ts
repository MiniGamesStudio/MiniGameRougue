import { _decorator, Button } from 'cc';
import { PlatformManager, PlatformResult } from '../../../engine/PlatformManager';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { CommonUIID } from '../CommonUIConfig';
const { ccclass } = _decorator;

@ccclass('LoginPanel')
export class LoginPanel extends UIBase {
    private m_EnterButton: Button = null;
    private m_PrivacyButton: Button = null;
    private m_IsLoggingIn: boolean = false;
    private m_LoginSerial: number = 0;

    OnInit(): void {}

    OnOpen(): void {
        this.ensureEnterButton();
        this.ensurePrivacyButton();
        this.setEnterButtonVisible(false);
        this.login();
    }

    OnClose(): void {
        super.OnClose();
        this.m_LoginSerial++;
        this.m_IsLoggingIn = false;
    }

    private async login(): Promise<void> {
        if (this.m_IsLoggingIn) return;

        this.m_IsLoggingIn = true;
        const serial = ++this.m_LoginSerial;
        this.setEnterButtonVisible(false);

        const privacyResult = await PlatformManager.getInstance().ensurePrivacyAuthorize();
        if (serial !== this.m_LoginSerial || !this.isValid) return;
        if (privacyResult.result !== PlatformResult.Success) {
            this.m_IsLoggingIn = false;
            console.warn('LoginPanel: 隐私授权失败', privacyResult);
            this.setEnterButtonVisible(true);
            return;
        }

        const result = await PlatformManager.getInstance().login();
        if (serial !== this.m_LoginSerial || !this.isValid) return;

        this.m_IsLoggingIn = false;
        if (result.result === PlatformResult.Success || result.result === PlatformResult.Unsupported) {
            console.log('LoginPanel: 进入主界面', result);
            UIManager.GetInstance().ClosePanel(CommonUIID.LoginPanel);
            UIManager.GetInstance().OpenPanel(CommonUIID.MainPanel);
            return;
        }

        console.warn('LoginPanel: 登录失败', result);
        this.setEnterButtonVisible(true);
    }

    private ensureEnterButton(): void {
        if (this.m_EnterButton && this.m_EnterButton.isValid) return;

        this.m_EnterButton = this.CreateUIButton(
            this.node,
            'EnterGame',
            '进入游戏',
            'buttons/Button01_145_Orange',
            () => this.login(),
        );
        if (this.m_EnterButton) {
            this.m_EnterButton.node.setPosition(0, -300, 0);
        }
    }

    private ensurePrivacyButton(): void {
        if (this.m_PrivacyButton && this.m_PrivacyButton.isValid) return;

        this.m_PrivacyButton = this.CreateUIButton(
            this.node,
            'PrivacyContract',
            '隐私协议',
            'buttons/Button01_145_Orange',
            () => this.openPrivacyContract(),
        );
        if (this.m_PrivacyButton) {
            this.m_PrivacyButton.node.setPosition(0, -420, 0);
        }
    }

    private async openPrivacyContract(): Promise<void> {
        const result = await PlatformManager.getInstance().openPrivacyContract();
        if (result.result !== PlatformResult.Success) {
            console.warn('LoginPanel: 展示隐私协议失败', result);
        }
    }

    private setEnterButtonVisible(visible: boolean): void {
        if (this.m_EnterButton && this.m_EnterButton.isValid) {
            this.m_EnterButton.node.active = visible;
        }
    }
}
