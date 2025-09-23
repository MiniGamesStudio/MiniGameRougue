System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, _dec, _class, _dec2, _class3, _class4, _crd, ccclass, property, UIID, UIData, UIDataSet;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "39190znnbdAfKz29nRzv79p", "UIData", undefined);

      __checkObsolete__(['_decorator', 'Component', 'Node']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("UIID", UIID = /*#__PURE__*/function (UIID) {
        UIID[UIID["None"] = 0] = "None";
        UIID[UIID["LoadingPanel"] = 1] = "LoadingPanel";
        UIID[UIID["MainPanel"] = 2] = "MainPanel";
        UIID[UIID["GamePanel"] = 3] = "GamePanel";
        UIID[UIID["VictoryPanel"] = 4] = "VictoryPanel";
        return UIID;
      }({}));

      _export("UIData", UIData = (_dec = ccclass('UIData'), _dec(_class = class UIData {
        constructor() {
          this.id = void 0;
          this.name = void 0;
          this.prefabPath = void 0;
          this.cacheCount = void 0;
        }

      }) || _class));

      _export("UIDataSet", UIDataSet = (_dec2 = ccclass('UIDataSet'), _dec2(_class3 = (_class4 = class UIDataSet {
        static FindUIData(id) {
          if (this.m_DataMap == null) {
            return null;
          }

          return this.m_DataMap.get(id);
        }

        static InitUIDatas() {
          this.InitUI(UIID.LoadingPanel, "LoadingPanel", "ui/LoadingPanel");
          this.InitUI(UIID.MainPanel, "MainPanel", "ui/MainPanel");
          this.InitUI(UIID.GamePanel, "GamePanel", "ui/GamePanel");
          this.InitUI(UIID.VictoryPanel, "VictoryPanel", "ui/VictoryPanel");
        }

        static InitUI(id, uiName, path, cacheCount = 1) {
          var data = new UIData();
          data.id = id;
          data.name = uiName;
          data.prefabPath = path;
          data.cacheCount = cacheCount;
          this.m_DataMap.set(data.id, data);
        }

      }, _class4.m_DataMap = new Map(), _class4)) || _class3));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=12e8b15a9347e03179537cdd254dbd340a9c2733.js.map