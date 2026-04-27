import { StorageManager } from '../../framework/StorageManager';
import { UIManager } from '../../engine/ui/UIManager';
import { registerFlowerGameUI, FlowerUIID } from './FlowerUIConfig';
import { FlowerGameState } from './FlowerGameState';

/**
 * 插花游戏入口 — 由 Launcher 的 onGameReady 回调调用
 * 负责注册 UI、初始化存储前缀、加载存档、打开首屏
 */
export function initFlowerGame(): void {
    // 设置存储前缀
    StorageManager.getInstance().setPrefix('flower_');

    // 注册插花游戏的 UI 面板
    registerFlowerGameUI();

    // 加载游戏存档
    FlowerGameState.getInstance();

    // 打开首屏
    UIManager.GetInstance().OpenPanel(FlowerUIID.LoadingPanel);
}
