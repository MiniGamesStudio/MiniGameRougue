import { _decorator, assetManager, Button, Color, ImageAsset, instantiate, Label, Layout, Node, RichText, Sprite, SpriteFrame, Texture2D, UITransform, Widget } from 'cc';
import { PlatformManager, PlatformRankUserData, PlatformResult } from '../../../engine/PlatformManager';
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
    private m_MyRankItem: Node = null;
    private m_RankItemTemplate: Node = null;
    private m_RankContent: Node = null;
    private m_DynamicRankItems: Node[] = [];

    OnOpen(): void {
        this.bindPrefabUI();
        this.showFriendRank();
    }

    OnClose(): void {
        this.stopRefreshRankCanvas();
        this.clearDynamicRankItems();
        PlatformManager.getInstance().postOpenDataMessage({ type: 'hideFriendRank' });
        super.OnClose();
    }

    private bindPrefabUI(): void {
        const transform = this.node.getComponent(UITransform) || this.node.addComponent(UITransform);
        transform.setContentSize(750, 1334);

        const closeNode = this.findChildByName(this.node, 'CloseBtn');
        const closeButton = closeNode?.getComponent(Button) || closeNode?.addComponent(Button);
        if (closeButton) {
            this.SetBtnEvent(closeButton, () => this.closeRankPanel());
        }

        const titleLabel = this.findChildByName(this.node, 'TitleTxt')?.getComponent(Label);
        if (titleLabel) {
            titleLabel.string = '好友排行榜';
        }

        const statusNode = this.findChildByName(this.node, 'StatusTxt');
        this.m_StatusLabel = statusNode?.getComponent(Label) || this.createLabelNode('StatusTxt', '正在打开排行榜...', 24, 0, 430);
        if (this.m_StatusLabel) {
            this.m_StatusLabel.color = Color.WHITE;
        }

        this.bindRankView();
        this.bindRankItems();
    }

    private async showFriendRank(): Promise<void> {
        this.setStatus('正在加载排行榜...');
        const rankResult = await PlatformManager.getInstance().getFriendRankList(RANK_KEY);
        if (rankResult.result === PlatformResult.Success && rankResult.data) {
            this.renderRankList(rankResult.data, rankResult.self);
            this.setStatus('排行榜已加载');
            return;
        }

        this.renderRankList(this.getMockRankList());
        this.setStatus('模拟排行榜数据');
    }

    private bindRankView(): void {
        const scrollViewNode = this.findChildByName(this.node, 'ScrollView');
        if (scrollViewNode) {
            scrollViewNode.active = false;
        }

        const node = this.findChildByName(this.node, 'RankCanvasView') || this.createRankViewNode(scrollViewNode);
        const scrollTransform = scrollViewNode?.getComponent(UITransform);

        const transform = node.getComponent(UITransform) || node.addComponent(UITransform);
        transform.setContentSize(scrollTransform?.contentSize.width || RANK_VIEW_WIDTH, scrollTransform?.contentSize.height || RANK_VIEW_HEIGHT);

        this.m_RankSprite = node.getComponent(Sprite) || node.addComponent(Sprite);
        this.m_RankSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    private bindRankItems(): void {
        this.m_MyRankItem = this.findDirectChildByName(this.node, 'MyRankItem');
        this.m_RankItemTemplate = this.findChildByName(this.node, 'RankItem');
        this.m_RankContent = this.findChildByName(this.node, 'content') || this.m_RankItemTemplate?.parent || null;
        this.setupRankContentLayout();
        if (this.m_MyRankItem) {
            this.m_MyRankItem.active = false;
        }
        if (this.m_RankItemTemplate) {
            this.m_RankItemTemplate.active = false;
        }
    }

    private renderRankList(rankList: PlatformRankUserData[], self?: PlatformRankUserData): void {
        this.stopRefreshRankCanvas();
        const canvasView = this.findChildByName(this.node, 'RankCanvasView');
        if (canvasView) canvasView.active = false;

        const scrollViewNode = this.findChildByName(this.node, 'ScrollView');
        if (scrollViewNode) scrollViewNode.active = true;

        this.clearDynamicRankItems();

        if (!this.m_RankItemTemplate || !this.m_RankContent) {
            this.setStatus('排行榜预制体缺少 RankItem 或 content');
            return;
        }
        this.m_RankItemTemplate.active = false;

        if (rankList.length <= 0) {
            if (this.m_MyRankItem) this.m_MyRankItem.active = false;
            this.setStatus('暂无排行榜数据');
            return;
        }

        rankList.forEach((data, index) => {
            const item = instantiate(this.m_RankItemTemplate);
            item.name = `RankItem_${index + 1}`;
            item.active = true;
            this.removeRootWidget(item);
            item.parent = this.m_RankContent;
            this.renderRankItem(item, data, index + 1);
            this.m_DynamicRankItems.push(item);
        });

        this.refreshRankContentLayout();

        const selfData = self || rankList.find(item => item.isSelf);
        const selfRank = selfData ? Math.max(1, rankList.findIndex(item => item === selfData || item.isSelf) + 1) : 0;
        if (this.m_MyRankItem) {
            this.m_MyRankItem.active = !!selfData;
            if (selfData) this.renderRankItem(this.m_MyRankItem, selfData, selfRank || rankList.length);
        }
    }

    private getMockRankList(): PlatformRankUserData[] {
        return [
            { nickname: '玩家A', score: 32 },
            { nickname: '玩家B', score: 29 },
            { nickname: '玩家C', score: 27 },
            { nickname: '玩家D', score: 24 },
            { nickname: '玩家E', score: 22 },
            { nickname: '玩家F', score: 19 },
            { nickname: '玩家G', score: 17 },
            { nickname: '玩家H', score: 15 },
            { nickname: '玩家I', score: 12 },
            { nickname: '玩家J', score: 9 },
        ];
    }

    private renderRankItem(item: Node, data: PlatformRankUserData, rank: number): void {
        this.setRankDisplay(item, rank);
        this.setText(item, 'PointTxt', String(data.score));
        this.setLabelText(item, 'NameTxt', data.nickname);
        this.loadAvatar(item, data.avatarUrl);
    }

    private setRankDisplay(item: Node, rank: number): void {
        const rankRoot = this.findChildByName(item, 'RankRoot');
        if (!rankRoot) return;

        const rank1 = this.findChildByName(rankRoot, 'Rank1');
        const rank2 = this.findChildByName(rankRoot, 'Rank2');
        const rank3 = this.findChildByName(rankRoot, 'Rank3');
        const rankNumTxt = this.findChildByName(rankRoot, 'RankNumTxt');

        if (rank1) rank1.active = rank === 1;
        if (rank2) rank2.active = rank === 2;
        if (rank3) rank3.active = rank === 3;
        if (rankNumTxt) {
            rankNumTxt.active = rank > 3;
            this.setText(rankRoot, 'RankNumTxt', String(rank));
        }
    }

    private setLabelText(item: Node, labelNodeName: string, text: string): void {
        const label = this.findChildByName(item, labelNodeName)?.getComponent(Label);
        if (label) label.string = text;
    }

    private setText(item: Node, nodeName: string, text: string): void {
        const node = this.findChildByName(item, nodeName);
        const richText = node?.getComponent(RichText);
        if (richText) {
            richText.string = text;
            return;
        }

        const label = node?.getComponent(Label);
        if (label) label.string = text;
    }

    private loadAvatar(item: Node, avatarUrl?: string): void {
        const iconSprite = this.findChildByName(item, 'Icon')?.getComponent(Sprite);
        if (!iconSprite || !avatarUrl) return;

        assetManager.loadRemote<ImageAsset>(avatarUrl, (err, imageAsset) => {
            if (err || !imageAsset || !iconSprite.isValid) return;

            const texture = new Texture2D();
            (texture as any).image = imageAsset;
            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            iconSprite.spriteFrame = spriteFrame;
        });
    }

    private clearDynamicRankItems(): void {
        this.m_DynamicRankItems.forEach(item => {
            if (item && item.isValid) item.destroy();
        });
        this.m_DynamicRankItems = [];
    }

    private setupRankContentLayout(): void {
        if (!this.m_RankContent) return;

        const layout = this.m_RankContent.getComponent(Layout) || this.m_RankContent.addComponent(Layout);
        const layoutData = layout as any;
        const layoutTypeEnum = (Layout as any).Type;
        const resizeModeEnum = (Layout as any).ResizeMode;
        const verticalDirectionEnum = (Layout as any).VerticalDirection;

        layoutData.type = layoutTypeEnum?.VERTICAL ?? 2;
        layoutData.resizeMode = resizeModeEnum?.CONTAINER ?? 2;
        layoutData.verticalDirection = verticalDirectionEnum?.TOP_TO_BOTTOM ?? 1;
        layoutData.spacingY = layoutData.spacingY || 20;
    }

    private removeRootWidget(item: Node): void {
        const widget = item.getComponent(Widget);
        if (widget) {
            widget.destroy();
        }
    }

    private refreshRankContentLayout(): void {
        const layout = this.m_RankContent?.getComponent(Layout);
        if (!layout) return;

        this.refreshLayoutResizeMode(layout);
        layout.updateLayout();
        this.scheduleOnce(() => {
            if (this.m_RankContent?.isValid) {
                const nextLayout = this.m_RankContent.getComponent(Layout);
                if (nextLayout) {
                    this.refreshLayoutResizeMode(nextLayout);
                    nextLayout.updateLayout();
                }
            }
        }, 0);
    }

    private refreshLayoutResizeMode(layout: Layout): void {
        const layoutData = layout as any;
        const resizeMode = layoutData.resizeMode;
        const resizeModeEnum = (Layout as any).ResizeMode;
        const noneMode = resizeModeEnum?.NONE ?? 0;

        layoutData.resizeMode = noneMode;
        layoutData.resizeMode = resizeMode;
    }

    private createRankViewNode(referenceNode?: Node): Node {
        const node = new Node('RankCanvasView');
        node.layer = this.node.layer;
        this.node.addChild(node);
        if (referenceNode) {
            node.setPosition(referenceNode.position);
        } else {
            node.setPosition(0, -40, 0);
        }
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

    private findDirectChildByName(root: Node, name: string): Node | null {
        return root?.children.find(child => child.name === name) || null;
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
