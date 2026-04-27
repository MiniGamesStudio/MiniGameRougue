import { _decorator, instantiate, Node, Prefab, resources } from 'cc';
import { UIDataRegistry, UIShowMode, UILayer } from './UIData';
import { UIBase } from './UIBase';

const { ccclass } = _decorator;

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
    /** 各层级根节点 */
    private m_LayerRoots: Map<UILayer, Node> = new Map();

    Init(uiRoot: Node): void {
        this.m_UIRoot = uiRoot;
        this.m_PanelDataMap.clear();
        this.m_PanelNodeMap.clear();

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

    /** 通过面板唯一ID关闭并销毁界面 */
    ClosePanelByID(panelID: number): boolean {
        const node = this.m_PanelNodeMap.get(panelID);
        if (!node) return false;

        const script = node.getComponent(UIBase);
        if (script) script.OnClose();

        node.removeFromParent();
        node.destroy();
        this.m_PanelNodeMap.delete(panelID);
        return true;
    }

    /** 通过面板唯一ID隐藏界面 */
    HidePanelByID(panelID: number): boolean {
        const node = this.m_PanelNodeMap.get(panelID);
        if (!node) return false;

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
        for (let i = 0; i < closeCount; i++) {
            const pID = datas.pop();
            if (pID !== undefined) {
                this.ClosePanelByID(pID);
            }
        }

        datas.forEach(pID => this.HidePanelByID(pID));
        this.m_PanelDataMap.set(id, datas);
        return true;
    }

    /** 通过 uiID 打开界面 */
    OpenPanel(id: number, ...args: any[]): number {
        const uidata = UIDataRegistry.FindUIData(id);
        if (!uidata) {
            console.warn(`UIManager: 未注册的 UI ID [${id}]`);
            return 0;
        }

        const existingID = this.CheckPanel(id, args);
        if (existingID > 0) return existingID;

        const pID = this.m_PanelID;
        this.m_PanelID++;

        let uiDatas = this.m_PanelDataMap.get(id);
        if (!uiDatas) {
            uiDatas = [];
            this.m_PanelDataMap.set(id, uiDatas);
        }
        uiDatas.push(pID);

        resources.load(uidata.prefabPath, Prefab, (err, prefab) => {
            if (err) {
                console.warn(`UIManager: 加载面板失败 [${uidata.name}]`, err);
                const datas = this.m_PanelDataMap.get(id);
                if (datas) {
                    const idx = datas.indexOf(pID);
                    if (idx >= 0) datas.splice(idx, 1);
                }
                return;
            }

            const datas = this.m_PanelDataMap.get(id);
            if (!datas || !datas.includes(pID)) {
                return;
            }

            const root = this.GetUIRootByUILayer(uidata.layer);
            if (!root) return;

            const uiNode = instantiate(prefab);
            uiNode.parent = root;
            uiNode.setPosition(0, 0);
            uiNode.active = true;

            const uiScript = uiNode.getComponent(UIBase);
            if (uiScript) {
                uiScript.m_PanelID = pID;
                uiScript.m_UIID = id;
                uiScript.OnInit();
                uiScript.OnOpen(...args);
            }

            this.m_PanelNodeMap.set(pID, uiNode);
        });

        return pID;
    }

    private CheckPanel(id: number, args: any[]): number {
        const uiDatas = this.m_PanelDataMap.get(id);
        if (!uiDatas || uiDatas.length === 0) return 0;

        let rID = 0;
        const invalidIDs: number[] = [];

        for (const panelID of uiDatas) {
            const panelNode = this.m_PanelNodeMap.get(panelID);
            if (!panelNode) {
                invalidIDs.push(panelID);
                continue;
            }

            if (!panelNode.active) {
                panelNode.active = true;
                const uiScript = panelNode.getComponent(UIBase);
                if (uiScript) {
                    uiScript.OnOpen(...args);
                }
                rID = panelID;
                break;
            } else {
                const uidata = UIDataRegistry.FindUIData(id);
                if (uidata && uidata.showMode === UIShowMode.Single) {
                    rID = panelID;
                    break;
                }
            }
        }

        if (invalidIDs.length > 0) {
            const invalidSet = new Set(invalidIDs);
            const filtered = uiDatas.filter(v => !invalidSet.has(v));
            this.m_PanelDataMap.set(id, filtered);
        }

        return rID;
    }
}
