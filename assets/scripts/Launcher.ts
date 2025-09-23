import { _decorator, Camera, Component, director, instantiate, Node, resources, Sprite, SpriteFrame, Vec2, game, Game, PhysicsSystem2D, EPhysics2DDrawFlags } from 'cc';
import { ScreenAdapter } from "./ScreenAdapter";
import { GameManager } from "./Core/GameManager";
import { UIManager } from './Core/UIManager';
import { UIID } from './UIScripts/UIData';

const { ccclass, property } = _decorator;

@ccclass('Launcher')
export class Launcher extends Component {
    @property(ScreenAdapter)
    public m_ScreenAdapter = null;
    @property(Camera)
    m_Camera = null;
    @property(Node)
    m_UIRoot = null;
    @property(Node)
    m_GameWorld = null;

    protected onLoad(): void {    
        PhysicsSystem2D.instance.enable = true;
        PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
        EPhysics2DDrawFlags.Pair |
        EPhysics2DDrawFlags.CenterOfMass |
        EPhysics2DDrawFlags.Joint |
        EPhysics2DDrawFlags.Shape;

        director.addPersistRootNode(this.node);
        
        // 监听游戏进入后台事件
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        // 监听游戏回到前台事件
        game.on(Game.EVENT_SHOW, this.onGameShow, this);

        GameManager.GetInstance().Init(this.m_GameWorld, this.m_UIRoot);
    }

    protected start(): void {
        
    }

    protected update(dt: number): void {
        GameManager.GetInstance().Update(dt)
    }
    
    protected lateUpdate(dt: number): void {
        GameManager.GetInstance().LateUpdate(dt)
    }

    protected onDestroy(): void {
        GameManager.GetInstance().Destory();
    }

     private onGameHide() {
        console.log('游戏进入后台');
        // 处理游戏进入后台的逻辑，例如暂停游戏、暂停音频等
        GameManager.GetInstance().PauseGame();
    }

    private onGameShow() {
        console.log('游戏回到前台');
        // 处理游戏回到前台的逻辑，例如恢复游戏、恢复音频等
        GameManager.GetInstance().ResumeGame();
    }
}


