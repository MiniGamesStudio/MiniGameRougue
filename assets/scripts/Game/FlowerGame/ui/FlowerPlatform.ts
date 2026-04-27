import { _decorator, BoxCollider2D, color, Component, instantiate, Node, resources, Sprite, SpriteFrame, tween, UITransform } from 'cc';
import { Flower } from './Flower';
import { EventManager } from '../../../framework/EventManager';
import { FlowerEvent } from '../FlowerEvent';
import { FlowerConst } from '../FlowerConst';
import { FlowerPosition } from '../FlowerLevelModel';
const { ccclass, property } = _decorator;

/**
 * 花盆平台组件 — 管理花盆布局、花朵初始化和消除判定
 */
@ccclass('FlowerPlatform')
export class FlowerPlatform extends Component {
    @property(Node)
    m_PlatFormRoot: Node = null;

    static s_FlowerPotTag: number = 0;

    private m_FlowerMoveRoot: Node = null;
    private m_FlowerPotMap: Map<number, Node> = new Map();
    private m_FlowerPotTagIndexMap: Map<number, number> = new Map();
    private m_FlowerPotTagDataMap: Map<number, any> = new Map();

    // ==================== 消除逻辑 ====================

    checkFlowerDissolve(flowerTag: number): void {
        if (!flowerTag) return;

        const flowerpot = this.m_FlowerPotMap.get(flowerTag);
        if (!flowerpot) return;

        const flowerRoot = flowerpot.getChildByName("FlowerRootLight");
        if (!flowerRoot) {
            this.onLayerCleared(flowerpot, flowerTag);
            return;
        }

        const flowers = flowerRoot.getComponentsInChildren(Flower);
        if (!flowers || flowers.length <= 0) {
            this.onLayerCleared(flowerpot, flowerTag);
            return;
        }

        if (flowers.length < FlowerConst.FLOWER_MATCH_COUNT) return;

        const firstID = flowers[0].getFlowerID();
        const allSame = flowers.every(f => f.getFlowerID() === firstID);

        if (allSame) {
            this.dissolveFlowers(flowers, flowerpot, flowerTag);
        }
    }

    private dissolveFlowers(flowers: Flower[], flowerpot: Node, flowerTag: number): void {
        let completed = 0;
        const total = flowers.length;

        flowers.forEach(flower => {
            const flowerNode = flower.node;
            if (!flowerNode) {
                completed++;
                if (completed >= total) {
                    this.onLayerCleared(flowerpot, flowerTag);
                }
                return;
            }

            tween(flowerNode)
                .to(FlowerConst.FLOWER_DISSOLVE_DURATION, { angle: 0 })
                .call(() => {
                    if (flowerNode && flowerNode.isValid) {
                        flowerNode.removeFromParent();
                        flowerNode.destroy();
                    }
                    completed++;
                    if (completed >= total) {
                        this.onLayerCleared(flowerpot, flowerTag);
                    }
                })
                .start();
        });
    }

    private onLayerCleared(flowerpot: Node, flowerTag: number): void {
        const flowerRootBlack = flowerpot.getChildByName("FlowerRootBlack");
        if (flowerRootBlack) {
            const blackFlowers = flowerRootBlack.getComponentsInChildren(Flower);
            if (blackFlowers && blackFlowers.length > 0) {
                const idx = (this.m_FlowerPotTagIndexMap.get(flowerTag) ?? 0) + 1;
                this.m_FlowerPotTagIndexMap.set(flowerTag, idx);
                const flowerData = this.m_FlowerPotTagDataMap.get(flowerTag);
                if (flowerData && idx < flowerData.length) {
                    this.initFlowers(flowerTag, flowerData, idx, flowerpot);
                }
            }
        }

        if (this.checkVictory()) {
            EventManager.getInstance().emit(FlowerEvent.CheckVictory);
        }
    }

    checkVictory(): boolean {
        for (const [, pot] of this.m_FlowerPotMap) {
            if (!pot) continue;
            const flowerRoot = pot.getChildByName("FlowerRootLight");
            if (!flowerRoot) continue;
            const flowers = flowerRoot.getComponentsInChildren(Flower);
            if (flowers && flowers.length > 0) return false;
        }
        return true;
    }

    // ==================== 初始化 ====================

    InitPlatForm(raw: number, platFormNum: number, data: any, flowerMoveRoot: Node): void {
        this.m_FlowerPotMap.clear();
        this.m_FlowerPotTagIndexMap.clear();
        this.m_FlowerPotTagDataMap.clear();
        this.m_FlowerMoveRoot = flowerMoveRoot;

        if (!data) return;

        this.m_PlatFormRoot.active = false;
        for (let i = 0; i < platFormNum; i++) {
            const clone = instantiate(this.m_PlatFormRoot);
            if (!clone) continue;

            const fpNum = platFormNum > 1 ? data.FlowerPot[raw][i] : data.FlowerPot[raw];
            this.initFlowerPot(fpNum, data.FlowerArr[raw][i], clone);

            clone.active = true;
            this.node.addChild(clone);
        }
    }

    private initFlowerPot(flowerPotNum: number, data: any, platFormClone: Node): void {
        if (!data) return;

        const flowerPotRoot = platFormClone.getChildByName("FlowerPotRoot");
        const flowerPotLayout = flowerPotRoot?.getChildByName("FlowerPotLayout");
        if (!flowerPotLayout) return;

        flowerPotLayout.active = false;
        for (let i = 0; i < flowerPotNum; i++) {
            const layoutClone = instantiate(flowerPotLayout);
            if (!layoutClone) continue;

            const collider = layoutClone.getComponent(BoxCollider2D);
            if (collider) {
                FlowerPlatform.s_FlowerPotTag++;
                collider.tag = FlowerPlatform.s_FlowerPotTag;
            }

            const tag = collider?.tag ?? 0;
            this.m_FlowerPotMap.set(tag, layoutClone);
            this.m_FlowerPotTagIndexMap.set(tag, 0);
            this.m_FlowerPotTagDataMap.set(tag, data[i]);
            this.initFlowers(tag, data[i], 0, layoutClone);

            layoutClone.active = true;
            flowerPotRoot!.addChild(layoutClone);
        }

        const platUITrans = platFormClone.getChildByName("Platform")?.getComponent(UITransform);
        if (platUITrans) {
            const size = platUITrans.contentSize;
            platUITrans.setContentSize(size.width * flowerPotNum, size.height);
        }
    }

    private initFlowers(tag: number, data: any, idx: number, potLayout: Node): void {
        if (!potLayout) return;

        const blackRoot = potLayout.getChildByName("FlowerRootBlack");
        if (data.length >= idx + 1) {
            this.setFlowerData(blackRoot, tag, data[idx + 1], true);
            if (blackRoot) blackRoot.active = true;
        } else if (blackRoot) {
            blackRoot.active = false;
        }

        const lightRoot = potLayout.getChildByName("FlowerRootLight");
        if (data.length >= idx) {
            this.setFlowerData(lightRoot, tag, data[idx], false);
            if (lightRoot) lightRoot.active = true;
        } else if (lightRoot) {
            lightRoot.active = false;
        }
    }

    private setFlowerData(flowerRoot: Node, tag: number, data: any, isBlack: boolean): void {
        if (!flowerRoot) return;

        flowerRoot.active = false;

        const slots: [string, string | undefined, FlowerPosition][] = [
            ["Left", data?.left, FlowerPosition.Left],
            ["Mid", data?.mid, FlowerPosition.Mid],
            ["Right", data?.right, FlowerPosition.Right],
        ];

        for (const [name, imgId, pos] of slots) {
            const slot = flowerRoot.getChildByName(name);
            if (!slot) continue;

            if (imgId) {
                slot.active = true;
                this.createFlowerNode(slot, imgId, pos, tag, isBlack);
            } else {
                slot.active = false;
            }
        }

        flowerRoot.active = true;
    }

    private createFlowerNode(root: Node, imgId: string, imgPos: FlowerPosition, tag: number, isBlack: boolean): void {
        if (!root || !imgId) return;

        root.removeAllChildren();
        const imgNode = new Node();

        if (imgPos === FlowerPosition.Left) {
            imgNode.name = "FlowerImgLeft";
            imgNode.setRotationFromEuler(FlowerConst.FLOWER_ROTATION_LEFT);
        } else if (imgPos === FlowerPosition.Right) {
            imgNode.name = "FlowerImgRight";
            imgNode.setRotationFromEuler(FlowerConst.FLOWER_ROTATION_RIGHT);
        } else {
            imgNode.name = "FlowerImgMid";
        }

        imgNode.active = false;

        let uiTrans = imgNode.getComponent(UITransform);
        if (!uiTrans) uiTrans = imgNode.addComponent(UITransform);
        uiTrans.setAnchorPoint(0.5, 0);

        const sprite = imgNode.addComponent(Sprite);
        resources.load(FlowerConst.RES_PATH.FLOWERS + imgId + "/spriteFrame", SpriteFrame, (err, sp) => {
            if (sp) sprite.spriteFrame = sp;

            let flowerScript = imgNode.getComponent(Flower);
            if (!flowerScript) flowerScript = imgNode.addComponent(Flower);
            flowerScript.init(imgId, root, this.m_FlowerMoveRoot, imgPos,
                FlowerConst.FLOWER_ROTATION_LEFT, FlowerConst.FLOWER_ROTATION_RIGHT, tag, isBlack);

            sprite.color = isBlack ? color(60, 60, 60, 255) : color(255, 255, 255, 255);
            imgNode.active = true;
        });

        root.addChild(imgNode);
    }
}
