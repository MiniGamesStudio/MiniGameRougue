System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, BoxCollider2D, Component, instantiate, Node, resources, Sprite, SpriteFrame, tween, UITransform, Vec3, Flower, CustomClientEvent, EventManager, _dec, _dec2, _class, _class2, _descriptor, _class3, _crd, ccclass, property, FlowerName, FlowerPlatform;

  function _initializerDefineProperty(target, property, descriptor, context) { if (!descriptor) return; Object.defineProperty(target, property, { enumerable: descriptor.enumerable, configurable: descriptor.configurable, writable: descriptor.writable, value: descriptor.initializer ? descriptor.initializer.call(context) : void 0 }); }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) { var desc = {}; Object.keys(descriptor).forEach(function (key) { desc[key] = descriptor[key]; }); desc.enumerable = !!desc.enumerable; desc.configurable = !!desc.configurable; if ('value' in desc || desc.initializer) { desc.writable = true; } desc = decorators.slice().reverse().reduce(function (desc, decorator) { return decorator(target, property, desc) || desc; }, desc); if (context && desc.initializer !== void 0) { desc.value = desc.initializer ? desc.initializer.call(context) : void 0; desc.initializer = undefined; } if (desc.initializer === void 0) { Object.defineProperty(target, property, desc); desc = null; } return desc; }

  function _initializerWarningHelper(descriptor, context) { throw new Error('Decorating class property failed. Please ensure that ' + 'transform-class-properties is enabled and runs after the decorators transform.'); }

  function _reportPossibleCrUseOfFlower(extras) {
    _reporterNs.report("Flower", "./Flower", _context.meta, extras);
  }

  function _reportPossibleCrUseOfCustomClientEvent(extras) {
    _reporterNs.report("CustomClientEvent", "../Config/Config", _context.meta, extras);
  }

  function _reportPossibleCrUseOfEventManager(extras) {
    _reporterNs.report("EventManager", "../Core/EventManager", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      BoxCollider2D = _cc.BoxCollider2D;
      Component = _cc.Component;
      instantiate = _cc.instantiate;
      Node = _cc.Node;
      resources = _cc.resources;
      Sprite = _cc.Sprite;
      SpriteFrame = _cc.SpriteFrame;
      tween = _cc.tween;
      UITransform = _cc.UITransform;
      Vec3 = _cc.Vec3;
    }, function (_unresolved_2) {
      Flower = _unresolved_2.Flower;
    }, function (_unresolved_3) {
      CustomClientEvent = _unresolved_3.CustomClientEvent;
    }, function (_unresolved_4) {
      EventManager = _unresolved_4.EventManager;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "1d91754ySdJrYQYeh4eXucR", "FlowerPlatform", undefined);

      __checkObsolete__(['_decorator', 'BoxCollider2D', 'Camera', 'Component', 'director', 'EventTouch', 'Input', 'input', 'instantiate', 'Node', 'resources', 'Scene', 'Sprite', 'SpriteFrame', 'sys', 'tween', 'UIOpacity', 'UITransform', 'Vec2', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("FlowerName", FlowerName = /*#__PURE__*/function (FlowerName) {
        FlowerName["FlowerLeft"] = "FlowerLeft";
        FlowerName["FlowerRight"] = "FlowerRight";
        FlowerName["FlowerMid"] = "FlowerMid";
        return FlowerName;
      }({}));

      _export("FlowerPlatform", FlowerPlatform = (_dec = ccclass('FlowerPlatform'), _dec2 = property(Node), _dec(_class = (_class2 = (_class3 = class FlowerPlatform extends Component {
        constructor(...args) {
          super(...args);

          _initializerDefineProperty(this, "m_PlatFormRoot", _descriptor, this);

          this.m_RotationLeft = new Vec3(0, 0, 30);
          this.m_RotationRight = new Vec3(0, 0, -30);
          this.m_FlowerMoveRoot = null;
          this.m_FlowerPotMap = new Map();
        }

        start() {
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().on((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).FlowerDissolve, this.onCheckFlowerDissolve, this);
        }

        onDestroy() {
          (_crd && EventManager === void 0 ? (_reportPossibleCrUseOfEventManager({
            error: Error()
          }), EventManager) : EventManager).getInstance().off((_crd && CustomClientEvent === void 0 ? (_reportPossibleCrUseOfCustomClientEvent({
            error: Error()
          }), CustomClientEvent) : CustomClientEvent).FlowerDissolve, this.onCheckFlowerDissolve, this);
        }

        onCheckFlowerDissolve(args) {
          console.log("onCheckFlowerDissolve");

          if (!args) {
            return;
          }

          var flowerTag = args;
          var flowerpot = this.m_FlowerPotMap.get(flowerTag);

          if (!flowerpot) {
            return;
          }

          var flowerRoot = flowerpot.getChildByName("FlowerRootLight");
          var flowers = flowerRoot.getComponentsInChildren(_crd && Flower === void 0 ? (_reportPossibleCrUseOfFlower({
            error: Error()
          }), Flower) : Flower);

          if (!flowers) {
            return;
          }

          if (flowers.length < 3) {
            return;
          }

          var isSame = true;
          var tempFlowerTag = "";

          for (var i = 0; i < flowers.length; ++i) {
            var flower = flowers[i];

            if (flower) {
              var temp = flower.getFlowerID();

              if (tempFlowerTag == "") {
                tempFlowerTag = temp;
              } else if (tempFlowerTag != temp) {
                isSame = false;
                break;
              }
            }
          }

          if (isSame) {
            for (var i = 0; i < flowers.length; ++i) {
              var flowerNode = flowers[i].node;

              if (flowerNode) {
                tween(flowerNode).to(0.3, {
                  angle: 0
                }, {
                  onComplete: target => {
                    if (target) {
                      target.removeFromParent();
                      target.destroy();
                    }
                  }
                }).start();
              }
            }
          }
        }

        InitPlatForm(raw, platFormNum, data, flowerMoveRoot) {
          this.m_FlowerPotMap.clear();
          this.m_FlowerMoveRoot = flowerMoveRoot;

          if (data) {
            this.m_PlatFormRoot.active = false;

            for (var i = 0; i < platFormNum; ++i) {
              var platFormRootClone = instantiate(this.m_PlatFormRoot);

              if (platFormRootClone) {
                var fpNum = data.FlowerPot[raw];

                if (platFormNum > 1) {
                  fpNum = data.FlowerPot[raw][i];
                }

                this.InitFlowerPot(fpNum, data.FlowerArr[raw][i], platFormRootClone);
                platFormRootClone.active = true;
                this.node.addChild(platFormRootClone);
              }
            }
          }
        }

        InitFlowerPot(flowerPotNum, data, platFormRootClone) {
          if (data) {
            var flowerPotRoot = platFormRootClone.getChildByName("FlowerPotRoot");
            var flowerPotLayout = flowerPotRoot.getChildByName("FlowerPotLayout");

            if (flowerPotLayout) {
              flowerPotLayout.active = false;

              for (var i = 0; i < flowerPotNum; ++i) {
                var flowerPotLayoutClone = instantiate(flowerPotLayout);

                if (flowerPotLayoutClone) {
                  var collider = flowerPotLayoutClone.getComponent(BoxCollider2D);

                  if (collider) {
                    FlowerPlatform.s_FlowerPotTag += 1;
                    collider.tag = FlowerPlatform.s_FlowerPotTag;
                  }

                  this.m_FlowerPotMap.set(collider.tag, flowerPotLayoutClone);
                  this.InitFlowers(collider.tag, data[i], flowerPotLayoutClone);
                  flowerPotLayoutClone.active = true;
                  flowerPotRoot.addChild(flowerPotLayoutClone);
                }
              }
            }

            var platFormUITrans = platFormRootClone.getChildByName("Platform").getComponent(UITransform);

            if (platFormUITrans) {
              var cSize = platFormUITrans.contentSize;
              platFormUITrans.setContentSize(cSize.width * flowerPotNum, cSize.height);
            }
          }
        }

        InitFlowers(tag, data, flowerPotLayoutClone) {
          if (flowerPotLayoutClone) {
            var flowerRootBlack = flowerPotLayoutClone.getChildByName("FlowerRootBlack");

            if (data.length >= 1) {
              this.setFlowerData(flowerRootBlack, tag, data[1]);
            }

            flowerRootBlack.active = false;
            var flowerRootLight = flowerPotLayoutClone.getChildByName("FlowerRootLight");
            this.setFlowerData(flowerRootLight, tag, data[0]);
          }
        }

        setFlowerData(flowerRoot, tag, data = null) {
          if (flowerRoot == null) {
            return;
          }

          flowerRoot.active = false;
          var left = flowerRoot.getChildByName("Left");

          if (data && data.left) {
            left.active = true;
            this.setImg(left, data.left, -1, tag);
          } else {
            left.active = false;
          }

          var mid = flowerRoot.getChildByName("Mid");

          if (data && data.mid) {
            mid.active = true;
            this.setImg(mid, data.mid, 0, tag);
          } else {
            mid.active = false;
          }

          var right = flowerRoot.getChildByName("Right");

          if (data && data.right) {
            right.active = true;
            this.setImg(right, data.right, 1, tag);
          } else {
            right.active = false;
          }

          flowerRoot.active = true;
        } //imgPos: 0-中间 1-右边 -1-左边


        setImg(root, imgId, imgPos, tag) {
          var img = null;

          if (root == null || root == undefined) {
            return;
          }

          if (imgId == null || imgId == undefined) {
            root.active = false;
            return;
          }

          root.removeAllChildren();
          var imgNode = new Node();

          if (imgNode) {
            imgNode.name = "FlowerImgMid";

            if (imgPos == -1) {
              imgNode.name = "FlowerImgLeft";
              imgNode.setRotationFromEuler(this.m_RotationLeft);
            } else if (imgPos == 1) {
              imgNode.name = "FlowerImgRight";
              imgNode.setRotationFromEuler(this.m_RotationRight);
            }

            imgNode.active = false;
            var uiTrans = imgNode.getComponent(UITransform);

            if (uiTrans == null || uiTrans == undefined) {
              uiTrans = imgNode.addComponent(UITransform);
            }

            if (uiTrans) {
              uiTrans.setAnchorPoint(0.5, 0);
            }

            img = imgNode.addComponent(Sprite);

            if (img) {
              if (imgId != "") {
                resources.load("flowers/" + imgId + "/spriteFrame", SpriteFrame, (err, sp) => {
                  if (sp) {
                    img.spriteFrame = sp;
                  }

                  var flowerScript = imgNode.getComponent(_crd && Flower === void 0 ? (_reportPossibleCrUseOfFlower({
                    error: Error()
                  }), Flower) : Flower);

                  if (flowerScript == null || flowerScript == undefined) {
                    flowerScript = imgNode.addComponent(_crd && Flower === void 0 ? (_reportPossibleCrUseOfFlower({
                      error: Error()
                    }), Flower) : Flower);
                  }

                  flowerScript.init(imgId, root, this.m_FlowerMoveRoot, imgPos, this.m_RotationLeft, this.m_RotationRight, tag);
                  imgNode.active = true;
                });
              }
            }

            root.addChild(imgNode);
          }
        }

      }, _class3.s_FlowerPotTag = 0, _class3), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "m_PlatFormRoot", [_dec2], {
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
//# sourceMappingURL=c49cca4f2e70ea229467afa8ec4c50f60abd4fc4.js.map