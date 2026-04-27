import { _decorator, BoxCollider2D, Collider2D, Component, Contact2DType, EventTouch, Node, tween, UITransform, Vec2, Vec3 } from 'cc';
import { EventManager } from '../../../framework/EventManager';
import { FlowerEvent } from '../FlowerEvent';
import { FlowerConst } from '../FlowerConst';
import { FlowerPosition, SLOT_NAMES, SLOT_PRIORITY } from '../FlowerLevelModel';
const { ccclass } = _decorator;

/**
 * 花朵组件 — 处理拖拽、碰撞检测和花盆匹配
 */
@ccclass('Flower')
export class Flower extends Component {
    private m_FlowerStartPos: Vec3 = Vec3.ZERO;
    private m_FlowerUITransform: UITransform = null;
    private m_FlowerRoot: Node = null;
    private m_FlowerMoveRoot: Node = null;
    private m_FlowerMoveRootUIT: UITransform = null;
    private m_FlowerMoveOffsetY: number = 0;
    private m_IsDragging: boolean = false;
    private m_IsAnimating: boolean = false;
    private m_ImgPos: FlowerPosition = FlowerPosition.Mid;

    private m_BoxCollider2D: BoxCollider2D = null;
    private m_FlowerTag: number = 0;
    private m_FlowerId: string = "";
    private m_IsBlack: boolean = false;

    // 碰撞目标信息
    private m_IsChangePot: boolean = false;
    private m_TargetImgPos: FlowerPosition = FlowerPosition.Mid;
    private m_TargetStartPos: Vec3 = Vec3.ZERO;
    private m_TargetFlowerRoot: Node = null;
    private m_TargetFlowerTag: number = 0;
    private m_SelfCollider: Collider2D = null;
    private m_OtherCollider: Collider2D = null;
    private m_ContactTags: number[] = [];

    getFlowerID(): string {
        return this.m_FlowerId;
    }

    init(imgId: string, flowerRoot: Node, flowerMoveRoot: Node, imgPos: number, rLeft: Vec3, rRight: Vec3, tag: number, isBlack: boolean): void {
        this.m_IsBlack = isBlack;
        this.m_FlowerId = imgId;
        this.m_FlowerTag = tag;
        this.m_IsDragging = false;
        this.m_FlowerRoot = flowerRoot;
        this.m_FlowerMoveRoot = flowerMoveRoot;
        this.m_FlowerMoveRootUIT = flowerMoveRoot?.getComponent(UITransform);
        this.m_ImgPos = imgPos as FlowerPosition;
        this.m_ContactTags = [];
    }

    start(): void {
        this.m_FlowerUITransform = this.node.getComponent(UITransform);
        if (!this.m_IsBlack) {
            this.registerTouchEvents();
        }
    }

    protected onDestroy(): void {
        this.unregisterTouchEvents();
    }

    private registerTouchEvents(): void {
        this.unregisterTouchEvents();
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, true);
    }

    private unregisterTouchEvents(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    // ==================== 碰撞检测 ====================

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D): void {
        this.m_ContactTags.push(otherCollider.tag);
        this.m_SelfCollider = selfCollider;
        this.m_OtherCollider = otherCollider;
        this.tryFindEmptySlot(selfCollider, otherCollider);
    }

    private onEndContact(_selfCollider: Collider2D, otherCollider: Collider2D): void {
        const otherTag = otherCollider.tag;
        let allCleared = true;

        for (let i = 0; i < this.m_ContactTags.length; i++) {
            if (this.m_ContactTags[i] === otherTag) {
                this.m_ContactTags[i] = -1;
            }
        }

        for (let i = 0; i < this.m_ContactTags.length; i++) {
            if (this.m_ContactTags[i] >= 0) {
                allCleared = false;
                break;
            }
        }

        if (allCleared) {
            this.m_ContactTags = [];
            this.m_SelfCollider = null;
            this.m_OtherCollider = null;
            this.m_IsChangePot = false;
        }
    }

    private tryFindEmptySlot(selfCollider: Collider2D, otherCollider: Collider2D): void {
        if (!otherCollider) return;

        const light = otherCollider.node.getChildByName("FlowerRootLight");
        if (!light) return;

        const detectedPos = this.detectImgPosition(selfCollider, otherCollider);
        const priority = SLOT_PRIORITY[detectedPos];

        for (const pos of priority) {
            const slotName = SLOT_NAMES[pos];
            const slot = light.getChildByName(slotName);
            if (slot && slot.children.length <= 0) {
                this.m_IsChangePot = true;
                this.m_TargetImgPos = pos;
                this.m_TargetStartPos = slot.getWorldPosition();
                this.m_TargetFlowerRoot = slot;
                this.m_TargetFlowerTag = otherCollider.tag;
                return;
            }
        }
    }

    private detectImgPosition(selfCollider: Collider2D, otherCollider: Collider2D): FlowerPosition {
        if (!selfCollider || !otherCollider) return FlowerPosition.Mid;

        const threshold = otherCollider.worldAABB.size.width / 6;
        const deltaX = selfCollider.node.getWorldPosition().x - otherCollider.node.getWorldPosition().x;

        if (deltaX > threshold) return FlowerPosition.Right;
        if (deltaX < -threshold) return FlowerPosition.Left;
        return FlowerPosition.Mid;
    }

    // ==================== 触摸事件 ====================

    private onTouchStart(_event: EventTouch): void {}

    private onTouchMove(event: EventTouch): void {
        if (!event.target) return;

        if (!this.m_IsDragging) {
            if (this.m_IsAnimating) return;
            this.startDrag(event);
        }

        if (!this.m_IsDragging || this.m_IsAnimating) return;

        const delta = event.getUIDelta();
        const pos = event.target.position;
        event.target.setPosition(pos.x + delta.x, pos.y + delta.y);

        if (this.m_SelfCollider && this.m_OtherCollider) {
            this.tryFindEmptySlot(this.m_SelfCollider, this.m_OtherCollider);
        }
    }

    private startDrag(event: EventTouch): void {
        this.m_IsDragging = true;
        this.m_FlowerMoveOffsetY = this.m_FlowerUITransform.contentSize.height * FlowerConst.FLOWER_DRAG_OFFSET_RATIO;
        event.target.parent = this.m_FlowerMoveRoot;
        this.m_FlowerStartPos = this.m_FlowerRoot.getWorldPosition();

        const touchPos = event.touch.getUILocation();
        const localPos = this.m_FlowerMoveRootUIT.convertToNodeSpaceAR(new Vec3(touchPos.x, touchPos.y, 0));
        event.target.setPosition(localPos.x, localPos.y - this.m_FlowerMoveOffsetY);
        event.target.setRotationFromEuler(Vec3.ZERO);

        this.setupDragCollider();
    }

    private setupDragCollider(): void {
        this.m_BoxCollider2D = this.node.getComponent(BoxCollider2D);
        if (!this.m_BoxCollider2D) {
            this.m_BoxCollider2D = this.node.addComponent(BoxCollider2D);
            this.m_BoxCollider2D.sensor = true;
            this.m_BoxCollider2D.size.x = this.m_FlowerUITransform.contentSize.x * 0.5;
            this.m_BoxCollider2D.size.y = this.m_FlowerUITransform.contentSize.y;
            this.m_BoxCollider2D.offset = new Vec2(0, this.m_FlowerUITransform.contentSize.y / 2);
            this.m_BoxCollider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.m_BoxCollider2D.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }

    private onTouchEnd(event: EventTouch): void {
        if (!this.m_IsDragging || this.m_IsAnimating) return;

        if (event.target) {
            const prevTag = this.m_FlowerTag;

            if (this.m_IsChangePot) {
                this.m_IsChangePot = false;
                this.m_ImgPos = this.m_TargetImgPos;
                this.m_FlowerStartPos = this.m_TargetStartPos;
                this.m_FlowerRoot = this.m_TargetFlowerRoot;
                this.m_FlowerTag = this.m_TargetFlowerTag;
            }

            this.animateFlowerBack(event.target, prevTag);
        } else {
            this.m_IsDragging = false;
        }

        this.cleanupDragCollider();
    }

    private animateFlowerBack(target: Node, prevTag: number): void {
        const endPos = target.getWorldPosition();
        const dist = Math.abs(this.m_FlowerStartPos.x - endPos.x) + Math.abs(this.m_FlowerStartPos.y - endPos.y);
        const delta = this.m_FlowerStartPos.subtract(endPos);

        this.m_IsAnimating = true;
        tween(target)
            .by(dist / FlowerConst.FLOWER_FLY_SPEED, { position: delta })
            .call(() => {
                this.m_IsAnimating = false;
                this.m_IsDragging = false;
                this.applyRotation();
                this.node.parent = this.m_FlowerRoot;
                this.node.setPosition(Vec3.ZERO);
                this.m_FlowerRoot.active = true;

                EventManager.getInstance().emit(FlowerEvent.FlowerDissolve, prevTag);
                EventManager.getInstance().emit(FlowerEvent.FlowerDissolve, this.m_FlowerTag);
            })
            .start();
    }

    private applyRotation(): void {
        if (this.m_ImgPos === FlowerPosition.Left) {
            this.node.setRotationFromEuler(FlowerConst.FLOWER_ROTATION_LEFT);
        } else if (this.m_ImgPos === FlowerPosition.Right) {
            this.node.setRotationFromEuler(FlowerConst.FLOWER_ROTATION_RIGHT);
        } else {
            this.node.setRotationFromEuler(Vec3.ZERO);
        }
    }

    private cleanupDragCollider(): void {
        if (this.m_BoxCollider2D) {
            this.m_BoxCollider2D.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            this.m_BoxCollider2D.off(Contact2DType.END_CONTACT, this.onEndContact, this);
            this.m_BoxCollider2D.destroy();
            this.m_BoxCollider2D = null;
        }
        this.m_ContactTags = [];
        this.m_SelfCollider = null;
        this.m_OtherCollider = null;
    }
}
