import { _decorator, Button, Component, Node, RichText } from 'cc';
import { UIBase } from '../Core/UIBase';
import { UIManager } from '../Core/UIManager';
import { UIID } from './UIData';
import { EventManager } from '../Core/EventManager';
import { CustomClientEvent } from '../Config/Config';
const { ccclass, property } = _decorator;

@ccclass('VictoryPanel')
export class VictoryPanel extends UIBase {
    @property(Button)
    m_CloseBtn:Button = null;
    @property(Button)
    m_RetryBtn:Button = null;
    @property(Button)
    m_GoBackBtn:Button = null;
    @property(Button)
    m_NextLvBtn:Button = null;
    @property(RichText)
    m_ContentRichText:RichText = null;

    onOpen(...args: any[]): void {
        if(args == null){
            this.CloseSelf();
            return;
        }

        var isVictory = false;
        if(args.length > 0){
            isVictory = args[0];
        }

        this.m_CloseBtn.node.on('click', ()=>{
            this.CloseSelf();
        });

        this.m_RetryBtn.node.on('click', ()=>{
            this.CloseSelf();
            EventManager.getInstance().emit(CustomClientEvent.RetryLevel);
        });

        this.m_GoBackBtn.node.on('click', ()=>{
            this.CloseSelf();
            UIManager.GetInstance().OpenPanel(UIID.MainPanel);
            UIManager.GetInstance().ClosePanel(UIID.GamePanel);
        });

        this.m_NextLvBtn.node.on('click', ()=>{
            this.CloseSelf();
            EventManager.getInstance().emit(CustomClientEvent.NextLevel);
        });

        this.m_GoBackBtn.node.active = !isVictory;
        this.m_CloseBtn.node.active = !isVictory;
        this.m_NextLvBtn.node.active = isVictory;
    }

    onClose(): void {

    }
}


