import { __private, _decorator, Button, Component, instantiate, JsonAsset, Layout, Node, PageView, Prefab, ProgressBar, resources, Slider, SpriteFrame, UITransform } from 'cc';
import { UIBase } from '../Core/UIBase';
import { UIManager } from '../Core/UIManager';
import { UIID } from './UIData';
import { FlowerPlatform } from './FlowerPlatform';
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
    

    onOpen(...args: any[]): void {
        this.initUI();
    }

    onClose(): void {
        
    }

    initUI(): void {
        this.m_CloseBtn.node.on('click', ()=>{
            UIManager.GetInstance().ClosePanel(UIID.GamePanel);
            UIManager.GetInstance().OpenPanel(UIID.MainPanel);
        });

        this.initGameLevel();
    }

    initGameLevel(): void {
        resources.load("levelData/level_1", JsonAsset, (err, jsonAsset)=>{
            if(err){
                return;
            }

            var levelData = jsonAsset.json;

            resources.load("ui/FlowerPlatform", Prefab, (err, prefab)=>{
                if(prefab){
                    FlowerPlatform.s_FlowerPotTag = 0;
                    for(var i:number = 0; i < levelData.FlowerRow; ++i){
                        var temp = instantiate(prefab);
                        if(temp){
                            this.m_LevelRoot.addChild(temp);
                            var tScript = temp.getComponent(FlowerPlatform);
                            if(tScript){
                                tScript.InitPlatForm(i, levelData.FlowerPlatform[i], levelData, this.m_FlowerImgMoveRoot);                            
                            }
                        }
                    }
                }
            });
        });
    }
}