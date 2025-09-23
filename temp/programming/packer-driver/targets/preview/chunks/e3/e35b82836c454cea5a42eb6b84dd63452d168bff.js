System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Camera, Component, director, Node, game, Game, PhysicsSystem2D, EPhysics2DDrawFlags, ScreenAdapter, GameManager, _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _crd, ccclass, property, Launcher;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfScreenAdapter(extras) {
    _reporterNs.report("ScreenAdapter", "./ScreenAdapter", _context.meta, extras);
  }

  function _reportPossibleCrUseOfGameManager(extras) {
    _reporterNs.report("GameManager", "./Core/GameManager", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Camera = _cc.Camera;
      Component = _cc.Component;
      director = _cc.director;
      Node = _cc.Node;
      game = _cc.game;
      Game = _cc.Game;
      PhysicsSystem2D = _cc.PhysicsSystem2D;
      EPhysics2DDrawFlags = _cc.EPhysics2DDrawFlags;
    }, function (_unresolved_2) {
      ScreenAdapter = _unresolved_2.ScreenAdapter;
    }, function (_unresolved_3) {
      GameManager = _unresolved_3.GameManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "6bd47OpuIVM960Z9ICYXtwO", "Launcher", undefined);

      __checkObsolete__(['_decorator', 'Camera', 'Component', 'director', 'instantiate', 'Node', 'resources', 'Sprite', 'SpriteFrame', 'Vec2', 'game', 'Game', 'PhysicsSystem2D', 'EPhysics2DDrawFlags']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("Launcher", Launcher = (_dec = ccclass('Launcher'), _dec2 = property(_crd && ScreenAdapter === void 0 ? (_reportPossibleCrUseOfScreenAdapter({
        error: Error()
      }), ScreenAdapter) : ScreenAdapter), _dec3 = property(Camera), _dec4 = property(Node), _dec5 = property(Node), _dec(_class = (_class2 = class Launcher extends Component {
        constructor() {
          super(...arguments);

          _initializerDefineProperty(this, "m_ScreenAdapter", _descriptor, this);

          _initializerDefineProperty(this, "m_Camera", _descriptor2, this);

          _initializerDefineProperty(this, "m_UIRoot", _descriptor3, this);

          _initializerDefineProperty(this, "m_GameWorld", _descriptor4, this);
        }

        onLoad() {
          PhysicsSystem2D.instance.enable = true;
          PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb | EPhysics2DDrawFlags.Pair | EPhysics2DDrawFlags.CenterOfMass | EPhysics2DDrawFlags.Joint | EPhysics2DDrawFlags.Shape;
          director.addPersistRootNode(this.node); // 监听游戏进入后台事件

          game.on(Game.EVENT_HIDE, this.onGameHide, this); // 监听游戏回到前台事件

          game.on(Game.EVENT_SHOW, this.onGameShow, this);
          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().Init(this.m_GameWorld, this.m_UIRoot);
        }

        start() {}

        update(dt) {
          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().Update(dt);
        }

        lateUpdate(dt) {
          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().LateUpdate(dt);
        }

        onDestroy() {
          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().Destory();
        }

        onGameHide() {
          console.log('游戏进入后台'); // 处理游戏进入后台的逻辑，例如暂停游戏、暂停音频等

          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().PauseGame();
        }

        onGameShow() {
          console.log('游戏回到前台'); // 处理游戏回到前台的逻辑，例如恢复游戏、恢复音频等

          (_crd && GameManager === void 0 ? (_reportPossibleCrUseOfGameManager({
            error: Error()
          }), GameManager) : GameManager).GetInstance().ResumeGame();
        }

      }, (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "m_ScreenAdapter", [_dec2], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "m_Camera", [_dec3], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "m_UIRoot", [_dec4], {
        configurable: true,
        enumerable: true,
        writable: true,
        initializer: function initializer() {
          return null;
        }
      }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "m_GameWorld", [_dec5], {
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
//# sourceMappingURL=e35b82836c454cea5a42eb6b84dd63452d168bff.js.map