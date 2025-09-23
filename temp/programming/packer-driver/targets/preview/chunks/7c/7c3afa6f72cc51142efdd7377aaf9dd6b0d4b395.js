System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Button, instantiate, JsonAsset, Node, Prefab, resources, UIBase, UIManager, UIID, FlowerPlatform, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, GamePanel;

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
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "m_CloseBtn", _descriptor, this);

          _initializerDefineProperty(this, "m_LevelRoot", _descriptor2, this);

          _initializerDefineProperty(this, "m_FlowerImgMoveRoot", _descriptor3, this);

          _initializerDefineProperty(this, "m_LevelData", _descriptor4, this);
        }

        onOpen() {
          this.initUI();
        }

        onClose() {}

        initUI() {
          this.m_CloseBtn.node.on('click', () => {
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().ClosePanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).GamePanel);
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().OpenPanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).MainPanel);
          });
          this.initGameLevel();
        }

        initGameLevel() {
          resources.load("levelData/level_1", JsonAsset, (err, jsonAsset) => {
            if (err) {
              return;
            }

            var levelData = jsonAsset.json;
            resources.load("ui/FlowerPlatform", Prefab, (err, prefab) => {
              if (prefab) {
                (_crd && FlowerPlatform === void 0 ? (_reportPossibleCrUseOfFlowerPlatform({
                  error: Error()
                }), FlowerPlatform) : FlowerPlatform).s_FlowerPotTag = 0;

                for (var i = 0; i < levelData.FlowerRow; ++i) {
                  var temp = instantiate(prefab);

                  if (temp) {
                    this.m_LevelRoot.addChild(temp);
                    var tScript = temp.getComponent(_crd && FlowerPlatform === void 0 ? (_reportPossibleCrUseOfFlowerPlatform({
                      error: Error()
                    }), FlowerPlatform) : FlowerPlatform);

                    if (tScript) {
                      tScript.InitPlatForm(i, levelData.FlowerPlatform[i], levelData, this.m_FlowerImgMoveRoot);
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
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "m_LevelRoot", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "m_FlowerImgMoveRoot", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "m_LevelData", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=7c3afa6f72cc51142efdd7377aaf9dd6b0d4b395.js.map