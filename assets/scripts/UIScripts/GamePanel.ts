import { __private, _decorator, Button, Component, instantiate, JsonAsset, Layout, Node, PageView, Prefab, ProgressBar, resources, Slider, SpriteFrame, UITransform } from 'cc';
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

    onOpen(...args: any[]): void {
        EventManager.getInstance().on(CustomClientEvent.CheckVictory, this.onCheckVictory, this);
        EventManager.getInstance().on(CustomClientEvent.RetryLevel, this.onRetryLevel, this);
        EventManager.getInstance().on(CustomClientEvent.NextLevel, this.onNextLevel, this);
        this.initUI();
    }

    onClose(): void {
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

    onCheckVictory(args:any):void {
        if(!this.m_CurLevelData){
            return;
        }

        var vCount = 0;
        this.m_FlowerPlatformArr.forEach(fPlatform => {
            if(!fPlatform){
                return;
            }

            var temp = fPlatform.isVictory();
            if(temp){
                vCount += 1;
            }
        });

        if(vCount == this.m_FlowerPlatformArr.length){
            //Victory
            UIManager.GetInstance().OpenPanel(UIID.VictoryPanel, true);
        }

    }

    initUI(): void {
        this.m_CloseBtn.node.on('click', ()=>{
            UIManager.GetInstance().ClosePanel(UIID.VictoryPanel);
            UIManager.GetInstance().OpenPanel(UIID.VictoryPanel);
        });

        this.initGameLevel(this.m_CurLv);
    }

    initGameLevel(level:number): void {
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