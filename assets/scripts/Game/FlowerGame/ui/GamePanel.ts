import { _decorator, Button, instantiate, JsonAsset, Node, Prefab, resources } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { EventManager } from '../../../framework/EventManager';
import { FlowerPlatform } from './FlowerPlatform';
import { FlowerUIID } from '../FlowerUIConfig';
import { FlowerEvent } from '../FlowerEvent';
import { FlowerConst } from '../FlowerConst';
import { FlowerGameState } from '../FlowerGameState';
import { FlowerLevelData } from '../FlowerLevelModel';
const { ccclass, property } = _decorator;

@ccclass('GamePanel')
export class GamePanel extends UIBase {
    @property(Button)
    m_CloseBtn: Button = null;
    @property(Node)
    m_LevelRoot: Node = null;
    @property(Node)
    m_FlowerImgMoveRoot: Node = null;

    private m_FlowerPlatformArr: FlowerPlatform[] = [];
    private m_CurLevelData: FlowerLevelData | null = null;

    OnInit(): void {}

    OnOpen(...args: any[]): void {
        const em = EventManager.getInstance();
        em.on(FlowerEvent.FlowerDissolve, this.onCheckFlowerDissolve, this);
        em.on(FlowerEvent.CheckVictory, this.onCheckVictory, this);
        em.on(FlowerEvent.RetryLevel, this.onRetryLevel, this);
        em.on(FlowerEvent.NextLevel, this.onNextLevel, this);
        this.initUI();
    }

    OnClose(): void {
        super.OnClose();
        EventManager.getInstance().offAllByTarget(this);
    }

    private onNextLevel(): void {
        this.initGameLevel(FlowerGameState.getInstance().currentLevel + 1);
    }

    private onRetryLevel(): void {
        this.initGameLevel(FlowerGameState.getInstance().currentLevel);
    }

    private onCheckFlowerDissolve(flowerTag: number): void {
        this.m_FlowerPlatformArr.forEach(fp => fp.checkFlowerDissolve(flowerTag));
    }

    private onCheckVictory(): void {
        if (!this.m_CurLevelData) return;

        const allVictory = this.m_FlowerPlatformArr.every(fp => fp.checkVictory());
        if (allVictory) {
            FlowerGameState.getInstance().completeLevel();
            UIManager.GetInstance().OpenPanel(FlowerUIID.VictoryPanel, true);
        }
    }

    private initUI(): void {
        this.SetBtnEvent(this.m_CloseBtn, () => {
            UIManager.GetInstance().OpenPanel(FlowerUIID.VictoryPanel, false);
        });

        this.initGameLevel(FlowerGameState.getInstance().currentLevel);
    }

    private initGameLevel(level: number): void {
        const state = FlowerGameState.getInstance();
        state.currentLevel = level;
        state.resetRuntimeState();

        resources.load(FlowerConst.RES_PATH.LEVEL_DATA + level, JsonAsset, (err, jsonAsset) => {
            if (err) {
                console.warn(`GamePanel: 加载关卡 ${level} 失败`, err);
                return;
            }

            this.m_CurLevelData = jsonAsset.json as FlowerLevelData;
            this.m_LevelRoot.removeAllChildren();

            resources.load(FlowerConst.RES_PATH.FLOWER_PLATFORM, Prefab, (err, prefab) => {
                if (err || !prefab) return;

                FlowerPlatform.s_FlowerPotTag = 0;
                this.m_FlowerPlatformArr = [];

                for (let i = 0; i < this.m_CurLevelData!.FlowerRow; i++) {
                    const node = instantiate(prefab);
                    this.m_LevelRoot.addChild(node);

                    const script = node.getComponent(FlowerPlatform);
                    if (script) {
                        script.InitPlatForm(i, this.m_CurLevelData!.FlowerPlatform[i], this.m_CurLevelData, this.m_FlowerImgMoveRoot);
                        this.m_FlowerPlatformArr.push(script);
                    }
                }

                EventManager.getInstance().emit(FlowerEvent.LevelLoaded, level);
            });
        });
    }
}
