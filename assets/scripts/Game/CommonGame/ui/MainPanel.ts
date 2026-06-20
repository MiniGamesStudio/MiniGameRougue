import { _decorator, Button, CCString, instantiate, Node, Prefab, resources, Tween, tween, Vec3, view } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { FrameworkConst } from '../../../framework/FrameworkConst';
const { ccclass, property } = _decorator;

@ccclass('MainPanel')
export class MainPanel extends UIBase {
    @property([Button])
    m_FuncBtns: Button[] = [];
    @property([CCString])
    m_PagePrefabPaths: string[] = ["ui/MainPage"];
    @property
    m_DefaultPageIndex: number = 0;
    @property(Node)
    m_PageOne: Node = null;
    @property(Node)
    m_PageTwo: Node = null;
    @property(Node)
    m_BottomRoot: Node = null;

    private m_CurPage: Node = null;
    private m_OtherPage: Node = null;
    private m_LastIndex: number = 0;
    private m_IsScrollingPage: boolean = false;
    private m_ScreenWidth: number = 0;
    private m_CurTween: Tween<Node> = null;
    private m_OtherTween: Tween<Node> = null;

    OnInit(): void {}

    OnOpen(): void {
        this.m_LastIndex = this.clampPageIndex(this.m_DefaultPageIndex);
        this.initUI();
    }

    OnClose(): void {
        super.OnClose();
        this.stopTweens();
        this.clearPage(this.m_PageOne);
        this.clearPage(this.m_PageTwo);
        this.m_IsScrollingPage = false;
    }

    protected onDestroy(): void {
        this.stopTweens();
    }

    private initUI(): void {
        const screenSize = view.getVisibleSize();
        this.m_ScreenWidth = screenSize.width;
        this.m_PageOne?.setPosition(0, 0);
        this.m_PageTwo?.setPosition(this.m_ScreenWidth, 0);
        this.m_CurPage = this.m_PageOne;
        this.m_OtherPage = this.m_PageTwo;
        this.m_IsScrollingPage = false;

        this.clearPage(this.m_PageOne);
        this.clearPage(this.m_PageTwo);

        this.loadInitialPage();
        this.refreshBottomRoot();
        this.bindPageButtons();
    }

    private refreshBottomRoot(): void {
        if (this.m_BottomRoot) {
            this.m_BottomRoot.active = this.m_FuncBtns.length > 0;
        }
    }

    private loadInitialPage(): void {
        this.loadPage(this.m_LastIndex, this.m_PageOne);
    }

    private bindPageButtons(): void {
        this.m_FuncBtns.forEach((button, index) => {
            button.interactable = index < this.m_PagePrefabPaths.length;
            this.SetBtnEvent(button, () => {
                if (!button.interactable || index === this.m_LastIndex || this.m_IsScrollingPage) return;
                this.scrollToPage(index);
            });
        });
    }

    private scrollToPage(index: number): void {
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
        this.loadPage(index, this.m_OtherPage, () => {
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
    }

    private loadPage(index: number, root: Node, onLoaded?: () => void): void {
        this.loadPageByPath(this.m_PagePrefabPaths[index], root, onLoaded);
    }

    private loadPageByPath(prefabPath: string, root: Node, onLoaded?: () => void): void {
        if (!root || !prefabPath) {
            onLoaded?.();
            return;
        }

        resources.load(prefabPath, Prefab, (err, prefab) => {
            if (err || !prefab || !root.isValid) {
                this.m_IsScrollingPage = false;
                return;
            }

            const pageNode = instantiate(prefab);
            this.addPage(root, pageNode);
            onLoaded?.();
        });
    }

    private addPage(root: Node, uiNode: Node): void {
        if (!root || !uiNode) return;

        this.clearPage(root);

        const pageScript = uiNode.getComponent(UIBase);
        if (pageScript) {
            pageScript.OnInit();
            pageScript.OnOpen();
        }
        root.addChild(uiNode);
    }

    private clearPage(root: Node): void {
        if (!root) return;

        root.children.forEach(node => {
            const pageScript = node.getComponent(UIBase);
            if (pageScript) pageScript.OnClose();
            node.removeFromParent();
            node.destroy();
        });
    }

    private clampPageIndex(index: number): number {
        if (this.m_PagePrefabPaths.length === 0) return 0;
        return Math.max(0, Math.min(index, this.m_PagePrefabPaths.length - 1));
    }

    private stopTweens(): void {
        if (this.m_CurTween) this.m_CurTween.stop();
        if (this.m_OtherTween) this.m_OtherTween.stop();
        this.m_CurTween = null;
        this.m_OtherTween = null;
    }
}
