/**
 * 框架级常量 — 所有游戏通用
 * 框架层：纯数据，不依赖任何引擎 API
 */
export const FrameworkConst = {
    /** 默认加载界面时长（秒） */
    LOADING_DURATION: 1,
    /** 页面滑动动画时长（秒） */
    PAGE_SCROLL_DURATION: 0.5,
    /** 资源路径前缀 */
    RES_PATH: {
        UI_PREFIX: 'ui/',
    },
} as const;
