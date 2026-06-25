import { _decorator, instantiate, Node, Prefab } from 'cc';
import { ResManager } from '../ResManager';
import { UIDataRegistry, UIShowMode, UILayer } from './UIData';
import { UIBase } from './UIBase';

const { ccclass } = _decorator;

type UIOpenedCallback = (panelID: number, panelNode: Node) => void;

/**
 * UI 管理器 — 管理面板的打开、关闭、缓存和分层
 * 引擎层：依赖 Cocos Creator 节点和资源系统
 */
@ccclass('UIManager')
export class UIManager {
    private static m_Instance: UIManager = null;

    static GetInstance(): UIManager {
        if (this.m_Instance == null) {
            this.m_Instance = new UIManager();
        }
        return this.m_Instance;
    }

    private m_PanelID = 1;
    private m_UIRoot: Node = null;

    /** uiID -> 面板唯一ID数组 */
    private m_PanelDataMap: Map<number, number[]> = new Map();
    /** 面板唯一ID -> UI节点 */
    private m_PanelNodeMap: Map<number, Node> = new Map();
    /** 面板唯一ID -> uiID，用于取消异步加载中的面板 */
    private m_PanelUIIDMap: Map<number, number> = new Map();
    /** 各层级根节点 */
    private m_LayerRoots: Map<UILayer, Node> = new Map();

    Init(uiRoot: Node): void {
        this.m_UIRoot = uiRoot;
        this.m_PanelDataMap.clear();
        this.m_PanelNodeMap.clear();
        this.m_PanelUIIDMap.clear();
        this.m_LayerRoots.clear();

        const layers: [UILayer, string][] = [
            [UILayer.Background, "UI_Background"],
            [UILayer.Normal, "UI_Normal"],
            [UILayer.PopUp, "UI_Popup"],
            [UILayer.Tips, "UI_Tips"],
            [UILayer.System, "UI_System"],
            [UILayer.TopMost, "UI_Top"],
        ];

        layers.forEach(([layer, name]) => {
            const node = new Node(name);
            node.parent = this.m_UIRoot;
            this.m_LayerRoots.set(layer, node);
        });
    }

    GetUIRootByUILayer(layer: UILayer): Node | null {
        return this.m_LayerRoots.get(layer) ?? null;
    }

    Destroy(): void {
        const panelIDs = Array.from(this.m_PanelNodeMap.keys());
        panelIDs.forEach(panelID => this.ClosePanelByID(panelID));

        this.m_LayerRoots.forEach(root => {
            if (root && root.isValid) {
                root.removeFromParent();
                root.destroy();
            }
        });

        this.m_PanelDataMap.clear();
        this.m_PanelNodeMap.clear();
        this.m_PanelUIIDMap.clear();
        this.m_LayerRoots.clear();
        UIDataRegistry.Clear();
        this.m_UIRoot = null;
        this.m_PanelID = 1;
    }

    /** 通过面板唯一ID关闭并销毁界面 */
    ClosePanelByID(panelID: number): boolean {
        const node = this.m_PanelNodeMap.get(panelID);
        if (!node || !node.isValid) return this.RemovePanelRecord(panelID);

        const script = node.getComponent(UIBase);
        if (script) script.OnClose();

        node.removeFromParent();
        node.destroy();
        this.RemovePanelRecord(panelID);
        return true;
    }

    /** 通过面板唯一ID隐藏界面 */
    HidePanelByID(panelID: number): boolean {
        const node = this.m_PanelNodeMap.get(panelID);
        if (!node || !node.isValid) return this.RemovePanelRecord(panelID);

        const script = node.getComponent(UIBase);
        if (script) script.OnClose();

        node.active = false;
        return true;
    }

    /** 通过 uiID 关闭界面组 */
    ClosePanel(id: number): boolean {
        const uidata = UIDataRegistry.FindUIData(id);
        const datas = this.m_PanelDataMap.get(id);
        if (!datas || !uidata) return false;

        const closeCount = datas.length - uidata.cacheCount;
        if (closeCount > 0) {
            const closeIDs = datas.slice(datas.length - closeCount);
            closeIDs.forEach(pID => this.ClosePanelByID(pID));
        }

        const cacheIDs = this.m_PanelDataMap.get(id);
        if (cacheIDs) {
            [...cacheIDs].forEach(pID => this.HidePanelByID(pID));
        }
        return true;
    }

    /** 通过 uiID 打开界面 */
    OpenPanel(id: number, ...args: any[]): number {
        return this.OpenPanelInternal(id, null, args);
    }

    /** 通过 uiID 打开界面，并在节点创建或缓存节点恢复后回调 */
    OpenPanelWithCallback(id: number, onOpened: UIOpenedCallback, ...args: any[]): number {
        return this.OpenPanelInternal(id, onOpened, args);
    }

    private OpenPanelInternal(id: number, onOpened: UIOpenedCallback | null, args: any[]): number {
        const uidata = UIDataRegistry.FindUIData(id);
        if (!uidata) {
            console.warn(`UIManager: 未注册的 UI ID [${id}]`);
            return 0;
        }

        const existingID = this.CheckPanel(id, args, onOpened);
        if (existingID > 0) return existingID;

        const pID = this.m_PanelID;
        this.m_PanelID++;

        let uiDatas = this.m_PanelDataMap.get(id);
        if (!uiDatas) {
            uiDatas = [];
            this.m_PanelDataMap.set(id, uiDatas);
        }
        uiDatas.push(pID);
        this.m_PanelUIIDMap.set(pID, id);

        ResManager.getInstance().loadFromBundle(uidata.bundleName, uidata.prefabPath, Prefab, (err, prefab) => {
            if (err) {
                console.warn(`UIManager: 加载面板失败 [${uidata.name}]`, err);
                this.RemovePanelRecord(pID);
                return;
            }
            if (!prefab) {
                console.warn(`UIManager: 面板资源为空 [${uidata.name}]`);
                this.RemovePanelRecord(pID);
                return;
            }

            const datas = this.m_PanelDataMap.get(id);
            if (!datas || !datas.includes(pID)) {
                return;
            }

            const root = this.GetUIRootByUILayer(uidata.layer);
            if (!root || !root.isValid) {
                this.RemovePanelRecord(pID);
                return;
            }

            const uiNode = instantiate(prefab);
            uiNode.parent = root;
            uiNode.setPosition(0, 0);
            uiNode.active = !onOpened;

            const uiScript = uiNode.getComponent(UIBase);
            if (uiScript) {
                uiScript.m_PanelID = pID;
                uiScript.m_UIID = id;
                if (onOpened) {
                    uiScript.SetOpenReadyCallback(() => {
                        if (uiNode && uiNode.isValid) {
                            uiNode.active = true;
                            onOpened(pID, uiNode);
                        }
                    });
                }
                uiScript.OnInit();
                uiScript.OnOpen(...args);
                if (onOpened) {
                    uiScript.NotifyOpenReadyIfNotWaiting();
                }
            }

            this.m_PanelNodeMap.set(pID, uiNode);
            if (!uiScript && onOpened) {
                uiNode.active = true;
                onOpened(pID, uiNode);
            }
        });

        return pID;
    }

    private RemovePanelRecord(panelID: number): boolean {
        let removed = false;
        const uiID = this.m_PanelUIIDMap.get(panelID);

        if (uiID !== undefined) {
            const datas = this.m_PanelDataMap.get(uiID);
            if (datas) {
                const idx = datas.indexOf(panelID);
                if (idx >= 0) {
                    datas.splice(idx, 1);
                    removed = true;
                }
                if (datas.length === 0) {
                    this.m_PanelDataMap.delete(uiID);
                }
            }
            this.m_PanelUIIDMap.delete(panelID);
            removed = true;
        }

        if (this.m_PanelNodeMap.delete(panelID)) {
            removed = true;
        }

        return removed;
    }

    private CheckPanel(id: number, args: any[], onOpened?: UIOpenedCallback | null): number {
        const uiDatas = this.m_PanelDataMap.get(id);
        if (!uiDatas || uiDatas.length === 0) return 0;

        let rID = 0;
        const invalidIDs: number[] = [];

        for (const panelID of uiDatas) {
            const panelNode = this.m_PanelNodeMap.get(panelID);
            if (!panelNode || !panelNode.isValid) {
                invalidIDs.push(panelID);
                continue;
            }

            if (!panelNode.active) {
                const uiScript = panelNode.getComponent(UIBase);
                if (uiScript && onOpened) {
                    uiScript.SetOpenReadyCallback(() => {
                        if (panelNode && panelNode.isValid) {
                            panelNode.active = true;
                            onOpened(panelID, panelNode);
                        }
                    });
                    uiScript.OnOpen(...args);
                    uiScript.NotifyOpenReadyIfNotWaiting();
                } else {
                    panelNode.active = true;
                    if (uiScript) {
                        uiScript.OnOpen(...args);
                    }
                    onOpened?.(panelID, panelNode);
                }
                rID = panelID;
                break;
            } else {
                const uidata = UIDataRegistry.FindUIData(id);
                if (uidata && uidata.showMode === UIShowMode.Single) {
                    onOpened?.(panelID, panelNode);
                    rID = panelID;
                    break;
                }
            }
        }

        if (invalidIDs.length > 0) {
            const invalidSet = new Set(invalidIDs);
            const filtered = uiDatas.filter(v => !invalidSet.has(v));
            if (filtered.length > 0) {
                this.m_PanelDataMap.set(id, filtered);
            } else {
                this.m_PanelDataMap.delete(id);
            }
            invalidIDs.forEach(panelID => this.m_PanelUIIDMap.delete(panelID));
        }

        return rID;
    }
}
