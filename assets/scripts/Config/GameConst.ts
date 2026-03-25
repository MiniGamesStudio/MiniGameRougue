import { Vec3 } from 'cc';

/**
 * 框架级常量 — 所有游戏通用
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

/**
 * 业务常量 — 插花游戏专用
 */
export const GameConst = {
    // 花朵相关
    FLOWER_FLY_SPEED: 1000,
    FLOWER_DISSOLVE_DURATION: 0.5,
    FLOWER_MATCH_COUNT: 3,
    FLOWER_ROTATION_LEFT: new Vec3(0, 0, 30),
    FLOWER_ROTATION_RIGHT: new Vec3(0, 0, -30),
    FLOWER_DRAG_OFFSET_RATIO: 0.6,

    // 资源路径
    RES_PATH: {
        FLOWERS: 'flowers/',
        LEVEL_DATA: 'levelData/level_',
        FLOWER_PLATFORM: 'ui/FlowerPlatform',
    },

    // 关卡
    MAX_LEVEL: 3,
} as const;
