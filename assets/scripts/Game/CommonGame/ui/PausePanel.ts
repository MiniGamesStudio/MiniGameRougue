import { _decorator, Button, Node } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { CommonUIID } from '../CommonUIConfig';
const { ccclass } = _decorator;

export interface PausePanelOptions {
    onContinue?: () => void;
    onRestart?: () => void;
    onGoBack?: () => void;
}

@ccclass('PausePanel')
export class PausePanel extends UIBase {
    private m_OnContinue: (() => void) | null = null;
    private m_OnRestart: (() => void) | null = null;
    private m_OnGoBack: (() => void) | null = null;

    OnOpen(options: PausePanelOptions = {}): void {
        this.m_OnContinue = options.onContinue || null;
        this.m_OnRestart = options.onRestart || null;
        this.m_OnGoBack = options.onGoBack || null;
        this.bindButtons();
    }

    OnClose(): void {
        super.OnClose();
        this.m_OnContinue = null;
        this.m_OnRestart = null;
        this.m_OnGoBack = null;
    }

    private bindButtons(): void {
        this.bindButton('CloseBtn', () => this.continueGame());
        this.bindButton('ContinueBtn', () => this.continueGame());
        this.bindButton('RestartBtn', () => this.restartGame());
        this.bindButton('GoBackBtn', () => this.goBackMainPanel());
    }

    private continueGame(): void {
        const onContinue = this.m_OnContinue;
        this.closePausePanel();
        onContinue?.();
    }

    private restartGame(): void {
        const onRestart = this.m_OnRestart;
        this.closePausePanel();
        onRestart?.();
    }

    private goBackMainPanel(): void {
        const onGoBack = this.m_OnGoBack;
        this.closePausePanel();
        onGoBack?.();
    }

    private bindButton(name: string, callback: () => void): void {
        const node = this.findChildByName(this.node, name);
        const button = node?.getComponent(Button) || node?.addComponent(Button);
        if (button) {
            this.SetBtnEvent(button, callback);
        }
    }

    private closePausePanel(): void {
        if (this.m_UIID) {
            UIManager.GetInstance().ClosePanel(CommonUIID.PausePanel);
            return;
        }

        this.OnClose();
        this.node.removeFromParent();
        this.node.destroy();
    }

    private findChildByName(root: Node, name: string): Node | null {
        if (!root) return null;
        if (root.name === name) return root;

        for (const child of root.children) {
            const matched = this.findChildByName(child, name);
            if (matched) return matched;
        }

        return null;
    }
}
