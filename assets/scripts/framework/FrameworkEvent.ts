/**
 * 框架级事件 — 所有游戏通用
 * 框架层：纯数据，不依赖任何引擎 API
 */
export enum FrameworkEvent {
    GamePaused = "Framework.GamePaused",
    GameResumed = "Framework.GameResumed",
    SceneChanged = "Framework.SceneChanged",
}
