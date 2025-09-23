import { _decorator, BoxCollider2D, Collider2D, Component, Contact2DType, EPhysics2DDrawFlags, EventTouch, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody2D, tween, UITransform, Vec2, Vec3 } from 'cc';
import { CustomClientEvent } from '../Config/Config';
import { EventManager } from '../Core/EventManager';
const { ccclass, property } = _decorator;

@ccclass('Flower')
export class Flower extends Component {
    m_FlowerFlySpeed:number = 1000;
    m_FlowerStartPos:Vec3 = Vec3.ZERO;
    m_RotationLeft:Vec3 = Vec3.ZERO;
    m_RotationRight:Vec3 = Vec3.ZERO;

    m_FlowerUITransform:UITransform = null;
    m_FlowerRoot:Node = null;
    m_FlowerMoveRoot:Node = null;
    m_FlowerMoveRootUIT:UITransform = null;
    m_FlowerMoveOffsetY:number = 0;
    m_IsDragingFlower:Boolean = false;
    m_ImgPos:number = 0;
    m_IsFlowerDoAni:Boolean = false;

    m_BoxCollider2D:BoxCollider2D = null;
    m_RigidBody2D:RigidBody2D = null;
    m_FlowerTag:number = 0;

    m_IsChangePot = false;
    m_TempImgPos:number = 1;
    m_TempFlowerStartPos:Vec3 = Vec3.ZERO;
    m_TempFlowerRoot:Node = null;
    m_TempFlowerTag:number = 0;
    m_SelfCollider: Collider2D = null;
    m_OtherCollider: Collider2D = null;

    m_FlowerId:string = "";

    public getFlowerID():string{
        return this.m_FlowerId;
    }

    //imgPos: 0-中间 1-右边 -1-左边
    init(imgId:string, flowerRoot : Node, flowerMoveRoot : Node, imgPos:number, rLeft:Vec3, rRight:Vec3, tag:number){
        this.m_FlowerId = imgId;
        this.m_FlowerTag = tag;
        this.m_IsDragingFlower = false;
        this.m_FlowerRoot = flowerRoot;
        this.m_FlowerMoveRoot = flowerMoveRoot;
        if(this.m_FlowerMoveRoot){
            this.m_FlowerMoveRootUIT = this.m_FlowerMoveRoot.getComponent(UITransform);
        }
        this.m_ImgPos = imgPos;
        this.m_RotationLeft = rLeft;
        this.m_RotationRight = rRight;
    }

    start() {
        this.m_FlowerUITransform = this.node.getComponent(UITransform);

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this, true);
    }

    protected onDestroy(): void {        
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onBeginContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体开始接触时被调用一次
        //console.log('onBeginContact: selfname = ' + selfCollider.name + " othername = " + otherCollider.name);

        this.m_SelfCollider = selfCollider;
        this.m_OtherCollider = otherCollider;
        this.chckCollision(selfCollider, otherCollider);
    }

    chckCollision(selfCollider: Collider2D, otherCollider: Collider2D):void {
        if(otherCollider){ 
            var light = otherCollider.node.getChildByName("FlowerRootLight");
            if(light){
                var imgPos = this.checkImgPos(selfCollider, otherCollider);

                if(imgPos == -1){
                    var left = light.getChildByName("Left");
                    if(left.children.length <= 0){                    
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = -1;
                        this.m_TempFlowerStartPos = left.getWorldPosition();
                        this.m_TempFlowerRoot = left;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }

                    var right = light.getChildByName("Right");
                    if(right.children.length <= 0){      
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 1;
                        this.m_TempFlowerStartPos = right.getWorldPosition();
                        this.m_TempFlowerRoot = right;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }

                    var mid = light.getChildByName("Mid");
                    if(mid.children.length <= 0){
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 0;
                        this.m_TempFlowerStartPos = mid.getWorldPosition();
                        this.m_TempFlowerRoot = mid;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }
                }
                else if(imgPos == 1){
                    var right = light.getChildByName("Right");
                    if(right.children.length <= 0){      
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 1;
                        this.m_TempFlowerStartPos = right.getWorldPosition();
                        this.m_TempFlowerRoot = right;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }

                    var mid = light.getChildByName("Mid");
                    if(mid.children.length <= 0){
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 0;
                        this.m_TempFlowerStartPos = mid.getWorldPosition();
                        this.m_TempFlowerRoot = mid;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }
                    
                    var left = light.getChildByName("Left");
                    if(left.children.length <= 0){                    
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = -1;
                        this.m_TempFlowerStartPos = left.getWorldPosition();
                        this.m_TempFlowerRoot = left;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }
                }
                else{
                    var mid = light.getChildByName("Mid");
                    if(mid.children.length <= 0){
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 0;
                        this.m_TempFlowerStartPos = mid.getWorldPosition();
                        this.m_TempFlowerRoot = mid;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }
                    
                    var left = light.getChildByName("Left");
                    if(left.children.length <= 0){                    
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = -1;
                        this.m_TempFlowerStartPos = left.getWorldPosition();
                        this.m_TempFlowerRoot = left;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }
                    
                    var right = light.getChildByName("Right");
                    if(right.children.length <= 0){      
                        this.m_IsChangePot = true;
                        this.m_TempImgPos = 1;
                        this.m_TempFlowerStartPos = right.getWorldPosition();
                        this.m_TempFlowerRoot = right;
                        this.m_TempFlowerTag = otherCollider.tag;
                        return;
                    }                    
                }
            }
        }
    }

    checkImgPos(selfCollider: Collider2D, otherCollider: Collider2D):number {
        if(selfCollider && otherCollider){
            var imgPos = 0;
            var w = otherCollider.worldAABB.size.width / 6;
            var selfPos = selfCollider.node.getWorldPosition();
            var otherPos = otherCollider.node.getWorldPosition();
            var subX = selfPos.x - otherPos.x;
            if(subX > 0){
                if(subX > w){
                    //花在花盆右边
                    imgPos = 1;
                }
                else{
                    //花在花盆中间
                    imgPos = 0;
                }
            }
            else if(subX < 0)
            {
                if(Math.abs(subX) > w){
                    //花在花盆左边
                    imgPos = -1;
                }
                else{
                    //花在花盆中间
                    imgPos = 0;
                }
            }
            else{
                //花在花盆中间
                imgPos = 0;
            }

            return imgPos;
        }
    }

    onEndContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体结束接触时被调用一次
        //console.log('onEndContact');
        this.m_SelfCollider = null;
        this.m_OtherCollider = null;
        this.m_IsChangePot = false; 
    }

    onTouchStart(event: EventTouch){
        if(this.m_IsDragingFlower || this.m_IsFlowerDoAni){
            return;
        }

        if(event.target){
            
        }
    }

    onTouchMove(event: EventTouch){
        if(this.m_IsDragingFlower == false && event.target){
            this.m_IsDragingFlower = true;                    
            this.m_FlowerMoveOffsetY = event.target.getComponent(UITransform).contentSize.height * 0.6;
            event.target.parent = this.m_FlowerMoveRoot;     
            this.m_FlowerStartPos = this.m_FlowerRoot.getWorldPosition(); 
            var touchPos = event.touch.getUILocation();             
            var flowerStartPos = this.m_FlowerMoveRootUIT.convertToNodeSpaceAR(new Vec3(touchPos.x, touchPos.y, 0));
            event.target.setPosition(flowerStartPos.x, flowerStartPos.y - this.m_FlowerMoveOffsetY);
            event.target.setRotationFromEuler(new Vec3(0, 0, 0));

            this.m_BoxCollider2D = this.node.getComponent(BoxCollider2D);
            if(this.m_BoxCollider2D == null || this.m_BoxCollider2D == undefined){
                this.m_BoxCollider2D = this.node.addComponent(BoxCollider2D);
                this.m_BoxCollider2D.sensor = true;
                this.m_BoxCollider2D.size.x = this.m_FlowerUITransform.contentSize.x*0.5;
                this.m_BoxCollider2D.size.y = this.m_FlowerUITransform.contentSize.y;
                this.m_BoxCollider2D.offset = new Vec2(0, this.m_FlowerUITransform.contentSize.y / 2);
                this.m_BoxCollider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
                this.m_BoxCollider2D.on(Contact2DType.END_CONTACT, this.onEndContact, this);
                this.m_BoxCollider2D.enabled = false;
                this.m_BoxCollider2D.enabled = true;
            }
        }

        if(!this.m_IsDragingFlower || this.m_IsFlowerDoAni){
            return;
        }

        if(event.target){
            const delta = event.getUIDelta();
            
            // 移动花朵节点
            const pos = event.target.position;
            event.target.setPosition(pos.x + delta.x, pos.y + delta.y);
            
            if(this.m_SelfCollider && this.m_OtherCollider){
                this.chckCollision(this.m_SelfCollider, this.m_OtherCollider);
            }
        }
    }

    onTouchEnd(event: EventTouch){
        if(!this.m_IsDragingFlower || this.m_IsFlowerDoAni){
            return;
        }
        
        if(event.target){     
            if(this.m_IsChangePot){
                this.m_IsChangePot = false;
                this.m_ImgPos = this.m_TempImgPos;
                this.m_FlowerStartPos = this.m_TempFlowerStartPos;
                this.m_FlowerRoot = this.m_TempFlowerRoot;
                this.m_FlowerTag = this.m_TempFlowerTag;
            }
            
            var flowerEndPos = event.target.getWorldPosition();

            this.m_IsFlowerDoAni = true;
            var temp = Math.abs(this.m_FlowerStartPos.x - flowerEndPos.x) + Math.abs(this.m_FlowerStartPos.y - flowerEndPos.y);
            this.m_FlowerStartPos.subtract(flowerEndPos);
            tween(event.target).by(temp/this.m_FlowerFlySpeed, {position : this.m_FlowerStartPos}).call(()=>{                
                this.m_IsFlowerDoAni = false;
                this.m_IsDragingFlower = false;

                this.node.setRotationFromEuler(Vec3.ZERO);
                if(this.m_ImgPos == -1){
                    this.node.setRotationFromEuler(this.m_RotationLeft);
                }
                else if(this.m_ImgPos == 1){
                    this.node.setRotationFromEuler(this.m_RotationRight);
                }

                this.node.parent = this.m_FlowerRoot;
                this.node.setPosition(Vec3.ZERO);
                this.m_FlowerRoot.active = true;

                EventManager.getInstance().emit(CustomClientEvent.FlowerDissolve, this.m_FlowerTag);
            }).start();
        }
        else{
            this.m_IsDragingFlower = false;
        }

        if(this.m_BoxCollider2D){
            this.m_BoxCollider2D.destroy();
            this.m_BoxCollider2D = null;
        }
    }

    onTouchCancel(event: EventTouch){
        this.onTouchEnd(event);
    }
}


