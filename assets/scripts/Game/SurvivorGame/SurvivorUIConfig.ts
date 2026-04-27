import { UIDataRegistry, UILayer, UIShowMode } from '../../engine/ui/UIData';

/**
 * 幸存者游戏 UI ID
 */
export enum SurvivorUIID {
    None = 0,
    LoadingPanel = 101,
    MainPanel = 102,
    BattleHUD = 103,
    LevelUpPanel = 104,
    PausePanel = 105,
    GameOverPanel = 106,
    ResultPanel = 107,
}

/**
 * 注册幸存者游戏的所有 UI 面板
 */
export function registerSurvivorGameUI(): void {
    UIDataRegistry.Register(SurvivorUIID.LoadingPanel, UILayer.System, "SvLoadingPanel", "ui/survivor/SvLoadingPanel");
    UIDataRegistry.Register(SurvivorUIID.MainPanel, UILayer.Normal, "SvMainPanel", "ui/survivor/SvMainPanel", UIShowMode.Normal, 1);
    UIDataRegistry.Register(SurvivorUIID.BattleHUD, UILayer.Normal, "SvBattleHUD", "ui/survivor/SvBattleHUD");
    UIDataRegistry.Register(SurvivorUIID.LevelUpPanel, UILayer.PopUp, "SvLevelUpPanel", "ui/survivor/SvLevelUpPanel");
    UIDataRegistry.Register(SurvivorUIID.PausePanel, UILayer.PopUp, "SvPausePanel", "ui/survivor/SvPausePanel", UIShowMode.Single);
    UIDataRegistry.Register(SurvivorUIID.GameOverPanel, UILayer.PopUp, "SvGameOverPanel", "ui/survivor/SvGameOverPanel");
    UIDataRegistry.Register(SurvivorUIID.ResultPanel, UILayer.PopUp, "SvResultPanel", "ui/survivor/SvResultPanel");
}
