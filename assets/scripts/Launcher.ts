import { _decorator, Camera, Component, director, Node, game, Game } from 'cc';
import { ScreenAdapter } from "./ScreenAdapter";
import { GameManager } from "./Core/GameManager";

const { ccclass, property } = _decorator;

/**
 * 游戏入口 — 常驻节点，驱动 GameManager 生命周期
 */
@ccclass('Launcher')
export class Launcher extends Component {
    @property(ScreenAdapter)
    public m_ScreenAdapter: ScreenAdapter = null;
    @property(Camera)
    m_Camera: Camera = null;
    @property(Node)
    m_UIRoot: Node = null;
    @property(Node)
    m_GameWorld: Node = null;

    protected onLoad(): void {
        director.addPersistRootNode(this.node);

        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        game.on(Game.EVENT_SHOW, this.onGameShow, this);

        // 传入 this.node 作为常驻节点，供 AudioManager 等挂载组件
        GameManager.GetInstance().Init(this.m_GameWorld, this.m_UIRoot, this.node);
    }

    protected update(dt: number): void {
        GameManager.GetInstance().Update(dt);
    }

    protected lateUpdate(dt: number): void {
        GameManager.GetInstance().LateUpdate(dt);
    }

    protected onDestroy(): void {
        game.off(Game.EVENT_HIDE, this.onGameHide, this);
        game.off(Game.EVENT_SHOW, this.onGameShow, this);
        GameManager.GetInstance().Destroy();
    }

    private onGameHide(): void {
        GameManager.GetInstance().PauseGame();
    }

    private onGameShow(): void {
        GameManager.GetInstance().ResumeGame();
    }
}
