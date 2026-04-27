import { StorageManager } from '../../framework/StorageManager';
import { UIManager } from '../../engine/ui/UIManager';
import { registerSurvivorGameUI, SurvivorUIID } from './SurvivorUIConfig';
import { SurvivorGameState } from './SurvivorGameState';

/**
 * 类吸血鬼幸存者 — 游戏入口
 */
export function initSurvivorGame(): void {
    StorageManager.getInstance().setPrefix('survivor_');
    registerSurvivorGameUI();
    SurvivorGameState.getInstance();
    UIManager.GetInstance().OpenPanel(SurvivorUIID.LoadingPanel);
}
