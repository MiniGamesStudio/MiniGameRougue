System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, ProgressBar, UIBase, UIManager, UIID, FrameworkConst, _dec, _dec2, _class, _class2, _descriptor, _crd, ccclass, property, LoadingPanel;

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
      ProgressBar = _cc.ProgressBar;
    }, function (_unresolved_2) {
      UIBase = _unresolved_2.UIBase;
    }, function (_unresolved_3) {
      UIManager = _unresolved_3.UIManager;
    }, function (_unresolved_4) {
      UIID = _unresolved_4.UIID;
    }, function (_unresolved_5) {
      FrameworkConst = _unresolved_5.FrameworkConst;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "48640ZlDGRKyZfQdLL1RKDV", "LoadingPanel", undefined);

      __checkObsolete__(['_decorator', 'ProgressBar']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("LoadingPanel", LoadingPanel = (_dec = ccclass('LoadingPanel'), _dec2 = property(ProgressBar), _dec(_class = (_class2 = class LoadingPanel extends (_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
        error: Error()
      }), UIBase) : UIBase) {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "m_Progress", _descriptor, this);

          this.m_TimeDelta = 0;
        }

        OnInit() {}

        OnOpen(...args) {
          this.m_TimeDelta = 0;
          this.m_Progress.progress = 0;
        }

        OnClose() {
          super.OnClose();
        }

        update(dt) {
          if (!this.m_Progress) return;
          this.m_TimeDelta += dt;
          this.m_Progress.progress = this.m_TimeDelta / (_crd && FrameworkConst === void 0 ? (_reportPossibleCrUseOfFrameworkConst({
            error: Error()
          }), FrameworkConst) : FrameworkConst).LOADING_DURATION;

          if (this.m_Progress.progress >= 1) {
            this.m_TimeDelta = 0;
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().ClosePanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).LoadingPanel);
            (_crd && UIManager === void 0 ? (_reportPossibleCrUseOfUIManager({
              error: Error()
            }), UIManager) : UIManager).GetInstance().OpenPanel((_crd && UIID === void 0 ? (_reportPossibleCrUseOfUIID({
              error: Error()
            }), UIID) : UIID).MainPanel);
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "m_Progress", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function () {
          return null;
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=9318910a7b43bd952d2abb6115a8d654f609dea1.js.map