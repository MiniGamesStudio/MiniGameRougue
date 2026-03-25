System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Button, instantiate, Node, Prefab, resources, tween, Vec3, view, UIBase, FrameworkConst, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, PageType, MainPanel;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfUIBase(extras) {
    _reporterNs.report("UIBase", "../Core/UIBase", _context.meta, extras);
  }

  function _reportPossibleCrUseOfFrameworkConst(extras) {
    _reporterNs.report("FrameworkConst", "../Config/GameConst", _context.meta, extras);
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
      Node = _cc.Node;
      Prefab = _cc.Prefab;
      resources = _cc.resources;
      tween = _cc.tween;
      Vec3 = _cc.Vec3;
      view = _cc.view;
    }, function (_unresolved_2) {
      UIBase = _unresolved_2.UIBase;
    }, function (_unresolved_3) {
      FrameworkConst = _unresolved_3.FrameworkConst;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "3fdc007f/1Pm7WvHL+IB1+z", "MainPanel", undefined);

      __checkObsolete__(['_decorator', 'Button', 'instantiate', 'Node', 'Prefab', 'resources', 'Tween', 'tween', 'Vec3', 'view']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("PageType", PageType = /*#__PURE__*/function (PageType) {
        PageType["ShopPage"] = "ShopPage";
        PageType["AchievePage"] = "AchievePage";
        PageType["GamePage"] = "GamePage";
        PageType["ChanllengePage"] = "ChallengePage";
        PageType["RankingPage"] = "RankingPage";
        return PageType;
      }({}));

      _export("MainPanel", MainPanel = (_dec = ccclass('MainPanel'), _dec2 = property([Button]), _dec3 = property(Node), _dec4 = property(Node), _dec5 = property(Node), _dec(_class = (_class2 = class MainPanel extends (_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
        error: Error()
      }), UIBase) : UIBase) {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "m_FuncBtns", _descriptor, this);

          _initializerDefineProperty(this, "m_PageOne", _descriptor2, this);

          _initializerDefineProperty(this, "m_PageTwo", _descriptor3, this);

          _initializerDefineProperty(this, "m_TopPageRoot", _descriptor4, this);

          this.m_CurPage = null;
          this.m_OtherPage = null;
          this.m_LastIndex = 2;
          this.m_IsScrollingPage = false;
          this.m_ScreenWidth = 0;
          this.m_CurTween = null;
          this.m_OtherTween = null;
          this.m_PageName = [];
        }

        OnInit() {}

        OnOpen() {
          this.m_PageName[0] = PageType.ShopPage;
          this.m_PageName[1] = PageType.AchievePage;
          this.m_PageName[2] = PageType.GamePage;
          this.m_PageName[3] = PageType.ChanllengePage;
          this.m_PageName[4] = PageType.RankingPage;
          this.AttachUIPage(this.m_TopPageRoot, 'TopPage', "ui/MainTopPage");
          this.initUI();
        }

        OnClose() {
          super.OnClose();
        }

        onDestroy() {
          if (this.m_CurTween) this.m_CurTween.stop();
          if (this.m_OtherTween) this.m_OtherTween.stop();
        }

        initUI() {
          var screenSize = view.getVisibleSize();
          this.m_ScreenWidth = screenSize.width;
          this.m_PageOne.setPosition(0, 0);
          var pageName = this.m_PageName[2];
          resources.load((_crd && FrameworkConst === void 0 ? (_reportPossibleCrUseOfFrameworkConst({
            error: Error()
          }), FrameworkConst) : FrameworkConst).RES_PATH.UI_PREFIX + pageName, Prefab, (err, prefab) => {
            if (err || !prefab) return;
            var tNode = instantiate(prefab);
            this.addPage(this.m_PageOne, tNode);
          });
          this.m_PageTwo.setPosition(this.m_ScreenWidth, 0);
          this.m_CurPage = this.m_PageOne;
          this.m_OtherPage = this.m_PageTwo;
          this.m_FuncBtns.forEach((button, index) => {
            this.SetBtnEvent(button, () => {
              if (index === this.m_LastIndex || this.m_IsScrollingPage) return;
              this.m_IsScrollingPage = true;
              var size = view.getVisibleSize();
              this.m_ScreenWidth = size.width;
              var moveDis = 0;

              if (this.m_LastIndex < index) {
                this.m_OtherPage.setPosition(this.m_ScreenWidth, 0);
                moveDis = -this.m_ScreenWidth;
              } else {
                this.m_OtherPage.setPosition(-this.m_ScreenWidth, 0);
                moveDis = this.m_ScreenWidth;
              }

              this.m_LastIndex = index;
              var pName = this.m_PageName[index];
              resources.load((_crd && FrameworkConst === void 0 ? (_reportPossibleCrUseOfFrameworkConst({
                error: Error()
              }), FrameworkConst) : FrameworkConst).RES_PATH.UI_PREFIX + pName, Prefab, (err, prefab) => {
                if (err || !prefab) return;
                var tNode = instantiate(prefab);
                this.addPage(this.m_OtherPage, tNode);
                this.m_OtherTween = tween(this.m_OtherPage).by((_crd && FrameworkConst === void 0 ? (_reportPossibleCrUseOfFrameworkConst({
                  error: Error()
                }), FrameworkConst) : FrameworkConst).PAGE_SCROLL_DURATION, {
                  position: new Vec3(moveDis, 0, 0)
                }).start();
                this.m_CurTween = tween(this.m_CurPage).by((_crd && FrameworkConst === void 0 ? (_reportPossibleCrUseOfFrameworkConst({
                  error: Error()
                }), FrameworkConst) : FrameworkConst).PAGE_SCROLL_DURATION, {
                  position: new Vec3(moveDis, 0, 0)
                }).call(() => {
                  var temp = this.m_CurPage;
                  this.m_CurPage = this.m_OtherPage;
                  this.m_OtherPage = temp;
                  this.m_IsScrollingPage = false;
                }).start();
              });
            });
          });
        }

        addPage(root, uiNode) {
          if (!root || !uiNode) return;
          root.children.forEach(node => {
            if (node) {
              var pageScript = node.getComponent(_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
                error: Error()
              }), UIBase) : UIBase);
              if (pageScript) pageScript.OnClose();
              node.removeFromParent();
              node.destroy();
            }
          });
          var pScript = uiNode.getComponent(_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
            error: Error()
          }), UIBase) : UIBase);
          if (pScript) pScript.OnOpen();
          root.addChild(uiNode);
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "m_FuncBtns", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return [];
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "m_PageOne", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "m_PageTwo", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "m_TopPageRoot", [_dec5], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=f04001876c2cf6efe0483ee782f1e8f0501b0a31.js.map