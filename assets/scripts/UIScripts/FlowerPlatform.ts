import { _decorator, BoxCollider2D, Camera, color, Component, director, EventTouch, Input, input, instantiate, Node, resources, Scene, Sprite, SpriteFrame, sys, tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
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
    private m_FlowerPotTagIndexMap:Map<number, number> = new Map();
    private m_FlowerPotTagDataMap:Map<number, any> = new Map();

    private m_IsVictory:boolean = false;

    protected start(): void {        
        
    }

    protected onDestroy(): void {
        
    }

    checkFlowerDissolve(args:any):void {
        //console.log("onCheckFlowerDissolve");
        if(!args){
            return;
        }

        var flowerTag = args;
        var flowerpot = this.m_FlowerPotMap.get(flowerTag);
        if(!flowerpot){
            return;
        }

        var flowerRoot = flowerpot.getChildByName("FlowerRootLight");
        if(!flowerRoot){
            return;
        }

        var flowers = flowerRoot.getComponentsInChildren(Flower);
        if(!flowers){
            this.checkBlackFlowers(flowerpot, flowerTag);
            return;
        }

        if(flowers.length < 3){
            if(flowers.length <= 0){
                this.checkBlackFlowers(flowerpot, flowerTag);
            }
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
                    tween(flowerNode).to(0.5, {angle : 0}, {onComplete:(target:Node)=>{
                        if(target){
                            target.removeFromParent();
                            target.destroy();
                        }
                    }}).call(()=>{
                        if(i == flowers.length){                            
                            this.checkBlackFlowers(flowerpot, flowerTag);
                        }
                    }).start();
                }
            }
        }
    }

    checkBlackFlowers(flowerpot:Node, flowerTag:number){
        var flowerRootBlack = flowerpot.getChildByName("FlowerRootBlack");
        if(flowerRootBlack){
            var blackFlowers = flowerRootBlack.getComponentsInChildren(Flower);
            if(blackFlowers && blackFlowers.length > 0){
                var idx = this.m_FlowerPotTagIndexMap.get(flowerTag) + 1;
                this.m_FlowerPotTagIndexMap.set(flowerTag, idx);
                var flowerData = this.m_FlowerPotTagDataMap.get(flowerTag);
                if(idx < flowerData.length){
                    this.InitFlowers(flowerTag, flowerData, idx, flowerpot);
                }   
            }
        }

        var isVictory = this.checkVictory();
        if(isVictory){
            EventManager.getInstance().emit(CustomClientEvent.CheckVictory);
        }
    }

    checkVictory():boolean {
        var victory = true;
        this.m_FlowerPotMap.forEach((value, key)=>{
            if(!value)
            {
                return;
            }

            var flowerRoot = value.getChildByName("FlowerRootLight");
            if(!flowerRoot)
            {
                return;
            }

            var flowers = flowerRoot.getComponentsInChildren(Flower);
            if(!flowers)
            {
                return;
            }
            
            if(flowers.length <= 0)
            {
                return;
            }

            victory = false;
        });

        return victory;
    }

    public InitPlatForm(raw:number, platFormNum:number, data:any, flowerMoveRoot:Node):void {
        this.m_FlowerPotMap.clear();
        this.m_FlowerPotTagIndexMap.clear();
        this.m_FlowerPotTagDataMap.clear();

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
                        this.m_FlowerPotTagIndexMap.set(collider.tag, 0);
                        this.m_FlowerPotTagDataMap.set(collider.tag, data[i]);
                        this.InitFlowers(collider.tag, data[i], 0, flowerPotLayoutClone);                        
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

    InitFlowers(tag:number, data:any, idx:number, flowerPotLayoutClone:Node):void{
        if(flowerPotLayoutClone){
            var flowerRootBlack = flowerPotLayoutClone.getChildByName("FlowerRootBlack");
            if(data.length >= (idx + 1)){
                this.setFlowerData(flowerRootBlack, tag, data[idx + 1], true);
                flowerRootBlack.active = true;
            }
            else{
                flowerRootBlack.active = false;
            }

            var flowerRootLight = flowerPotLayoutClone.getChildByName("FlowerRootLight");
            if(data.length >= idx){
                this.setFlowerData(flowerRootLight, tag, data[idx], false);
                flowerRootLight.active = true;
            }
            else{
                flowerRootLight.active = false;
            }
        }
    }

    setFlowerData(flowerRoot:Node, tag:number, data:any, isBlack:boolean):void {
        if(flowerRoot == null){
            return;
        }

        flowerRoot.active = false;
        var left = flowerRoot.getChildByName("Left");
        if(data && data.left){
            left.active = true;
            this.setImg(left, data.left, -1, tag, isBlack);
        }
        else{
            left.active = false;
        }

        var mid = flowerRoot.getChildByName("Mid");
        if(data && data.mid){
            mid.active = true;
            this.setImg(mid, data.mid, 0, tag, isBlack);
        }
        else{
            mid.active = false;
        }

        var right = flowerRoot.getChildByName("Right");
        if(data && data.right){
            right.active = true;
            this.setImg(right, data.right, 1, tag, isBlack);
        }
        else{
            right.active = false;
        }

        flowerRoot.active = true;      
    }

    //imgPos: 0-中间 1-右边 -1-左边
    setImg(root:Node, imgId:string, imgPos:number, tag:number, isBlack:boolean){
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
                        flowerScript.init(imgId, root, this.m_FlowerMoveRoot, imgPos, this.m_RotationLeft, this.m_RotationRight, tag, isBlack);

                        if(isBlack){
                            img.color = color(60, 60, 60, 255);
                        }
                        else{
                            img.color = color(255, 255, 255, 255);
                        }
                        
                        imgNode.active = true;
                    });
                }
            }

            root.addChild(imgNode);
        }
    }
}


