/**
 * 框架级事件 — 所有游戏通用
 */
export enum FrameworkEvent {
    GamePaused = "Framework.GamePaused",
    GameResumed = "Framework.GameResumed",
    SceneChanged = "Framework.SceneChanged",
}

/**
 * 业务事件 — 插花游戏专用
 */
export enum CustomClientEvent {
    FlowerDissolve = "FlowerDissolve",
    CheckVictory = "CheckVictory",
    RetryLevel = "RetryLevel",
    NextLevel = "NextLevel",
    LevelLoaded = "LevelLoaded",
    GamePaused = "GamePaused",
    GameResumed = "GameResumed",
    ScoreChanged = "ScoreChanged",
}
