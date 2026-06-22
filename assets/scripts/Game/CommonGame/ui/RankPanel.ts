import { _decorator, assetManager, Button, Color, ImageAsset, instantiate, Label, Layout, Node, RichText, ScrollView, Sprite, SpriteFrame, Texture2D, UITransform, Vec3, Widget } from 'cc';
import { PlatformManager, PlatformRankUserData, PlatformResult } from '../../../engine/PlatformManager';
import { UIBase } from '../../../engine/ui/UIBase';

const { ccclass } = _decorator;

const RANK_KEY = 'level';
const RANK_VIEW_WIDTH = 620;
const RANK_VIEW_HEIGHT = 760;
const MAX_RANK_COUNT = 20;
const EXTRA_VISIBLE_ITEM_COUNT = 2;

@ccclass('RankPanel')
export class RankPanel extends UIBase {
    private m_StatusLabel: Label = null;
    private m_RankSprite: Sprite = null;
    private m_RankTexture: Texture2D = null;
    private m_RefreshTimer: ReturnType<typeof setInterval> = null;
    private m_MyRankItem: Node = null;
    private m_RankItemTemplate: Node = null;
    private m_RankContent: Node = null;
    private m_ScrollView: ScrollView = null;
    private m_DynamicRankItems: Node[] = [];
    private m_RankDataList: PlatformRankUserData[] = [];
    private m_ItemHeight: number = 120;
    private m_ItemSpacing: number = 20;
    private m_VisibleItemCount: number = 0;

    OnOpen(): void {
        this.bindPrefabUI();
        this.showFriendRank();
    }

    OnClose(): void {
        this.stopRefreshRankCanvas();
        this.unbindScrollEvents();
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
            this.m_ScrollView = scrollViewNode.getComponent(ScrollView);
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
        this.updateRankItemMetrics();
        this.bindScrollEvents();
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
        this.m_RankDataList = rankList.slice(0, MAX_RANK_COUNT);

        if (this.m_RankDataList.length <= 0) {
            if (this.m_MyRankItem) this.m_MyRankItem.active = false;
            this.setStatus('暂无排行榜数据');
            return;
        }

        this.updateVirtualContentSize();
        this.createVirtualRankItems();
        this.updateVirtualRankItems();
        this.refreshRankContentLayout();

        const selfData = self || this.m_RankDataList.find(item => item.isSelf);
        const selfRank = selfData ? Math.max(1, this.m_RankDataList.findIndex(item => item === selfData || item.isSelf) + 1) : 0;
        if (this.m_MyRankItem) {
            this.m_MyRankItem.active = !!selfData;
            if (selfData) this.renderRankItem(this.m_MyRankItem, selfData, selfRank || this.m_RankDataList.length);
        }
    }

    private createVirtualRankItems(): void {
        if (!this.m_RankItemTemplate || !this.m_RankContent) return;

        const viewHeight = this.getScrollViewHeight();
        this.m_VisibleItemCount = Math.min(
            this.m_RankDataList.length,
            Math.ceil(viewHeight / this.getRankItemStep()) + EXTRA_VISIBLE_ITEM_COUNT,
        );

        for (let index = 0; index < this.m_VisibleItemCount; index++) {
            const item = instantiate(this.m_RankItemTemplate);
            item.name = `RankItem_${index + 1}`;
            item.active = true;
            this.removeRootWidget(item);
            item.parent = this.m_RankContent;
            this.m_DynamicRankItems.push(item);
        }
    }

    private updateVirtualRankItems(): void {
        if (!this.m_RankContent || this.m_RankDataList.length <= 0) return;

        const startIndex = this.getVirtualStartIndex();
        const itemStep = this.getRankItemStep();
        const itemX = this.getRankItemX();

        this.m_DynamicRankItems.forEach((item, poolIndex) => {
            const dataIndex = startIndex + poolIndex;
            const data = this.m_RankDataList[dataIndex];
            item.active = !!data;
            if (!data) return;

            //item.setPosition(new Vec3(itemX, -dataIndex * itemStep - this.m_ItemHeight * 0.5, 0));
            this.renderRankItem(item, data, dataIndex + 1);
        });
    }

    private getVirtualStartIndex(): number {
        if (!this.m_RankContent || this.m_RankDataList.length <= 0) return 0;

        const contentY = Math.max(0, this.m_RankContent.position.y);
        const maxStartIndex = Math.max(0, this.m_RankDataList.length - this.m_VisibleItemCount);
        return Math.min(maxStartIndex, Math.floor(contentY / this.getRankItemStep()));
    }

    private updateVirtualContentSize(): void {
        const contentTransform = this.m_RankContent?.getComponent(UITransform);
        if (!contentTransform) return;

        const totalHeight = Math.max(this.getScrollViewHeight(), this.m_RankDataList.length * this.getRankItemStep());
        contentTransform.setContentSize(contentTransform.contentSize.width, totalHeight);
        //this.m_RankContent.setPosition(this.m_RankContent.position.x, 0, this.m_RankContent.position.z);
        this.m_ScrollView?.scrollToTop(0);
    }

    private updateRankItemMetrics(): void {
        const templateTransform = this.m_RankItemTemplate?.getComponent(UITransform);
        if (templateTransform && templateTransform.contentSize.height > 0) {
            this.m_ItemHeight = templateTransform.contentSize.height;
        }

        const layout = this.m_RankContent?.getComponent(Layout) as any;
        const spacingY = Number(layout?.spacingY);
        this.m_ItemSpacing = Number.isFinite(spacingY) ? Math.max(0, spacingY) : this.m_ItemSpacing;
    }

    private getRankItemStep(): number {
        return this.m_ItemHeight + this.m_ItemSpacing;
    }

    private getRankItemX(): number {
        const contentTransform = this.m_RankContent?.getComponent(UITransform);
        const templateTransform = this.m_RankItemTemplate?.getComponent(UITransform);
        const contentWidth = contentTransform?.contentSize.width || 0;
        const templateWidth = templateTransform?.contentSize.width || 0;
        return -contentWidth * 0.5 + templateWidth * 0.5;
    }

    private getScrollViewHeight(): number {
        const viewNode = this.findChildByName(this.node, 'view') || this.m_ScrollView?.node;
        return viewNode?.getComponent(UITransform)?.contentSize.height || RANK_VIEW_HEIGHT;
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
        this.m_RankDataList = [];
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

    private bindScrollEvents(): void {
        if (!this.m_ScrollView?.node) return;

        this.m_ScrollView.node.off(ScrollView.EventType.SCROLLING, this.updateVirtualRankItems, this);
        this.m_ScrollView.node.on(ScrollView.EventType.SCROLLING, this.updateVirtualRankItems, this);
    }

    private unbindScrollEvents(): void {
        if (!this.m_ScrollView?.node) return;

        this.m_ScrollView.node.off(ScrollView.EventType.SCROLLING, this.updateVirtualRankItems, this);
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
