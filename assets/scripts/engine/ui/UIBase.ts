import { _decorator, Button, Color, Component, instantiate, Label, Node, Prefab, resources, Sprite, SpriteFrame, UITransform } from 'cc';
import { UIManager } from './UIManager';
const { ccclass } = _decorator;

export type UIButtonClickHandler = () => void;

export interface UIButtonTableItem {
    buttonName: string;
    buttonText?: string;
    buttonIcon: SpriteFrame | string | null;
    uiID?: number;
    uiArgs?: unknown | unknown[];
    onClick?: UIButtonClickHandler;
}

/**
 * UI 基类 — 所有面板的父类，提供生命周期钩子和子页面管理
 * 引擎层：依赖 Cocos Creator Component 系统
 */
@ccclass('UIBase')
export abstract class UIBase extends Component {
    /** 面板运行时唯一 ID */
    public m_PanelID: number = 0;
    /** 面板注册 ID（对应 UIDataRegistry 中的 id） */
    public m_UIID: number = 0;

    protected m_SubPageMap: Map<string, Node> = new Map();
    protected m_PendingSubPageSet: Set<string> = new Set();
    private m_IsWaitingOpenReady: boolean = false;
    private m_OpenReadyCallback: (() => void) | null = null;

    /** 初始化（仅首次创建时调用） */
    OnInit(): void {}

    /** 打开面板（每次显示时调用） */
    OnOpen(...args: any[]): void {}

    /** 设置打开完成回调，由 UIManager 在需要无缝切换时调用 */
    SetOpenReadyCallback(callback: (() => void) | null): void {
        this.m_IsWaitingOpenReady = false;
        this.m_OpenReadyCallback = callback;
    }

    /** 子类调用后，UIManager 会等待子类主动 NotifyOpenReady */
    protected WaitOpenReady(): void {
        this.m_IsWaitingOpenReady = true;
    }

    /** 子类在异步资源或子页面准备完成后调用 */
    protected NotifyOpenReady(): void {
        const callback = this.m_OpenReadyCallback;
        this.m_OpenReadyCallback = null;
        this.m_IsWaitingOpenReady = false;
        callback?.();
    }

    /** 如果子类没有声明需要等待，则默认认为 OnOpen 后就绪 */
    NotifyOpenReadyIfNotWaiting(): void {
        if (!this.m_IsWaitingOpenReady) {
            this.NotifyOpenReady();
        }
    }

    /** 关闭面板 */
    OnClose(): void {
        this.SetOpenReadyCallback(null);
        this.m_PendingSubPageSet.clear();
        Array.from(this.m_SubPageMap.entries()).forEach(([key, value]) => {
            if (value) {
                this.DetachUIPage(key, value);
            }
        });
    }

    /** 关闭自身 */
    CloseSelf(): void {
        if (this.m_UIID) {
            UIManager.GetInstance().ClosePanel(this.m_UIID);
        }
    }

    /** 安全绑定按钮事件（自动移除旧监听，防止重复绑定） */
    SetBtnEvent(btn: Button, callback: () => void, eventName: string = "click"): void {
        if (btn && btn.node) {
            btn.node.off(eventName);
            btn.node.on(eventName, callback, this);
        }
    }

    /** 创建一个通用按钮，可自定义点击响应 */
    CreateUIButton(parent: Node, buttonName: string, buttonText: string = "", buttonIcon: SpriteFrame | string | null, onClick?: UIButtonClickHandler): Button | null {
        if (!parent || !parent.isValid) return null;

        const buttonNode = new Node(buttonName || 'UIButton');
        buttonNode.layer = parent.layer;
        parent.addChild(buttonNode);

        const transform = buttonNode.addComponent(UITransform);
        //transform.setContentSize(145, 100);

        const buttonSprite = buttonNode.addComponent(Sprite);
        buttonSprite.sizeMode = Sprite.SizeMode.TRIMMED;

        const button = buttonNode.addComponent(Button);
        if (onClick) this.SetBtnEvent(button, onClick);

        let labelNode: Node = null;
        let labelTransform: UITransform = null;
        if (buttonText) {
            labelNode = new Node('Name');
            labelNode.layer = buttonNode.layer;
            buttonNode.addChild(labelNode);
            labelNode.setPosition(0, 0, 0);

            labelTransform = labelNode.addComponent(UITransform);
            labelTransform.setContentSize(145, 32);

            const label = labelNode.addComponent(Label);
            label.string = buttonText;
            label.fontSize = 24;
            label.lineHeight = 28;
            label.color = Color.WHITE;
        }

        this.setButtonIcon(buttonSprite, transform, labelTransform, labelNode, buttonIcon);

        return button;
    }

    /** 创建一个点击后打开指定 UI 的按钮 */
    CreateOpenUIButton(parent: Node, buttonName: string, buttonText: string = "", buttonIcon: SpriteFrame | string | null, uiID: number, uiArgs?: unknown | unknown[]): Button | null {
        const panelArgs = uiArgs === undefined || uiArgs === null
            ? []
            : Array.isArray(uiArgs) ? uiArgs : [uiArgs];

        return this.CreateUIButton(parent, buttonName || `OpenUI_${uiID}`, buttonText, buttonIcon, () => {
            UIManager.GetInstance().OpenPanel(uiID, ...panelArgs);
        });
    }

    /** 通过表配置批量创建按钮，支持自定义点击或打开 UI
     * 示例：
    this.CreateUIButtonsByTable(rootNode, [
        {
            buttonName: "Shop",
            buttonText: "商店",
            buttonIcon: "buttons/Icon_Star",
            uiID: ShopUIID,
            uiArgs: { tab: 1 },
        },
        {
            buttonName: "Custom",
            buttonText: "自定义",
            buttonIcon: "buttons/Icon_Stopwatch",
            onClick: () => {
                console.log("点击自定义按钮");
            },
        },
    ]);
    */
    CreateUIButtonsByTable(parent: Node, buttonTable: UIButtonTableItem[]): Button[] {
        if (!parent || !parent.isValid || !buttonTable) return [];

        const buttons: Button[] = [];
        buttonTable.forEach(config => {
            if (!config) return;

            const button = this.CreateUIButton(
                parent,
                config.buttonName,
                config.buttonText,
                config.buttonIcon,
                this.getButtonClickHandler(config),
            );

            if (!button) return;

            buttons.push(button);
        });

        return buttons;
    }

    private getButtonClickHandler(config: UIButtonTableItem): UIButtonClickHandler | undefined {
        if (config.onClick) return config.onClick;
        if (config.uiID === undefined || config.uiID === null) return undefined;

        const panelArgs = config.uiArgs === undefined || config.uiArgs === null
            ? []
            : Array.isArray(config.uiArgs) ? config.uiArgs : [config.uiArgs];

        return () => {
            UIManager.GetInstance().OpenPanel(config.uiID, ...panelArgs);
        };
    }

    private setButtonIcon(buttonSprite: Sprite, buttonTransform: UITransform, labelTransform: UITransform | null, labelNode: Node | null, buttonIcon: SpriteFrame | string | null): void {
        if (!buttonIcon) return;

        if (buttonIcon instanceof SpriteFrame) {
            this.applyButtonIcon(buttonSprite, buttonTransform, labelTransform, labelNode, buttonIcon);
            return;
        }

        resources.load(buttonIcon, SpriteFrame, (err, spriteFrame) => {
            if (!err && spriteFrame && buttonSprite.isValid) {
                this.applyButtonIcon(buttonSprite, buttonTransform, labelTransform, labelNode, spriteFrame);
                return;
            }

            const spriteFramePath = `${buttonIcon}/spriteFrame`;
            resources.load(spriteFramePath, SpriteFrame, (retryErr, retrySpriteFrame) => {
                if (!retryErr && retrySpriteFrame && buttonSprite.isValid) {
                    this.applyButtonIcon(buttonSprite, buttonTransform, labelTransform, labelNode, retrySpriteFrame);
                }
            });
        });
    }

    private applyButtonIcon(buttonSprite: Sprite, buttonTransform: UITransform, labelTransform: UITransform | null, labelNode: Node | null, spriteFrame: SpriteFrame): void {
        buttonSprite.spriteFrame = spriteFrame;
        buttonSprite.sizeMode = Sprite.SizeMode.TRIMMED;

        const iconSize = spriteFrame.rect;
        if (iconSize.width <= 0 || iconSize.height <= 0) return;

        buttonTransform.setContentSize(iconSize.width, iconSize.height);
        if (labelTransform && labelNode) {
            labelTransform.setContentSize(iconSize.width, 32);
            labelNode.setPosition(0, -iconSize.height * 0.5 + 20, 0);
        }
    }

    /** 加载子页面（pageName 唯一标识） */
    AttachUIPage(root: Node, pageName: string, prefabPath: string, ...args: any[]): void {
        if (!root) return;

        const subPageNode = this.m_SubPageMap.get(pageName);
        if (subPageNode && subPageNode.isValid) {
            subPageNode.active = true;
            const uiScript = subPageNode.getComponent(UIBase);
            if (uiScript) {
                uiScript.OnOpen(...args);
            }
            return;
        }
        if (subPageNode && !subPageNode.isValid) {
            this.m_SubPageMap.delete(pageName);
        }
        if (this.m_PendingSubPageSet.has(pageName)) return;

        this.m_PendingSubPageSet.add(pageName);
        resources.load(prefabPath, Prefab, (err, prefab) => {
            if (err || !this.isValid || !root || !root.isValid || !this.m_PendingSubPageSet.has(pageName)) {
                this.m_PendingSubPageSet.delete(pageName);
                return;
            }
            this.m_PendingSubPageSet.delete(pageName);

            const pageNode = instantiate(prefab);
            pageNode.parent = root;
            pageNode.setPosition(0, 0);
            pageNode.active = true;

            const uiScript = pageNode.getComponent(UIBase);
            if (uiScript) {
                uiScript.OnInit();
                uiScript.OnOpen(...args);
            }

            this.m_SubPageMap.set(pageName, pageNode);
        });
    }

    /** 卸载子页面 */
    DetachUIPage(subPageName: string, subPageNode: Node): void {
        this.m_PendingSubPageSet.delete(subPageName);
        if (!subPageNode || !subPageNode.isValid) {
            this.m_SubPageMap.delete(subPageName);
            return;
        }

        const uiScript = subPageNode.getComponent(UIBase);
        if (uiScript) {
            uiScript.OnClose();
        }
        subPageNode.removeFromParent();
        subPageNode.destroy();
        this.m_SubPageMap.delete(subPageName);
    }
}
