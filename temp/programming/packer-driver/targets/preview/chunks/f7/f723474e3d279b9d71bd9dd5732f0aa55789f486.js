System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, view, Size, _dec, _dec2, _class, _class2, _descriptor, _crd, ccclass, property, ScreenAdapter;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
      view = _cc.view;
      Size = _cc.Size;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "43b48kQNLVFYqRtvDjY9Y7t", "ScreenAdapter", undefined);

      __checkObsolete__(['_decorator', 'Component', 'view', 'Size']);

      ({
        ccclass,
        property
      } = _decorator);
      /**
       * 屏幕适配组件 — 根据屏幕比例动态选择适配策略
       */

      _export("ScreenAdapter", ScreenAdapter = (_dec = ccclass('ScreenAdapter'), _dec2 = property(Size), _dec(_class = (_class2 = class ScreenAdapter extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "designResolution", _descriptor, this);
        }

        onLoad() {
          this.adjustScreen();
          view.on('resize', this.adjustScreen, this);
        }

        onDestroy() {
          view.off('resize', this.adjustScreen, this);
        }

        adjustScreen() {
          var canvas = this.node.getComponent('cc.Canvas');
          if (!canvas) return;
          var screenSize = view.getVisibleSize();
          var designRatio = this.designResolution.width / this.designResolution.height;
          var screenRatio = screenSize.width / screenSize.height;

          if (screenRatio >= designRatio) {
            // 屏幕更宽或相同 -> 固定高度
            canvas.fitHeight = true;
            canvas.fitWidth = false;
          } else {
            // 屏幕更窄 -> 固定宽度
            canvas.fitHeight = false;
            canvas.fitWidth = true;
          }
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "designResolution", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return new Size(0, 0);
        }
      })), _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=f723474e3d279b9d71bd9dd5732f0aa55789f486.js.map