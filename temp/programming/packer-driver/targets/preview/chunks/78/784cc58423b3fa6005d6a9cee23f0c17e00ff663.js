System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, _dec, _class, _class2, _crd, ccclass, property, EventManager;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "e40803HO8NGoLzZLcBcDPRg", "EventManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("EventManager", EventManager = (_dec = ccclass('EventManager'), _dec(_class = (_class2 = class EventManager extends Component {
        constructor() {
          super(...arguments);
          this._events = new Map();
        }

        static getInstance() {
          if (!this._instance) {
            this._instance = new EventManager();
          }

          return this._instance;
        }

        on(eventName, callback, target) {
          if (!this._events.has(eventName)) {
            this._events.set(eventName, []);
          }

          this._events.get(eventName).push({
            callback,
            target
          });
        }

        off(eventName, callback, target) {
          var handlers = this._events.get(eventName);

          if (handlers) {
            for (var i = handlers.length - 1; i >= 0; i--) {
              if (handlers[i].callback === callback && handlers[i].target === target) {
                handlers.splice(i, 1);
              }
            }
          }
        }

        emit(eventName, data) {
          var handlers = this._events.get(eventName);

          if (handlers) {
            handlers.forEach(handler => {
              handler.callback.call(handler.target, data);
            });
          }
        }

      }, _class2._instance = void 0, _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=784cc58423b3fa6005d6a9cee23f0c17e00ff663.js.map