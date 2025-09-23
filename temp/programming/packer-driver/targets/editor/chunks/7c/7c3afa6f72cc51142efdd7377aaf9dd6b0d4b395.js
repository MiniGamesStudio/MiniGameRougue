System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4", "__unresolved_5", "__unresolved_6"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Button, instantiate, JsonAsset, Node, Prefab, resources, UIBase, UIManager, UIID, FlowerPlatform, EventManager, CustomClientEvent, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, GamePanel;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfUIBase(extras) {
    _reporterNs.report("UIBase", "../Core/UIBase", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIManager(extras) {
    _reporterNs.report("UIManager", "../Core/UIManager", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIID(extras) {
    _reporterNs.report("UIID", "./UIData", _context.meta, extras);
  }

  function _reportPossibleCrUseOfFlowerPlatform(extras) {
    _reporterNs.report("FlowerPlatform", "./FlowerPlatform", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventManager(extras) {
    _reporterNs.report("EventManager", "../Core/EventManager", _context.meta, extras);
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
      Button = _cc.Button;
      instantiate = _cc.instantiate;
      JsonAsset = _cc.JsonAsset;
      Node = _cc.Node;
      Prefab = _cc.Prefab;
      resources = _cc.resources;
    }, function (_unresolved_2) {
      UIBase = _unresolved_2.UIBase;
    }, function (_unresolved_3) {
      UIManager = _unresolved_3.UIManager;
    }, function (_unresolved_4) {
      UIID = _unresolved_4.UIID;
    }, function (_unresolved_5) {
      FlowerPlatform = _unresolved_5.FlowerPlatform;
    }, function (_unresolved_6) {
      EventManager = _unresolved_6.EventManager;
    }, function (_unresolved_7) {
      CustomClientEvent = _unresolved_7.CustomClientEvent;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "ea5e5mJV7VOVr7BGYii9KiJ", "GamePanel", undefined);

      __checkObsolete__(['__private', '_decorator', 'Button', 'Component', 'instantiate', 'JsonAsset', 'Layout', 'Node', 'PageView', 'Prefab', 'ProgressBar', 'resources', 'Slider', 'SpriteFrame', 'UITransform']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("GamePanel", GamePanel = (_dec = ccclass('GamePanel'), _dec2 = property(Button), _dec3 = property(Node), _dec4 = property(Node), _dec5 = property([]), _dec(_class = (_class2 = class GamePanel extends (_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
        error: Error()
      }), UIBase) : UIBase) {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "m_CloseBtn", _descriptor, this);

          _initializerDefineProperty(this, "m_LevelRoot", _descriptor2, this);

          _initializerDefineProperty(this, "m_FlowerImgMoveRoot", _descriptor3, this);

          _initializerDefineProperty(this, "m_LevelData", _descriptor4, this);

          this.m_FlowerPlatformArr = null;
          this.m_CurLevelData = null;
          this.m_CurLv = 1;
        }

        onOpen(...args) {
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().on((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).FlowerDissolve, this.onCheckFlowerDissolve, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().on((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).CheckVictory, this.onCheckVictory, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().on((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).RetryLevel, this.onRetryLevel, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().on((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).NextLevel, this.onNextLevel, this);
          this.initUI();
        }

        onClose() {
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().off((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).FlowerDissolve, this.onCheckFlowerDissolve, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().off((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).CheckVictory, this.onCheckVictory, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().off((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).RetryLevel, this.onRetryLevel, this);
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().off((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).NextLevel, this.onNextLevel, this);
        }

        onNextLevel() {
          this.initGameLevel(this.m_CurLv + 1);
        }

        onRetryLevel() {
          this.initGameLevel(this.m_CurLv);
        }

        onCheckFlowerDissolve(args) {
          if (this.m_FlowerPlatformArr && this.m_FlowerPlatformArr.length > 0) {
            this.m_FlowerPlatformArr.forEach(fPlatform => {
              fPlatform.checkFlowerDissolve(args);
            });
          }
        }

        onCheckVictory(args) {
          //console.log("onCheckVictory 1");
          if (!this.m_CurLevelData) {
            return;
          }

          var vCount = 0;
          this.m_FlowerPlatformArr.forEach(fPlatform => {
            if (!fPlatform) {
              return;
            }

            var temp = fPlatform.isVictory();

            if (temp) {
              vCount += 1;
            }
          }); //console.log("onCheckVictory 2 vCount = " + vCount);

          if (vCount == this.m_FlowerPlatformArr.length) {
            //Victory
            //console.log("onCheckVictory VictoryPanel");
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().OpenPanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).VictoryPanel, true);
          }
        }

        initUI() {
          this.m_CloseBtn.node.on('click', () => {
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().ClosePanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).VictoryPanel);
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().OpenPanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).VictoryPanel);
          });
          this.initGameLevel(this.m_CurLv);
        }

        initGameLevel(level) {
          this.m_CurLv = level;
          resources.load("levelData/level_" + level, JsonAsset, (err, jsonAsset) => {
            if (err) {
              return;
            }

            this.m_CurLevelData = jsonAsset.json;
            this.m_LevelRoot.removeAllChildren();
            resources.load("ui/FlowerPlatform", Prefab, (err, prefab) => {
              if (prefab) {
                (_crd && FlowerPlatform === void 0 ? (_reportPossibleCrUseOfFlowerPlatform({
                  error: Error()
                }), FlowerPlatform) : FlowerPlatform).s_FlowerPotTag = 0;
                this.m_FlowerPlatformArr = [];

                for (var i = 0; i < this.m_CurLevelData.FlowerRow; ++i) {
                  var temp = instantiate(prefab);

                  if (temp) {
                    this.m_LevelRoot.addChild(temp);
                    var tScript = temp.getComponent(_crd && FlowerPlatform === void 0 ? (_reportPossibleCrUseOfFlowerPlatform({
                      error: Error()
                    }), FlowerPlatform) : FlowerPlatform);

                    if (tScript) {
                      tScript.InitPlatForm(i, this.m_CurLevelData.FlowerPlatform[i], this.m_CurLevelData, this.m_FlowerImgMoveRoot);
                      this.m_FlowerPlatformArr.push(tScript);
                    }
                  }
                }
              }
            });
          });
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "m_CloseBtn", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "m_LevelRoot", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "m_FlowerImgMoveRoot", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "m_LevelData", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return [];
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7c3afa6f72cc51142efdd7377aaf9dd6b0d4b395.js.map