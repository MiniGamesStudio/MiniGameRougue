import { AudioClip, AudioSource, Node, resources } from 'cc';

/**
 * 音频管理器 — 管理背景音乐和音效的播放
 * 引擎层：依赖 Cocos Creator 音频系统
 */
export class AudioManager {
    private static _instance: AudioManager;

    private _bgmSource: AudioSource = null;
    private _sfxSource: AudioSource = null;
    private _bgmVolume: number = 1.0;
    private _sfxVolume: number = 1.0;
    private _bgmMuted: boolean = false;
    private _sfxMuted: boolean = false;
    private _audioNode: Node = null;

    /** 音效缓存 */
    private _clipCache: Map<string, AudioClip> = new Map();

    static getInstance(): AudioManager {
        if (!this._instance) {
            this._instance = new AudioManager();
        }
        return this._instance;
    }

    /**
     * 初始化，需要传入一个常驻节点
     * AudioSource 组件会挂载到该节点上
     */
    init(persistNode: Node): void {
        if (this._audioNode) return;

        this._audioNode = new Node('AudioManager');
        this._audioNode.parent = persistNode;

        this._bgmSource = this._audioNode.addComponent(AudioSource);
        this._bgmSource.loop = true;
        this._bgmSource.playOnAwake = false;

        this._sfxSource = this._audioNode.addComponent(AudioSource);
        this._sfxSource.loop = false;
        this._sfxSource.playOnAwake = false;
    }

    // ==================== BGM ====================

    playBGM(path: string): void {
        this.loadClip(path, (clip) => {
            if (!this._bgmSource) return;
            this._bgmSource.stop();
            this._bgmSource.clip = clip;
            this._bgmSource.volume = this._bgmMuted ? 0 : this._bgmVolume;
            this._bgmSource.play();
        });
    }

    stopBGM(): void {
        this._bgmSource?.stop();
    }

    pauseBGM(): void {
        this._bgmSource?.pause();
    }

    resumeBGM(): void {
        if (this._bgmSource && !this._bgmSource.playing) {
            this._bgmSource.play();
        }
    }

    setBGMVolume(vol: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, vol));
        if (this._bgmSource && !this._bgmMuted) {
            this._bgmSource.volume = this._bgmVolume;
        }
    }

    setBGMMuted(muted: boolean): void {
        this._bgmMuted = muted;
        if (this._bgmSource) {
            this._bgmSource.volume = muted ? 0 : this._bgmVolume;
        }
    }

    get isBGMMuted(): boolean { return this._bgmMuted; }

    // ==================== SFX ====================

    playSFX(path: string): void {
        if (this._sfxMuted) return;
        this.loadClip(path, (clip) => {
            if (!this._sfxSource) return;
            this._sfxSource.playOneShot(clip, this._sfxVolume);
        });
    }

    setSFXVolume(vol: number): void {
        this._sfxVolume = Math.max(0, Math.min(1, vol));
    }

    setSFXMuted(muted: boolean): void {
        this._sfxMuted = muted;
    }

    get isSFXMuted(): boolean { return this._sfxMuted; }

    // ==================== 内部 ====================

    private loadClip(path: string, callback: (clip: AudioClip) => void): void {
        const cached = this._clipCache.get(path);
        if (cached) {
            callback(cached);
            return;
        }

        resources.load(path, AudioClip, (err, clip) => {
            if (err) {
                console.warn(`AudioManager: 加载音频失败 [${path}]`, err);
                return;
            }
            this._clipCache.set(path, clip);
            callback(clip);
        });
    }

    clearCache(): void {
        this._clipCache.clear();
    }

    destroy(): void {
        this.stopBGM();
        this._clipCache.clear();
        if (this._audioNode) {
            this._audioNode.destroy();
            this._audioNode = null;
        }
        this._bgmSource = null;
        this._sfxSource = null;
    }
}
