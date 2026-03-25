System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4", "__unresolved_5", "__unresolved_6", "__unresolved_7", "__unresolved_8", "__unresolved_9", "__unresolved_10"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, UIManager, AudioManager, TimerManager, StorageManager, ResManager, PoolManager, EventManager, GameState, UIID, CustomClientEvent, _dec, _class, _class2, _crd, ccclass, GameManager;

  function _reportPossibleCrUseOfUIManager(extras) {
    _reporterNs.report("UIManager", "./UIManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfAudioManager(extras) {
    _reporterNs.report("AudioManager", "./AudioManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfTimerManager(extras) {
    _reporterNs.report("TimerManager", "./TimerManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfStorageManager(extras) {
    _reporterNs.report("StorageManager", "./StorageManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfResManager(extras) {
    _reporterNs.report("ResManager", "./ResManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfPoolManager(extras) {
    _reporterNs.report("PoolManager", "./ObjectPool", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventManager(extras) {
    _reporterNs.report("EventManager", "./EventManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameState(extras) {
    _reporterNs.report("GameState", "../Model/GameState", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIID(extras) {
    _reporterNs.report("UIID", "../UIScripts/UIData", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCustomClientEvent(extras) {
    _reporterNs.report("CustomClientEvent", "../Config/Config", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
    }, function (_unresolved_2) {
      UIManager = _unresolved_2.UIManager;
    }, function (_unresolved_3) {
      AudioManager = _unresolved_3.AudioManager;
    }, function (_unresolved_4) {
      TimerManager = _unresolved_4.TimerManager;
    }, function (_unresolved_5) {
      StorageManager = _unresolved_5.StorageManager;
    }, function (_unresolved_6) {
      ResManager = _unresolved_6.ResManager;
    }, function (_unresolved_7) {
      PoolManager = _unresolved_7.PoolManager;
    }, function (_unresolved_8) {
      EventManager = _unresolved_8.EventManager;
    }, function (_unresolved_9) {
      GameState = _unresolved_9.GameState;
    }, function (_unresolved_10) {
      UIID = _unresolved_10.UIID;
    }, function (_unresolved_11) {
      CustomClientEvent = _unresolved_11.CustomClientEvent;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "54644vHSZhH94h9Kcc3gMp4", "GameManager", undefined);

      __checkObsolete__(['_decorator', 'Node']);

      ({
        ccclass
      } = _decorator);
      /**
       * 游戏管理器 — 全局生命周期管理，统一初始化和驱动所有子系统
       *
       * 子系统初始化顺序:
       *   StorageManager → AudioManager → UIManager → GameState
       *
       * 每帧驱动:
       *   TimerManager.update(dt)
       */

      _export("GameManager", GameManager = (_dec = ccclass('GameManager'), _dec(_class = (_class2 = class GameManager {
        constructor() {
          this.m_GameWorldRoot = null;
          this.m_Initialized = false;
        }

        static GetInstance() {
          if (this.m_Instance == null) {
            this.m_Instance = new GameManager();
          }

          return this.m_Instance;
        }

        /**
         * 初始化所有子系统
         * @param gameWorldRoot 游戏世界根节点
         * @param uiRoot UI 根节点
         * @param persistNode 常驻节点（用于挂载 AudioSource 等）
         */
        Init(gameWorldRoot, uiRoot, persistNode) {
          if (this.m_Initialized) return;
          this.m_Initialized = true;
          this.m_GameWorldRoot = gameWorldRoot; // 1. 存储（最先，其他模块可能需要读取配置）

          (_crd && StorageManager === void 0 ? (_reportPossibleCrUseOfStorageManager({
            error: Error()
          }), StorageManager) : StorageManager).getInstance().setPrefix('flower_'); // 2. 音频

          (_crd && AudioManager === void 0 ? (_reportPossibleCrUseOfAudioManager({
            error: Error()
          }), AudioManager) : AudioManager).getInstance().init(persistNode); // 3. UI

          (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
            error: Error()
          }), UIManager) : UIManager).GetInstance().Init(uiRoot); // 4. 游戏状态（会从 StorageManager 读取存档）

          (_crd && GameState === void 0 ? (_reportPossibleCrUseOfGameState({
            error: Error()
          }), GameState) : GameState).getInstance(); // 5. 打开首屏

          (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
            error: Error()
          }), UIManager) : UIManager).GetInstance().OpenPanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
            error: Error()
          }), UIID) : UIID).LoadingPanel);
        }
        /** 每帧更新，由 Launcher 调用 */


        Update(dt) {
          (_crd && TimerManager === void 0 ? (_reportPossibleCrUseOfTimerManager({
            error: Error()
          }), TimerManager) : TimerManager).getInstance().update(dt);
        }
        /** 每帧 LateUpdate，由 Launcher 调用 */


        LateUpdate(dt) {// 预留
        }
        /** 销毁所有子系统 */


        Destroy() {
          (_crd && TimerManager === void 0 ? (_reportPossibleCrUseOfTimerManager({
            error: Error()
          }), TimerManager) : TimerManager).getInstance().clear();
          (_crd && PoolManager === void 0 ? (_reportPossibleCrUseOfPoolManager({
            error: Error()
          }), PoolManager) : PoolManager).getInstance().clearAll();
          (_crd && AudioManager === void 0 ? (_reportPossibleCrUseOfAudioManager({
            error: Error()
          }), AudioManager) : AudioManager).getInstance().destroy();
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().clear();
          (_crd && ResManager === void 0 ? (_reportPossibleCrUseOfResManager({
            error: Error()
          }), ResManager) : ResManager).getInstance().releaseAll();
          this.m_Initialized = false;
        }
        /** 游戏进入后台 */


        PauseGame() {
          var state = (_crd && GameState === void 0 ? (_reportPossibleCrUseOfGameState({
            error: Error()
          }), GameState) : GameState).getInstance();
          state.isPaused = true;
          (_crd && AudioManager === void 0 ? (_reportPossibleCrUseOfAudioManager({
            error: Error()
          }), AudioManager) : AudioManager).getInstance().pauseBGM();
          (_crd && TimerManager === void 0 ? (_reportPossibleCrUseOfTimerManager({
            error: Error()
          }), TimerManager) : TimerManager).getInstance().pauseAll();
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().emit((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).GamePaused);
        }
        /** 游戏回到前台 */


        ResumeGame() {
          var state = (_crd && GameState === void 0 ? (_reportPossibleCrUseOfGameState({
            error: Error()
          }), GameState) : GameState).getInstance();
          state.isPaused = false;
          (_crd && AudioManager === void 0 ? (_reportPossibleCrUseOfAudioManager({
            error: Error()
          }), AudioManager) : AudioManager).getInstance().resumeBGM();
          (_crd && TimerManager === void 0 ? (_reportPossibleCrUseOfTimerManager({
            error: Error()
          }), TimerManager) : TimerManager).getInstance().resumeAll();
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().emit((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).GameResumed);
        }
        /** 获取游戏世界根节点 */


        getGameWorldRoot() {
          return this.m_GameWorldRoot;
        }

      }, _class2.m_Instance = null, _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=1b28ba24b291891dfd46a5e20d420a899bdf6eef.js.map