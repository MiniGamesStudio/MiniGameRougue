import { _decorator, Node } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { CommonGameProgress } from '../CommonGameProgress';
import { CommonUIID } from '../CommonUIConfig';
const { ccclass, property } = _decorator;

@ccclass('MainPage')
export class MainPage extends UIBase {
    @property(Node)
    m_TopRoot: Node = null;
    @property(Node)
    m_LeftRoot: Node = null;
    @property(Node)
    m_RightRoot: Node = null;
    @property(Node)
    m_MiddleRoot: Node = null;

    OnInit(): void {}

    OnOpen(): void {
        this.initUI();
    }

    OnClose(): void {
        super.OnClose();
        this.clearRoot(this.m_LeftRoot);
        this.clearRoot(this.m_RightRoot);
        this.clearRoot(this.m_MiddleRoot);
    }

    private initUI(): void {
        this.clearRoot(this.m_LeftRoot);
        this.clearRoot(this.m_RightRoot);
        this.clearRoot(this.m_MiddleRoot);

        this.InitUIButtons();
    }

    private InitUIButtons(): void {
        const buttons = this.CreateUIButtonsByTable(this.m_MiddleRoot, [
            {
                buttonName: "StartGame",
                buttonText: "开始游戏",
                buttonIcon: "buttons/Button01_145_Orange",
                onClick: () => {
                    const currentLevel = CommonGameProgress.getCurrentLevel(1);
                    UIManager.GetInstance().OpenPanelWithCallback(CommonUIID.GamePanel, () => {
                        UIManager.GetInstance().ClosePanel(CommonUIID.MainPanel);
                    }, currentLevel);
                },
            },
        ]);

        buttons.forEach((button, index) => {
            button.node.setPosition(0, 120 - index * 90, 0);
        });

        this.CreateUIButtonsByTable(this.m_RightRoot, [
            {
                buttonName: "Rank",
                buttonText: "排行榜",
                buttonIcon: "texture/Icon_ImageIcon_Ranking",
                onClick: () => {
                    UIManager.GetInstance().OpenPanel(CommonUIID.RankPanel);
                },
            },
        ]);
    }

    private clearRoot(root: Node): void {
        if (!root) return;

        root.children.forEach(node => {
            node.removeFromParent();
            node.destroy();
        });
    }
}
