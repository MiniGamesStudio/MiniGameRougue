import { _decorator, Component, view, Size } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 屏幕适配组件 — 根据屏幕比例动态选择适配策略
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
            // 屏幕更宽或相同 -> 固定高度
            canvas.fitHeight = true;
            canvas.fitWidth = false;
        } else {
            // 屏幕更窄 -> 固定宽度
            canvas.fitHeight = false;
            canvas.fitWidth = true;
        }
    }
}
