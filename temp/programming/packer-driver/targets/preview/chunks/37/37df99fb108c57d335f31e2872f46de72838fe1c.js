System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, BoxCollider2D, Component, Contact2DType, Node, tween, UITransform, Vec2, Vec3, _dec, _class, _crd, ccclass, property, Flower;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      BoxCollider2D = _cc.BoxCollider2D;
      Component = _cc.Component;
      Contact2DType = _cc.Contact2DType;
      Node = _cc.Node;
      tween = _cc.tween;
      UITransform = _cc.UITransform;
      Vec2 = _cc.Vec2;
      Vec3 = _cc.Vec3;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "c5053iqd3hKyZKZviDDVrit", "Flower", undefined);

      __checkObsolete__(['_decorator', 'BoxCollider2D', 'Collider2D', 'Component', 'Contact2DType', 'EPhysics2DDrawFlags', 'EventTouch', 'IPhysics2DContact', 'Node', 'PhysicsSystem2D', 'RigidBody2D', 'tween', 'UITransform', 'Vec2', 'Vec3']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("Flower", Flower = (_dec = ccclass('Flower'), _dec(_class = class Flower extends Component {
        constructor() {
          super(...arguments);
          this.m_FlowerFlySpeed = 1000;
          this.m_FlowerStartPos = Vec3.ZERO;
          this.m_RotationLeft = Vec3.ZERO;
          this.m_RotationRight = Vec3.ZERO;
          this.m_FlowerUITransform = null;
          this.m_FlowerRoot = null;
          this.m_FlowerMoveRoot = null;
          this.m_FlowerMoveRootUIT = null;
          this.m_FlowerMoveOffsetY = 0;
          this.m_IsDragingFlower = false;
          this.m_ImgPos = 0;
          this.m_IsFlowerDoAni = false;
          this.m_BoxCollider2D = null;
          this.m_RigidBody2D = null;
          this.m_FlowerTag = 0;
          this.m_IsChangePot = false;
          this.m_TempImgPos = 1;
          this.m_TempFlowerStartPos = Vec3.ZERO;
          this.m_TempFlowerRoot = null;
          this.m_TempFlowerTag = 0;
        }

        //imgPos: 0-中间 1-右边 -1-左边
        init(flowerRoot, flowerMoveRoot, imgPos, rLeft, rRight, tag) {
          this.m_FlowerTag = tag;
          this.m_IsDragingFlower = false;
          this.m_FlowerRoot = flowerRoot;
          this.m_FlowerMoveRoot = flowerMoveRoot;

          if (this.m_FlowerMoveRoot) {
            this.m_FlowerMoveRootUIT = this.m_FlowerMoveRoot.getComponent(UITransform);
          }

          this.m_ImgPos = imgPos;
          this.m_RotationLeft = rLeft;
          this.m_RotationRight = rRight;
        }

        start() {
          this.m_FlowerUITransform = this.node.getComponent(UITransform);
          this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this, true);
          this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, true);
          this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
          this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this, true);
        }

        onDestroy() {
          this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
          this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
          this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
          this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        }

        onBeginContact(selfCollider, otherCollider, contact) {
          // 只在两个碰撞体开始接触时被调用一次
          console.log('onBeginContact');

          if (otherCollider) {
            if (this.m_FlowerTag == otherCollider.tag) {
              return;
            }

            var light = otherCollider.node.getChildByName("FlowerRootLight");

            if (light) {
              var left = light.getChildByName("Left");

              if (left.children.length <= 0) {
                this.m_IsChangePot = true;
                this.m_TempImgPos = -1;
                this.m_TempFlowerStartPos = left.getWorldPosition();
                this.m_TempFlowerRoot = left;
                this.m_TempFlowerTag = otherCollider.tag;
              }

              var right = light.getChildByName("Right");

              if (right.children.length <= 0) {
                this.m_IsChangePot = true;
                this.m_TempImgPos = 1;
                this.m_TempFlowerStartPos = right.getWorldPosition();
                this.m_TempFlowerRoot = right;
                this.m_TempFlowerTag = otherCollider.tag;
              }

              var mid = light.getChildByName("Mid");

              if (mid.children.length <= 0) {
                this.m_IsChangePot = true;
                this.m_TempImgPos = 0;
                this.m_TempFlowerStartPos = mid.getWorldPosition();
                this.m_TempFlowerRoot = mid;
                this.m_TempFlowerTag = otherCollider.tag;
              }
            }
          }
        }

        onEndContact(selfCollider, otherCollider, contact) {
          // 只在两个碰撞体结束接触时被调用一次
          console.log('onEndContact');
          this.m_IsChangePot = false;
        }

        onTouchStart(event) {
          if (this.m_IsDragingFlower || this.m_IsFlowerDoAni) {
            return;
          }

          if (event.target) {}
        }

        onTouchMove(event) {
          if (this.m_IsDragingFlower == false && event.target) {
            this.m_IsDragingFlower = true;
            this.m_FlowerMoveOffsetY = event.target.getComponent(UITransform).contentSize.height * 0.6;
            event.target.parent = this.m_FlowerMoveRoot;
            this.m_FlowerStartPos = this.m_FlowerRoot.getWorldPosition();
            var touchPos = event.touch.getUILocation();
            var flowerStartPos = this.m_FlowerMoveRootUIT.convertToNodeSpaceAR(new Vec3(touchPos.x, touchPos.y, 0));
            event.target.setPosition(flowerStartPos.x, flowerStartPos.y - this.m_FlowerMoveOffsetY);
            event.target.setRotationFromEuler(new Vec3(0, 0, 0));
            this.m_BoxCollider2D = this.node.getComponent(BoxCollider2D);

            if (this.m_BoxCollider2D == null || this.m_BoxCollider2D == undefined) {
              this.m_BoxCollider2D = this.node.addComponent(BoxCollider2D);
              this.m_BoxCollider2D.sensor = true;
              this.m_BoxCollider2D.size = this.m_FlowerUITransform.contentSize;
              this.m_BoxCollider2D.offset = new Vec2(0, this.m_FlowerUITransform.contentSize.y / 2);
              this.m_BoxCollider2D.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
              this.m_BoxCollider2D.on(Contact2DType.END_CONTACT, this.onEndContact, this);
              this.m_BoxCollider2D.enabled = false;
              this.m_BoxCollider2D.enabled = true;
            }
          }

          if (!this.m_IsDragingFlower || this.m_IsFlowerDoAni) {
            return;
          }

          if (event.target) {
            var delta = event.getUIDelta(); // 移动花朵节点

            var pos = event.target.position;
            event.target.setPosition(pos.x + delta.x, pos.y + delta.y);
          }
        }

        onTouchEnd(event) {
          if (!this.m_IsDragingFlower || this.m_IsFlowerDoAni) {
            return;
          }

          if (event.target) {
            if (this.m_IsChangePot) {
              this.m_IsChangePot = false;
              this.m_ImgPos = this.m_TempImgPos;
              this.m_FlowerStartPos = this.m_TempFlowerStartPos;
              this.m_FlowerRoot = this.m_TempFlowerRoot;
              this.m_FlowerTag = this.m_TempFlowerTag;
            }

            var flowerEndPos = event.target.getWorldPosition();
            this.m_IsFlowerDoAni = true;
            var temp = Math.abs(this.m_FlowerStartPos.x - flowerEndPos.x) + Math.abs(this.m_FlowerStartPos.y - flowerEndPos.y);
            this.m_FlowerStartPos.subtract(flowerEndPos);
            tween(event.target).by(temp / this.m_FlowerFlySpeed, {
              position: this.m_FlowerStartPos
            }).call(() => {
              this.m_IsFlowerDoAni = false;
              this.m_IsDragingFlower = false;
              this.node.setRotationFromEuler(Vec3.ZERO);

              if (this.m_ImgPos == -1) {
                this.node.setRotationFromEuler(this.m_RotationLeft);
              } else if (this.m_ImgPos == 1) {
                this.node.setRotationFromEuler(this.m_RotationRight);
              }

              this.node.parent = this.m_FlowerRoot;
              this.node.setPosition(Vec3.ZERO);
              this.m_FlowerRoot.active = true;
            }).start();
          } else {
            this.m_IsDragingFlower = false;
          }

          if (this.m_BoxCollider2D) {
            this.m_BoxCollider2D.destroy();
            this.m_BoxCollider2D = null;
          }
        }

        onTouchCancel(event) {
          this.onTouchEnd(event);
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=37df99fb108c57d335f31e2872f46de72838fe1c.js.map