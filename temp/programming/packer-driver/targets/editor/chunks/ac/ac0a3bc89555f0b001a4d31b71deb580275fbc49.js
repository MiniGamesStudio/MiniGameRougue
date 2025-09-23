System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, instantiate, Prefab, resources, UIDataSet, UIBase, _dec, _class, _class2, _crd, ccclass, property, UIManager;

  function _reportPossibleCrUseOfUIDataSet(extras) {
    _reporterNs.report("UIDataSet", "../UIScripts/UIData", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIID(extras) {
    _reporterNs.report("UIID", "../UIScripts/UIData", _context.meta, extras);
  }

  function _reportPossibleCrUseOfUIBase(extras) {
    _reporterNs.report("UIBase", "./UIBase", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      instantiate = _cc.instantiate;
      Prefab = _cc.Prefab;
      resources = _cc.resources;
    }, function (_unresolved_2) {
      UIDataSet = _unresolved_2.UIDataSet;
    }, function (_unresolved_3) {
      UIBase = _unresolved_3.UIBase;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "42236IlKF5GmKpcyoxvUKae", "UIManager", undefined);

      __checkObsolete__(['_decorator', 'Component', 'instantiate', 'Node', 'Prefab', 'resources']);

      ({
        ccclass,
        property
      } = _decorator);

      _export("UIManager", UIManager = (_dec = ccclass('UIManager'), _dec(_class = (_class2 = class UIManager {
        constructor() {
          this.m_PanelID = 1;
          this.m_UIRoot = null;
          this.m_PanelDataMap = new Map();
          this.m_PanelNodeMap = new Map();
        }

        static GetInstance() {
          if (this.m_Instance == null) {
            this.m_Instance = new UIManager();
          }

          return this.m_Instance;
        }

        Init(uiRoot) {
          this.m_UIRoot = uiRoot;
          this.m_PanelDataMap.clear();
          this.m_PanelNodeMap.clear();
          (_crd && UIDataSet === void 0 ? (_reportPossibleCrUseOfUIDataSet({
            error: Error()
          }), UIDataSet) : UIDataSet).InitUIDatas();
        }

        ClosePanelByID(panelID) {
          var node = this.m_PanelNodeMap.get(panelID);

          if (node) {
            var nodeScript = node.getComponent(_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
              error: Error()
            }), UIBase) : UIBase);

            if (nodeScript) {
              nodeScript.onClose();
            }

            node.removeFromParent();
            node.destroy();
            this.m_PanelNodeMap.delete(panelID);
            return true;
          }

          return false;
        }

        ClosePanel(id) {
          var datas = this.m_PanelDataMap.get(id);

          if (datas) {
            datas.forEach(pID => {
              this.ClosePanelByID(pID);
            });
            this.m_PanelDataMap.delete(id);
            return true;
          }

          return false;
        }

        OpenPanel(id, ...args) {
          var uidata = (_crd && UIDataSet === void 0 ? (_reportPossibleCrUseOfUIDataSet({
            error: Error()
          }), UIDataSet) : UIDataSet).FindUIData(id);

          if (uidata == null || uidata == undefined) {
            return 0;
          }

          var temp = this.CheckPanel(id);

          if (temp > 0) {
            return temp;
          }

          resources.load(uidata.prefabPath, Prefab, (err, prefab) => {
            if (this.m_UIRoot == null) {
              return 0;
            }

            var uiNode = instantiate(prefab);
            uiNode.parent = this.m_UIRoot;
            var uiScript = uiNode.getComponent(_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
              error: Error()
            }), UIBase) : UIBase);

            if (uiScript) {
              uiScript.m_PanelID = this.m_PanelID;
              uiScript.m_UIID = id;
              uiScript.onOpen(...args);
            }

            var uiDatas = this.m_PanelDataMap.get(id);

            if (uiDatas) {
              uiDatas.push(this.m_PanelID);
              this.m_PanelDataMap.set(id, uiDatas);
            } else {
              var arr = new Array();
              arr.push(this.m_PanelID);
              this.m_PanelDataMap.set(id, arr);
            }

            this.m_PanelNodeMap.set(this.m_PanelID, uiNode);
            ++this.m_PanelID;
          });
          return 0;
        }

        CheckPanel(id) {
          var uiDatas = this.m_PanelDataMap.get(id);

          if (uiDatas == null || uiDatas == undefined) {
            return 0;
          }

          var temp = new Array();
          uiDatas.forEach(panelID => {
            var panelNode = this.m_PanelNodeMap.get(panelID);

            if (panelNode) {
              if (panelNode.active == false) {
                panelNode.active = true;
                var uiScript = panelNode.getComponent(_crd && UIBase === void 0 ? (_reportPossibleCrUseOfUIBase({
                  error: Error()
                }), UIBase) : UIBase);

                if (uiScript) {
                  uiScript.m_PanelID = panelID;
                  uiScript.m_UIID = id;
                  uiScript.onOpen();
                }

                return panelID;
              }
            } else {
              temp.push(panelID);
            }
          });
          temp.forEach(pID => {
            uiDatas.filter(v => v !== pID);
          });
          return 0;
        }

      }, _class2.m_Instance = null, _class2)) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=ac0a3bc89555f0b001a4d31b71deb580275fbc49.js.map