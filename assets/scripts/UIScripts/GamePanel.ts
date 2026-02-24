import { __private, _decorator, Button, Component, EPhysics2DDrawFlags, instantiate, JsonAsset, Layout, Node, PageView, PhysicsSystem2D, Prefab, ProgressBar, resources, Slider, SpriteFrame, UITransform } from 'cc';
import { UIBase } from '../Core/UIBase';
import { UIManager } from '../Core/UIManager';
import { UIID } from './UIData';
import { FlowerPlatform } from './FlowerPlatform';
import { EventManager } from '../Core/EventManager';
import { CustomClientEvent } from '../Config/Config';
const { ccclass, property } = _decorator;

@ccclass('GamePanel')
export class GamePanel extends UIBase {
    @property(Button)
    m_CloseBtn:Button = null;
    @property(Node)
    m_LevelRoot:Node = null;
    @property(Node)
    m_FlowerImgMoveRoot:Node = null;
    @property([])
    m_LevelData = [];
    
    m_FlowerPlatformArr:FlowerPlatform[] = null;
    m_CurLevelData: Record<string, any> | null = null;
    m_CurLv:number = 1;

    OnInit(): void {
        
    }

    OnOpen(...args: any[]): void {
        EventManager.getInstance().on(CustomClientEvent.FlowerDissolve, this.onCheckFlowerDissolve, this);
        EventManager.getInstance().on(CustomClientEvent.CheckVictory, this.onCheckVictory, this);
        EventManager.getInstance().on(CustomClientEvent.RetryLevel, this.onRetryLevel, this);
        EventManager.getInstance().on(CustomClientEvent.NextLevel, this.onNextLevel, this);
        this.initUI();
    }

    OnClose(): void {
        super.OnClose()
        EventManager.getInstance().off(CustomClientEvent.FlowerDissolve, this.onCheckFlowerDissolve, this);
        EventManager.getInstance().off(CustomClientEvent.CheckVictory, this.onCheckVictory, this);
        EventManager.getInstance().off(CustomClientEvent.RetryLevel, this.onRetryLevel, this);
        EventManager.getInstance().off(CustomClientEvent.NextLevel, this.onNextLevel, this);
    }

    onNextLevel():void {
        this.initGameLevel(this.m_CurLv + 1);
    }

    onRetryLevel():void {
        this.initGameLevel(this.m_CurLv);
    }

    onCheckFlowerDissolve(args:any):void {
        if(this.m_FlowerPlatformArr && this.m_FlowerPlatformArr.length > 0){
            this.m_FlowerPlatformArr.forEach((fPlatform)=>{
                fPlatform.checkFlowerDissolve(args);
            });
        }
    }

    onCheckVictory(args:any):void {
        //console.log("onCheckVictory 1");
        if(!this.m_CurLevelData){
            return;
        }

        var vCount = 0;
        this.m_FlowerPlatformArr.forEach(fPlatform => {
            if(!fPlatform){
                return;
            }

            var temp = fPlatform.checkVictory();
            if(temp){
                vCount += 1;
            }
        });

        //console.log("onCheckVictory 2 vCount = " + vCount);
        if(vCount == this.m_FlowerPlatformArr.length){
            //Victory
            //console.log("onCheckVictory VictoryPanel");
            UIManager.GetInstance().OpenPanel(UIID.VictoryPanel, true);
        }

    }

    initUI(): void {
        this.SetBtnEvent(this.m_CloseBtn, ()=>{
            UIManager.GetInstance().ClosePanel(UIID.VictoryPanel);
            UIManager.GetInstance().OpenPanel(UIID.VictoryPanel);
        });

        this.initGameLevel(this.m_CurLv);
    }

    initGameLevel(level:number): void {      
        /*  
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
        EPhysics2DDrawFlags.Pair |
        EPhysics2DDrawFlags.CenterOfMass |
        EPhysics2DDrawFlags.Joint |
        EPhysics2DDrawFlags.Shape;
        */

        this.m_CurLv = level;
        resources.load("levelData/level_" + level, JsonAsset, (err, jsonAsset)=>{
            if(err){
                return;
            }

            this.m_CurLevelData = jsonAsset.json;
            this.m_LevelRoot.removeAllChildren();
            resources.load("ui/FlowerPlatform", Prefab, (err, prefab)=>{
                if(prefab){
                    FlowerPlatform.s_FlowerPotTag = 0;
                    this.m_FlowerPlatformArr = [];
                    for(var i:number = 0; i < this.m_CurLevelData.FlowerRow; ++i){
                        var temp = instantiate(prefab);
                        if(temp){
                            this.m_LevelRoot.addChild(temp);
                            var tScript = temp.getComponent(FlowerPlatform);
                            if(tScript){
                                tScript.InitPlatForm(i, this.m_CurLevelData.FlowerPlatform[i], this.m_CurLevelData, this.m_FlowerImgMoveRoot);                            
                                this.m_FlowerPlatformArr.push(tScript);
                            }
                        }
                    }
                }
            });
        });
    }
}