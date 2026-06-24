import { _decorator, Button, Color, Label, Node, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { PlatformManager, PlatformResult } from '../../../engine/PlatformManager';
import { UIBase } from '../../../engine/ui/UIBase';

const { ccclass } = _decorator;

const RANK_KEY = 'level';
const RANK_VIEW_WIDTH = 620;
const RANK_VIEW_HEIGHT = 760;

@ccclass('RankPanel')
export class RankPanel extends UIBase {
    private m_StatusLabel: Label = null;
    private m_RankSprite: Sprite = null;
    private m_RankTexture: Texture2D = null;
    private m_RefreshTimer: ReturnType<typeof setInterval> = null;

    OnOpen(): void {
        this.bindPrefabUI();
        this.showFriendRank();
    }

    OnClose(): void {
        this.stopRefreshRankCanvas();
        PlatformManager.getInstance().postOpenDataMessage({ type: 'hideFriendRank' });
        super.OnClose();
    }

    private bindPrefabUI(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        transform.setContentSize(750, 1334);

        const background = this.getBackgroundNode();
        const closeNode = this.findChildByName(background, 'CloseBtn');
        const closeButton = closeNode?.getComponent(Button) || closeNode?.addComponent(Button);
        if (closeButton) {
            this.SetBtnEvent(closeButton, () => this.closeRankPanel());
        }

        const titleLabel = this.findChildByName(background, 'TitleTxt')?.getComponent(Label);
        if (titleLabel) {
            titleLabel.string = '好友排行榜';
        }

        const statusNode = this.findChildByName(this.node, 'StatusTxt');
        this.m_StatusLabel = statusNode?.getComponent(Label) || this.createLabelNode('StatusTxt', '正在打开排行榜...', 24, 0, 430);
        if (this.m_StatusLabel) {
            this.m_StatusLabel.color = Color.WHITE;
        }

        this.bindRankView(background);
        this.hideUnusedPrefabRankNodes(background);
    }

    private showFriendRank(): void {
        this.setStatus('正在加载排行榜...');
        if (this.showOpenDataRank()) {
            this.setStatus('排行榜已加载');
            return;
        }

        this.setStatus('当前环境不支持开放数据域排行榜');
    }

    private showOpenDataRank(): boolean {
        const rankManager = PlatformManager.getInstance();
        const postResult = rankManager.postOpenDataMessage({
            type: 'showFriendRank',
            key: RANK_KEY,
            width: RANK_VIEW_WIDTH,
            height: RANK_VIEW_HEIGHT,
        });
        const canvas = rankManager.getOpenDataCanvas();
        if (postResult.result !== PlatformResult.Success || !canvas) {
            return false;
        }

        this.m_RankSprite.node.active = true;

        this.startRefreshRankCanvas();
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

    private startRefreshRankCanvas(): void {
        this.stopRefreshRankCanvas();

        const canvas = PlatformManager.getInstance().getOpenDataCanvas();
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
    }

    private stopRefreshRankCanvas(): void {
        if (this.m_RefreshTimer) {
            clearInterval(this.m_RefreshTimer);
            this.m_RefreshTimer = null;
        }
        this.m_RankTexture = null;
    }

    private refreshRankCanvas(canvas: unknown): void {
        if (!this.m_RankTexture || !this.m_RankSprite || !this.m_RankSprite.isValid) return;

        const texture = this.m_RankTexture as any;
        if (texture.uploadData) {
            texture.uploadData(canvas);
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

    private setStatus(status: string): void {
        if (this.m_StatusLabel) {
            this.m_StatusLabel.string = status;
        }
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
