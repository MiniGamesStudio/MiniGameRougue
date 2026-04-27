import { _decorator, Component, view, Size } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 屏幕适配组件 — 根据屏幕比例动态选择适配策略
 * 引擎层：依赖 Cocos Creator 视图系统
 */
@ccclass('ScreenAdapter')
export class ScreenAdapter extends Component {
    @property(Size)
    public designResolution = new Size(0, 0);

    onLoad(): void {
        this.adjustScreen();
        view.on('resize', this.adjustScreen, this);
    }

    onDestroy(): void {
        view.off('resize', this.adjustScreen, this);
    }

    adjustScreen(): void {
        const canvas: any = this.node.getComponent('cc.Canvas');
        if (!canvas) return;

        const screenSize = view.getVisibleSize();
        const designRatio = this.designResolution.width / this.designResolution.height;
        const screenRatio = screenSize.width / screenSize.height;

        if (screenRatio >= designRatio) {
            canvas.fitHeight = true;
            canvas.fitWidth = false;
        } else {
            canvas.fitHeight = false;
            canvas.fitWidth = true;
        }
    }
}
