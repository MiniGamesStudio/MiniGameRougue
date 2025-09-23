import { _decorator, BoxCollider2D, Camera, Component, director, EventTouch, Input, input, instantiate, Node, resources, Scene, Sprite, SpriteFrame, sys, tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { Flower } from './Flower';
import { CustomClientEvent } from '../Config/Config';
import { EventManager } from '../Core/EventManager';
const { ccclass, property } = _decorator;

export enum FlowerName{
    FlowerLeft = "FlowerLeft",
    FlowerRight = "FlowerRight",
    FlowerMid = "FlowerMid",
}

@ccclass('FlowerPlatform')
export class FlowerPlatform extends Component {
    @property(Node)
    m_PlatFormRoot:Node = null;

    static s_FlowerPotTag:number = 0;

    m_RotationLeft:Vec3 = new Vec3(0, 0, 30);
    m_RotationRight:Vec3 = new Vec3(0, 0, -30);

    m_FlowerMoveRoot:Node = null;

    private m_FlowerPotMap:Map<number, Node> = new Map();

    protected start(): void {        
        EventManager.getInstance().on(CustomClientEvent.FlowerDissolve, this.onCheckFlowerDissolve, this);
    }

    protected onDestroy(): void {
        EventManager.getInstance().off(CustomClientEvent.FlowerDissolve, this.onCheckFlowerDissolve, this);
    }

    onCheckFlowerDissolve(args:any):void {
        console.log("onCheckFlowerDissolve");
        if(!args){
            return;
        }

        var flowerTag = args;
        var flowerpot = this.m_FlowerPotMap.get(flowerTag);
        if(!flowerpot){
            return;
        }

        var flowerRoot = flowerpot.getChildByName("FlowerRootLight");
        var flowers = flowerRoot.getComponentsInChildren(Flower);
        if(!flowers){
            return;
        }

        if(flowers.length < 3){
            return;
        }

        var isSame = true;
        var tempFlowerTag = "";
        for(var i:number = 0; i < flowers.length; ++i){
            var flower = flowers[i];
            if(flower){
                var temp = flower.getFlowerID();
                if(tempFlowerTag == ""){
                    tempFlowerTag = temp;
                }
                else if(tempFlowerTag != temp){
                    isSame = false;
                    break
                }
            }
        }

        if(isSame){
            for(var i:number = 0; i < flowers.length; ++i){
                var flowerNode = flowers[i].node;
                if(flowerNode){
                    tween(flowerNode).to(0.3, {angle : 0}, {onComplete:(target:Node)=>{
                        if(target){
                            target.removeFromParent();
                            target.destroy();
                        }
                    }}).start();
                }
            }
        }
    }

    public InitPlatForm(raw:number, platFormNum:number, data:any, flowerMoveRoot:Node):void {
        this.m_FlowerPotMap.clear();
        this.m_FlowerMoveRoot = flowerMoveRoot;
        if(data){
            this.m_PlatFormRoot.active = false;
            for(var i:number = 0;i < platFormNum; ++i){
                var platFormRootClone = instantiate(this.m_PlatFormRoot);
                if(platFormRootClone){
                    var fpNum = data.FlowerPot[raw];
                    if(platFormNum > 1){
                        fpNum = data.FlowerPot[raw][i];
                    }
                    this.InitFlowerPot(fpNum, data.FlowerArr[raw][i], platFormRootClone);
                    
                    platFormRootClone.active = true;
                    this.node.addChild(platFormRootClone);
                }
            }
        }
    }

    InitFlowerPot(flowerPotNum:number, data:any, platFormRootClone:Node):void {        
        if(data){
            var flowerPotRoot = platFormRootClone.getChildByName("FlowerPotRoot");
            var flowerPotLayout = flowerPotRoot.getChildByName("FlowerPotLayout");
            if(flowerPotLayout){
                flowerPotLayout.active = false;
                for(var i:number = 0;i < flowerPotNum; ++i){
                    var flowerPotLayoutClone = instantiate(flowerPotLayout);
                    if(flowerPotLayoutClone){
                        var collider = flowerPotLayoutClone.getComponent(BoxCollider2D);
                        if(collider){
                            FlowerPlatform.s_FlowerPotTag += 1;
                            collider.tag = FlowerPlatform.s_FlowerPotTag;
                        }

                        this.m_FlowerPotMap.set(collider.tag, flowerPotLayoutClone);

                        this.InitFlowers(collider.tag, data[i], flowerPotLayoutClone);                        
                        flowerPotLayoutClone.active = true;
                        flowerPotRoot.addChild(flowerPotLayoutClone);
                    }
                }
            }

            var platFormUITrans = platFormRootClone.getChildByName("Platform").getComponent(UITransform);
            if(platFormUITrans){
                var cSize = platFormUITrans.contentSize;
                platFormUITrans.setContentSize(cSize.width*flowerPotNum, cSize.height);
            }
        }        
    }

    InitFlowers(tag:number, data:any, flowerPotLayoutClone:Node):void{
        if(flowerPotLayoutClone){
            var flowerRootBlack = flowerPotLayoutClone.getChildByName("FlowerRootBlack");
            if(data.length >= 1){
                this.setFlowerData(flowerRootBlack, tag, data[1]);
            }
            flowerRootBlack.active = false;

            var flowerRootLight = flowerPotLayoutClone.getChildByName("FlowerRootLight");
            this.setFlowerData(flowerRootLight, tag, data[0]);
        }
    }

    setFlowerData(flowerRoot:Node, tag:number, data:any = null):void {
        if(flowerRoot == null){
            return;
        }

        flowerRoot.active = false;
        var left = flowerRoot.getChildByName("Left");
        if(data && data.left){
            left.active = true;
            this.setImg(left, data.left, -1, tag);
        }
        else{
            left.active = false;
        }

        var mid = flowerRoot.getChildByName("Mid");
        if(data && data.mid){
            mid.active = true;
            this.setImg(mid, data.mid, 0, tag);
        }
        else{
            mid.active = false;
        }

        var right = flowerRoot.getChildByName("Right");
        if(data && data.right){
            right.active = true;
            this.setImg(right, data.right, 1, tag);
        }
        else{
            right.active = false;
        }

        flowerRoot.active = true;      
    }

    //imgPos: 0-中间 1-右边 -1-左边
    setImg(root:Node, imgId:string, imgPos:number, tag:number){
        var img = null;
        if(root == null || root == undefined){
            return;
        }

        if(imgId == null || imgId == undefined){
            root.active = false;
            return;
        }

        root.removeAllChildren();
        var imgNode = new Node();
        if(imgNode){      
            imgNode.name = "FlowerImgMid";
            if(imgPos == -1){
                imgNode.name = "FlowerImgLeft";
                imgNode.setRotationFromEuler(this.m_RotationLeft);
            }
            else if(imgPos == 1){
                imgNode.name = "FlowerImgRight";
                imgNode.setRotationFromEuler(this.m_RotationRight);
            }

            imgNode.active = false;                
            
            var uiTrans = imgNode.getComponent(UITransform);
            if(uiTrans == null || uiTrans == undefined){
                uiTrans = imgNode.addComponent(UITransform)
            }

            if(uiTrans){
                uiTrans.setAnchorPoint(0.5, 0);
            }

            img = imgNode.addComponent(Sprite);
            if(img){
                if(imgId != ""){
                    resources.load("flowers/" + imgId + "/spriteFrame", SpriteFrame, (err, sp)=>{
                        if(sp){
                            img.spriteFrame = sp;
                        }

                        var flowerScript = imgNode.getComponent(Flower);   
                        if(flowerScript == null || flowerScript == undefined){
                            flowerScript = imgNode.addComponent(Flower);                
                        }  
                        flowerScript.init(imgId, root, this.m_FlowerMoveRoot, imgPos, this.m_RotationLeft, this.m_RotationRight, tag);

                        imgNode.active = true;
                    });
                }
            }

            root.addChild(imgNode);
        }
    }
}


