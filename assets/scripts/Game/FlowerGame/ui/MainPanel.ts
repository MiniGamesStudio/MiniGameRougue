import { _decorator, Button, instantiate, Node, Prefab, resources, Tween, tween, Vec3, view } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { FrameworkConst } from '../../../framework/FrameworkConst';
const { ccclass, property } = _decorator;

export enum PageType {
    ShopPage = "ShopPage",
    AchievePage = "AchievePage",
    GamePage = "GamePage",
    ChanllengePage = "ChallengePage",
    RankingPage = "RankingPage",
}

@ccclass('MainPanel')
export class MainPanel extends UIBase {
    @property([Button])
    m_FuncBtns: Button[] = [];
    @property(Node)
    m_PageOne: Node = null;
    @property(Node)
    m_PageTwo: Node = null;
    @property(Node)
    m_TopPageRoot: Node = null;

    private m_CurPage: Node = null;
    private m_OtherPage: Node = null;
    private m_LastIndex: number = 2;
    private m_IsScrollingPage: boolean = false;
    private m_ScreenWidth: number = 0;
    private m_CurTween: Tween<any> = null;
    private m_OtherTween: Tween<any> = null;

    private m_PageName: string[] = [];

    OnInit(): void {}

    OnOpen(...args: any[]): void {
        this.m_PageName[0] = PageType.ShopPage;
        this.m_PageName[1] = PageType.AchievePage;
        this.m_PageName[2] = PageType.GamePage;
        this.m_PageName[3] = PageType.ChanllengePage;
        this.m_PageName[4] = PageType.RankingPage;

        this.AttachUIPage(this.m_TopPageRoot, 'TopPage', "ui/MainTopPage");
        this.initUI();
    }

    OnClose(): void {
        super.OnClose();
    }

    protected onDestroy(): void {
        if (this.m_CurTween) this.m_CurTween.stop();
        if (this.m_OtherTween) this.m_OtherTween.stop();
    }

    private initUI(): void {
        const screenSize = view.getVisibleSize();
        this.m_ScreenWidth = screenSize.width;
        this.m_PageOne.setPosition(0, 0);

        const pageName = this.m_PageName[2];
        resources.load(FrameworkConst.RES_PATH.UI_PREFIX + pageName, Prefab, (err, prefab) => {
            if (err || !prefab) return;
            const tNode = instantiate(prefab);
            this.addPage(this.m_PageOne, tNode);
        });

        this.m_PageTwo.setPosition(this.m_ScreenWidth, 0);
        this.m_CurPage = this.m_PageOne;
        this.m_OtherPage = this.m_PageTwo;

        this.m_FuncBtns.forEach((button, index) => {
            this.SetBtnEvent(button, () => {
                if (index === this.m_LastIndex || this.m_IsScrollingPage) return;

                this.m_IsScrollingPage = true;
                const size = view.getVisibleSize();
                this.m_ScreenWidth = size.width;

                let moveDis = 0;
                if (this.m_LastIndex < index) {
                    this.m_OtherPage.setPosition(this.m_ScreenWidth, 0);
                    moveDis = -this.m_ScreenWidth;
                } else {
                    this.m_OtherPage.setPosition(-this.m_ScreenWidth, 0);
                    moveDis = this.m_ScreenWidth;
                }

                this.m_LastIndex = index;

                const pName = this.m_PageName[index];
                resources.load(FrameworkConst.RES_PATH.UI_PREFIX + pName, Prefab, (err, prefab) => {
                    if (err || !prefab) return;
                    const tNode = instantiate(prefab);
                    this.addPage(this.m_OtherPage, tNode);

                    this.m_OtherTween = tween(this.m_OtherPage)
                        .by(FrameworkConst.PAGE_SCROLL_DURATION, { position: new Vec3(moveDis, 0, 0) })
                        .start();
                    this.m_CurTween = tween(this.m_CurPage)
                        .by(FrameworkConst.PAGE_SCROLL_DURATION, { position: new Vec3(moveDis, 0, 0) })
                        .call(() => {
                            const temp = this.m_CurPage;
                            this.m_CurPage = this.m_OtherPage;
                            this.m_OtherPage = temp;
                            this.m_IsScrollingPage = false;
                        })
                        .start();
                });
            });
        });
    }

    private addPage(root: Node, uiNode: Node): void {
        if (!root || !uiNode) return;

        root.children.forEach(node => {
            if (node) {
                const pageScript = node.getComponent(UIBase);
                if (pageScript) pageScript.OnClose();
                node.removeFromParent();
                node.destroy();
            }
        });

        const pScript = uiNode.getComponent(UIBase);
        if (pScript) pScript.OnOpen();
        root.addChild(uiNode);
    }
}
