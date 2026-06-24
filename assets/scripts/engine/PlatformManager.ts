import { sys } from 'cc';

export enum MiniGamePlatform {
    Auto = 'auto',
    WeChat = 'wechat',
    Douyin = 'douyin',
}

export enum PlatformResult {
    Success = 'success',
    Failed = 'failed',
    Unsupported = 'unsupported',
}

export interface PlatformLoginResult {
    result: PlatformResult;
    platform: MiniGamePlatform;
    code?: string;
    userInfo?: unknown;
    message?: string;
    err?: unknown;
}

export interface PlatformRankResult {
    result: PlatformResult;
    platform: MiniGamePlatform;
    message?: string;
    err?: unknown;
}

export interface PlatformShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
}

export interface PlatformShareResult {
    result: PlatformResult;
    platform: MiniGamePlatform;
    message?: string;
    err?: unknown;
}

export interface PlatformPrivacySettingResult {
    result: PlatformResult;
    platform: MiniGamePlatform;
    needAuthorization?: boolean;
    privacyContractName?: string;
    message?: string;
    err?: unknown;
}

export interface PlatformPrivacyAuthorizeResult {
    result: PlatformResult;
    platform: MiniGamePlatform;
    message?: string;
    err?: unknown;
}

export interface PlatformRankUserData {
    nickname: string;
    avatarUrl?: string;
    score: number;
    isSelf?: boolean;
}

export interface PlatformRankListResult extends PlatformRankResult {
    data?: PlatformRankUserData[];
    self?: PlatformRankUserData;
}

export interface PlatformUserCloudStorageItem {
    key: string;
    value: string;
}

type MiniGameLoginResult = {
    code?: string;
};

type MiniGameUserInfoResult = {
    userInfo?: unknown;
};

type MiniGamePrivacySettingResult = {
    needAuthorization?: boolean;
    privacyContractName?: string;
};

type MiniGameOpenDataContext = {
    canvas?: unknown;
    postMessage?: (message: unknown) => void;
};

type MiniGameCloudStorageData = {
    key: string;
    value: string;
};

type MiniGameFriendCloudStorageItem = {
    nickname?: string;
    avatarUrl?: string;
    KVDataList?: MiniGameCloudStorageData[];
};

type MiniGameRuntime = {
    login?: (options: {
        success?: (res: MiniGameLoginResult) => void;
        fail?: (err: unknown) => void;
    }) => void;
    getUserInfo?: (options: {
        success?: (res: MiniGameUserInfoResult) => void;
        fail?: (err: unknown) => void;
    }) => void;
    setUserCloudStorage?: (options: {
        KVDataList: PlatformUserCloudStorageItem[];
        success?: () => void;
        fail?: (err: unknown) => void;
    }) => void;
    getUserCloudStorage?: (options: {
        keyList: string[];
        success?: (res: { KVDataList?: MiniGameCloudStorageData[] }) => void;
        fail?: (err: unknown) => void;
    }) => void;
    getFriendCloudStorage?: (options: {
        keyList: string[];
        success?: (res: { data?: MiniGameFriendCloudStorageItem[] }) => void;
        fail?: (err: unknown) => void;
    }) => void;
    shareAppMessage?: (options: {
        title?: string;
        imageUrl?: string;
        query?: string;
        success?: () => void;
        fail?: (err: unknown) => void;
    }) => void;
    getPrivacySetting?: (options: {
        success?: (res: MiniGamePrivacySettingResult) => void;
        fail?: (err: unknown) => void;
    }) => void;
    requirePrivacyAuthorize?: (options: {
        success?: () => void;
        fail?: (err: unknown) => void;
        complete?: () => void;
    }) => void;
    openPrivacyContract?: (options: {
        success?: () => void;
        fail?: (err: unknown) => void;
    }) => void;
    getOpenDataContext?: () => MiniGameOpenDataContext;
};

export class PlatformManager {
    private static _instance: PlatformManager;

    private _initialized: boolean = false;
    private _currentPlatform: MiniGamePlatform = MiniGamePlatform.Auto;
    private _currentRuntime: MiniGameRuntime | null = null;

    static getInstance(): PlatformManager {
        if (!this._instance) {
            this._instance = new PlatformManager();
        }
        return this._instance;
    }

    init(): void {
        if (this._initialized) return;

        this._currentPlatform = this.resolvePlatformBySystem();
        this._currentRuntime = this.getRuntime(this._currentPlatform);
        this._initialized = true;
    }

    getPlatform(): MiniGamePlatform {
        if (!this._initialized) this.init();
        return this._currentPlatform;
    }

    async login(platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformLoginResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform === MiniGamePlatform.Auto || !runtime?.login) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持小游戏登录',
            };
        }

        try {
            const loginResult = await this.callLogin(runtime);
            const userInfoResult = await this.callGetUserInfo(runtime);
            return {
                result: PlatformResult.Success,
                platform: resolvedPlatform,
                code: loginResult.code,
                userInfo: userInfoResult?.userInfo,
                message: '登录成功',
            };
        } catch (err) {
            return {
                result: PlatformResult.Failed,
                platform: resolvedPlatform,
                message: '登录失败',
                err,
            };
        }
    }

    async getPrivacySetting(platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformPrivacySettingResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform !== MiniGamePlatform.WeChat || !runtime?.getPrivacySetting) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                needAuthorization: false,
                message: '当前环境不支持隐私授权状态查询',
            };
        }

        return new Promise(resolve => {
            runtime.getPrivacySetting({
                success: (res) => {
                    resolve({
                        result: PlatformResult.Success,
                        platform: resolvedPlatform,
                        needAuthorization: !!res.needAuthorization,
                        privacyContractName: res.privacyContractName,
                        message: res.needAuthorization ? '需要用户同意隐私协议' : '已同步隐私授权状态',
                    });
                },
                fail: (err: unknown) => {
                    resolve({
                        result: PlatformResult.Failed,
                        platform: resolvedPlatform,
                        message: '隐私授权状态查询失败',
                        err,
                    });
                },
            });
        });
    }

    async requirePrivacyAuthorize(platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformPrivacyAuthorizeResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform !== MiniGamePlatform.WeChat || !runtime?.requirePrivacyAuthorize) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持隐私授权弹窗',
            };
        }

        return new Promise(resolve => {
            runtime.requirePrivacyAuthorize({
                success: () => {
                    resolve({
                        result: PlatformResult.Success,
                        platform: resolvedPlatform,
                        message: '隐私授权成功',
                    });
                },
                fail: (err: unknown) => {
                    resolve({
                        result: PlatformResult.Failed,
                        platform: resolvedPlatform,
                        message: '隐私授权失败',
                        err,
                    });
                },
            });
        });
    }

    async openPrivacyContract(platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformPrivacyAuthorizeResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform !== MiniGamePlatform.WeChat || !runtime?.openPrivacyContract) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持展示隐私协议',
            };
        }

        return new Promise(resolve => {
            runtime.openPrivacyContract({
                success: () => {
                    resolve({
                        result: PlatformResult.Success,
                        platform: resolvedPlatform,
                        message: '已展示隐私协议',
                    });
                },
                fail: (err: unknown) => {
                    resolve({
                        result: PlatformResult.Failed,
                        platform: resolvedPlatform,
                        message: '展示隐私协议失败',
                        err,
                    });
                },
            });
        });
    }

    async ensurePrivacyAuthorize(platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformPrivacyAuthorizeResult> {
        const setting = await this.getPrivacySetting(platform);
        if (setting.result === PlatformResult.Unsupported || setting.needAuthorization === false) {
            return {
                result: PlatformResult.Success,
                platform: setting.platform,
                message: setting.message,
            };
        }
        if (setting.result !== PlatformResult.Success) {
            return {
                result: setting.result,
                platform: setting.platform,
                message: setting.message,
                err: setting.err,
            };
        }

        return this.requirePrivacyAuthorize(setting.platform);
    }

    async submitRankScore(key: string, score: number, platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformRankResult> {
        return this.setUserCloudStorage([{ key, value: String(Math.floor(score)) }], platform);
    }

    async shareAppMessage(
        options: PlatformShareOptions = {},
        platform: MiniGamePlatform = MiniGamePlatform.Auto,
    ): Promise<PlatformShareResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform === MiniGamePlatform.Auto || !runtime?.shareAppMessage) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持分享',
            };
        }

        return new Promise(resolve => {
            let finished = false;
            const finish = (result: PlatformShareResult): void => {
                if (finished) return;
                finished = true;
                resolve(result);
            };

            runtime.shareAppMessage({
                title: options.title || '一起来玩小羊小游戏',
                imageUrl: options.imageUrl,
                query: options.query,
                success: () => {
                    finish({
                        result: PlatformResult.Success,
                        platform: resolvedPlatform,
                        message: '分享成功',
                    });
                },
                fail: (err: unknown) => {
                    finish({
                        result: PlatformResult.Failed,
                        platform: resolvedPlatform,
                        message: '分享失败',
                        err,
                    });
                },
            });
            setTimeout(() => {
                finish({
                    result: PlatformResult.Success,
                    platform: resolvedPlatform,
                    message: '分享已调起',
                });
            }, 500);
        });
    }

    async setUserCloudStorage(
        dataList: PlatformUserCloudStorageItem[],
        platform: MiniGamePlatform = MiniGamePlatform.Auto,
    ): Promise<PlatformRankResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform === MiniGamePlatform.Auto || !runtime?.setUserCloudStorage) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持排行榜数据提交',
            };
        }

        return new Promise(resolve => {
            runtime.setUserCloudStorage({
                KVDataList: dataList,
                success: () => {
                    resolve({
                        result: PlatformResult.Success,
                        platform: resolvedPlatform,
                        message: '排行榜数据提交成功',
                    });
                },
                fail: (err: unknown) => {
                    resolve({
                        result: PlatformResult.Failed,
                        platform: resolvedPlatform,
                        message: '排行榜数据提交失败',
                        err,
                    });
                },
            });
        });
    }

    postOpenDataMessage(message: unknown, platform: MiniGamePlatform = MiniGamePlatform.Auto): PlatformRankResult {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        const openDataContext = runtime?.getOpenDataContext?.();
        if (resolvedPlatform === MiniGamePlatform.Auto || !openDataContext?.postMessage) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持开放数据域',
            };
        }

        openDataContext.postMessage(message);
        return {
            result: PlatformResult.Success,
            platform: resolvedPlatform,
            message: '已发送开放数据域消息',
        };
    }

    async getFriendRankList(key: string, platform: MiniGamePlatform = MiniGamePlatform.Auto): Promise<PlatformRankListResult> {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        if (resolvedPlatform === MiniGamePlatform.Auto || !runtime?.getFriendCloudStorage) {
            return {
                result: PlatformResult.Unsupported,
                platform: resolvedPlatform,
                message: '当前环境不支持主域读取好友排行榜',
            };
        }

        try {
            const [friendList, self] = await Promise.all([
                this.callGetFriendCloudStorage(runtime, key),
                this.callGetUserCloudStorage(runtime, key),
            ]);
            const data = [...friendList];
            if (self && !data.some(item => item.isSelf)) {
                data.push(self);
            }
            data.sort((a, b) => b.score - a.score);

            return {
                result: PlatformResult.Success,
                platform: resolvedPlatform,
                data,
                self: self || data.find(item => item.isSelf),
                message: '好友排行榜读取成功',
            };
        } catch (err) {
            return {
                result: PlatformResult.Failed,
                platform: resolvedPlatform,
                message: '好友排行榜读取失败',
                err,
            };
        }
    }

    getOpenDataCanvas(platform: MiniGamePlatform = MiniGamePlatform.Auto): unknown | null {
        if (!this._initialized) this.init();

        const resolvedPlatform = this.resolvePlatform(platform);
        const runtime = this.getRuntimeByPlatform(resolvedPlatform);
        const openDataContext = runtime?.getOpenDataContext?.();
        return openDataContext?.canvas ?? null;
    }

    private callLogin(runtime: MiniGameRuntime): Promise<MiniGameLoginResult> {
        return new Promise((resolve, reject) => {
            runtime.login?.({
                success: resolve,
                fail: reject,
            });
        });
    }

    private callGetUserInfo(runtime: MiniGameRuntime): Promise<MiniGameUserInfoResult | null> {
        if (!runtime.getUserInfo) return Promise.resolve(null);

        return new Promise(resolve => {
            runtime.getUserInfo({
                success: resolve,
                fail: () => resolve(null),
            });
        });
    }

    private callGetFriendCloudStorage(runtime: MiniGameRuntime, key: string): Promise<PlatformRankUserData[]> {
        return new Promise((resolve, reject) => {
            runtime.getFriendCloudStorage?.({
                keyList: [key],
                success: (res) => {
                    const list = (res.data || []).map(item => ({
                        nickname: item.nickname || '匿名玩家',
                        avatarUrl: item.avatarUrl,
                        score: this.getCloudStorageScore(item.KVDataList, key),
                    }));
                    resolve(list);
                },
                fail: reject,
            });
        });
    }

    private callGetUserCloudStorage(runtime: MiniGameRuntime, key: string): Promise<PlatformRankUserData | null> {
        if (!runtime.getUserCloudStorage) return Promise.resolve(null);

        return new Promise(resolve => {
            runtime.getUserCloudStorage({
                keyList: [key],
                success: (res) => {
                    resolve({
                        nickname: '我',
                        score: this.getCloudStorageScore(res.KVDataList, key),
                        isSelf: true,
                    });
                },
                fail: () => resolve(null),
            });
        });
    }

    private getCloudStorageScore(dataList: MiniGameCloudStorageData[] = [], key: string): number {
        const data = dataList.find(item => item.key === key);
        return Number(data?.value || 0);
    }

    private resolvePlatform(platform: MiniGamePlatform = MiniGamePlatform.Auto): MiniGamePlatform {
        if (platform !== MiniGamePlatform.Auto) return platform;
        if (this._currentPlatform !== MiniGamePlatform.Auto) return this._currentPlatform;

        return this.resolvePlatformBySystem();
    }

    private resolvePlatformBySystem(): MiniGamePlatform {
        if (sys.platform === sys.Platform.WECHAT_GAME) return MiniGamePlatform.WeChat;
        if (sys.platform === sys.Platform.BYTEDANCE_MINI_GAME) return MiniGamePlatform.Douyin;

        return MiniGamePlatform.Auto;
    }

    private getRuntimeByPlatform(platform: MiniGamePlatform): MiniGameRuntime | null {
        if (platform === this._currentPlatform) return this._currentRuntime;
        return this.getRuntime(platform);
    }

    private getRuntime(platform: MiniGamePlatform): MiniGameRuntime | null {
        const globalObj = globalThis as unknown as { wx?: MiniGameRuntime; tt?: MiniGameRuntime };
        if (platform === MiniGamePlatform.WeChat) return globalObj.wx ?? null;
        if (platform === MiniGamePlatform.Douyin) return globalObj.tt ?? null;
        return null;
    }
}
