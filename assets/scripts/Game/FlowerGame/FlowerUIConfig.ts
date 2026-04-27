import { UIDataRegistry, UILayer, UIShowMode } from '../../engine/ui/UIData';

/**
 * 插花游戏 UI ID 枚举
 */
export enum FlowerUIID {
    None = 0,
    LoadingPanel = 1,
    MainPanel = 2,
    GamePanel = 3,
    VictoryPanel = 4,
}

/**
 * 注册插花游戏的所有 UI 面板到框架
 */
export function registerFlowerGameUI(): void {
    UIDataRegistry.Register(FlowerUIID.LoadingPanel, UILayer.System, "LoadingPanel", "ui/LoadingPanel");
    UIDataRegistry.Register(FlowerUIID.MainPanel, UILayer.Normal, "MainPanel", "ui/MainPanel", UIShowMode.Normal, 1);
    UIDataRegistry.Register(FlowerUIID.GamePanel, UILayer.Normal, "GamePanel", "ui/GamePanel");
    UIDataRegistry.Register(FlowerUIID.VictoryPanel, UILayer.Normal, "VictoryPanel", "ui/VictoryPanel");
}
