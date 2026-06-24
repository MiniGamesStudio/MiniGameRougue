import { _decorator, Button, Color, Label, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { PlatformManager, PlatformResult } from '../../../engine/PlatformManager';
import { UIBase } from '../../../engine/ui/UIBase';

const { ccclass } = _decorator;

const RANK_KEY = 'level';
const RANK_VIEW_WIDTH = 500;
const RANK_VIEW_HEIGHT = 760;

@ccclass('RankPanel')
export class RankPanel extends UIBase {
    private m_StatusLabel: Label = null;
    private m_RankSprite: Sprite = null;
    private m_RankTexture: Texture2D = null;
    private m_RefreshTimer: ReturnType<typeof setInterval> = null;
    private m_ShowBackgroundTimer: ReturnType<typeof setTimeout> = null;
    private m_BackgroundNode: Node = null;

    OnOpen(): void {
        this.bindPrefabUI();
        this.showFriendRank();
    }

    OnClose(): void {
        this.stopRefreshRankCanvas();
        this.clearShowBackgroundTimer();
        PlatformManager.getInstance().postOpenDataMessage({ type: 'hideFriendRank' });
        super.OnClose();
    }

    private bindPrefabUI(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        transform.setContentSize(750, 1334);

        const background = this.getBackgroundNode();
        this.m_BackgroundNode = background;
        this.setBackgroundVisible(false);
        const closeNode = this.findChildByName(background, 'CloseBtn');
        const closeButton = closeNode?.getComponent(Button) || closeNode?.addComponent(Button);
        if (closeButton) {
            this.SetBtnEvent(closeButton, () => this.closeRankPanel());
        }

        this.bindRankView(background);
        this.hideUnusedPrefabRankNodes(background);
    }

    private showFriendRank(): void {
        if (this.showOpenDataRank()) {
            return;
        }

        this.setBackgroundVisible(true);
    }

    private showOpenDataRank(): boolean {
        const rankManager = PlatformManager.getInstance();
        const canvas = rankManager.getOpenDataCanvas();
        if (!canvas) {
            return false;
        }

        this.setOpenDataCanvasSize(canvas);
        const postResult = rankManager.postOpenDataMessage({
            type: 'showFriendRank',
            key: RANK_KEY,
            width: RANK_VIEW_WIDTH,
            height: RANK_VIEW_HEIGHT,
        });
        if (postResult.result !== PlatformResult.Success) {
            return false;
        }

        this.m_RankSprite.node.active = true;

        this.startRefreshRankCanvas(canvas);
        return true;
    }

    private bindRankView(background: Node): void {
        const node = this.findChildByName(background, 'RankCanvasView') || this.createRankViewNode(background);

        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(RANK_VIEW_WIDTH, RANK_VIEW_HEIGHT);

        this.m_RankSprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        this.m_RankSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        node.active = false;
    }

    private hideUnusedPrefabRankNodes(background: Node): void {
        const scrollViewNode = this.findChildByName(background, 'ScrollView');
        if (scrollViewNode) scrollViewNode.active = false;

        const myRankItem = this.findChildByName(background, 'MyRankItem');
        if (myRankItem) myRankItem.active = false;
    }

    private createRankViewNode(parent: Node): Node {
        const node = new Node('RankCanvasView');
        node.layer = parent.layer;
        parent.addChild(node);
        node.setPosition(0, -40, 0);
        return node;
    }

    private startRefreshRankCanvas(canvas: unknown): void {
        this.stopRefreshRankCanvas();

        if (!canvas || !this.m_RankSprite) return;

        this.m_RankTexture = new Texture2D();
        (this.m_RankTexture as any).reset({
            width: RANK_VIEW_WIDTH,
            height: RANK_VIEW_HEIGHT,
        });

        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = this.m_RankTexture;
        this.m_RankSprite.spriteFrame = spriteFrame;

        this.refreshRankCanvas(canvas);
        this.m_RefreshTimer = setInterval(() => this.refreshRankCanvas(canvas), 500);
        this.scheduleShowBackground(canvas);
    }

    private stopRefreshRankCanvas(): void {
        if (this.m_RefreshTimer) {
            clearInterval(this.m_RefreshTimer);
            this.m_RefreshTimer = null;
        }
        this.m_RankTexture = null;
    }

    private scheduleShowBackground(canvas: unknown): void {
        this.clearShowBackgroundTimer();
        this.m_ShowBackgroundTimer = setTimeout(() => {
            this.refreshRankCanvas(canvas);
            this.setBackgroundVisible(true);
            this.m_ShowBackgroundTimer = null;
        }, 800);
    }

    private clearShowBackgroundTimer(): void {
        if (this.m_ShowBackgroundTimer) {
            clearTimeout(this.m_ShowBackgroundTimer);
            this.m_ShowBackgroundTimer = null;
        }
    }

    private refreshRankCanvas(canvas: unknown): void {
        if (!this.m_RankTexture || !this.m_RankSprite || !this.m_RankSprite.isValid) return;

        const texture = this.m_RankTexture as any;
        if (texture.uploadData) {
            texture.uploadData(canvas);
        }
    }

    private setOpenDataCanvasSize(canvas: unknown): void {
        const openDataCanvas = canvas as { width?: number; height?: number };
        openDataCanvas.width = RANK_VIEW_WIDTH;
        openDataCanvas.height = RANK_VIEW_HEIGHT;
    }

    private setBackgroundVisible(visible: boolean): void {
        if (this.m_BackgroundNode && this.m_BackgroundNode.isValid) {
            this.m_BackgroundNode.active = visible;
        }
    }

    private createLabelNode(name: string, text: string, fontSize: number, x: number, y: number): Label {
        const node = new Node(name);
        node.layer = this.node.layer;
        this.node.addChild(node);
        node.setPosition(x, y, 0);

        const transform = node.addComponent(UITransform);
        transform.setContentSize(680, 60);

        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private closeRankPanel(): void {
        if (this.m_UIID) {
            this.CloseSelf();
            return;
        }

        this.OnClose();
        this.node.removeFromParent();
        this.node.destroy();
    }

    private getBackgroundNode(): Node {
        return this.findChildByName(this.node, 'Background') || this.node;
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
