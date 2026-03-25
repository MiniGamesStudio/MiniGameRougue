System.register(["cc"], function (_export, _context) {
  "use strict";

  var _cclegacy, _crd, FrameworkEvent, CustomClientEvent;

  return {
    setters: [function (_cc) {
      _cclegacy = _cc.cclegacy;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "00a6642bOdJmZ9dOCkEtFDm", "Config", undefined);

      /**
       * 框架级事件 — 所有游戏通用
       */
      _export("FrameworkEvent", FrameworkEvent = /*#__PURE__*/function (FrameworkEvent) {
        FrameworkEvent["GamePaused"] = "Framework.GamePaused";
        FrameworkEvent["GameResumed"] = "Framework.GameResumed";
        FrameworkEvent["SceneChanged"] = "Framework.SceneChanged";
        return FrameworkEvent;
      }({}));
      /**
       * 业务事件 — 插花游戏专用
       */


      _export("CustomClientEvent", CustomClientEvent = /*#__PURE__*/function (CustomClientEvent) {
        CustomClientEvent["FlowerDissolve"] = "FlowerDissolve";
        CustomClientEvent["CheckVictory"] = "CheckVictory";
        CustomClientEvent["RetryLevel"] = "RetryLevel";
        CustomClientEvent["NextLevel"] = "NextLevel";
        CustomClientEvent["LevelLoaded"] = "LevelLoaded";
        CustomClientEvent["GamePaused"] = "GamePaused";
        CustomClientEvent["GameResumed"] = "GameResumed";
        CustomClientEvent["ScoreChanged"] = "ScoreChanged";
        return CustomClientEvent;
      }({}));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=09267c8e8ce60126cde3d92df285059851b2cb4f.js.map