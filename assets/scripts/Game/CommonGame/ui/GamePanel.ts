import { _decorator, Button, instantiate, Label, Node, ProgressBar, RichText, tween, UITransform, Vec3, view } from 'cc';
import { UIBase } from '../../../engine/ui/UIBase';
import { UIManager } from '../../../engine/ui/UIManager';
import { AutoChessConfigLoader } from '../rogue/AutoChessConfigLoader';
import {
    AutoChessCharacterConfig,
    AutoChessConfig,
    AutoChessEnemyConfig,
    AutoChessGridPos,
    AutoChessLevelConfig,
    AutoChessShopItemRuntime,
    AutoChessUnitRuntime,
} from '../rogue/AutoChessTypes';
import { CommonUIID } from '../CommonUIConfig';
const { ccclass, property } = _decorator;

const DESIGN_ROOT_WIDTH = 750;
const DESIGN_ROOT_HEIGHT = 1334;
const SHOP_ITEM_COUNT = 5;
const INVALID_UID = 0;

@ccclass('GamePanel')
export class GamePanel extends UIBase {
    @property(Node)
    m_GameRoot: Node = null;
    @property(Button)
    m_PauseBtn: Button = null;
    @property(RichText)
    m_TitleText: RichText = null;
    @property(Button)
    m_LvUpBtn: Button = null;
    @property(Button)
    m_RefreshBtn: Button = null;
    @property(Node)
    m_CharacterRoot: Node = null;
    @property(Node)
    m_CharacterItem: Node = null;
    @property(Node)
    m_ItemSelectLayout: Node = null;
    @property(Node)
    m_Item: Node = null;
    @property(Label)
    m_LvText: Label = null;

    @property({ tooltip: '游戏根节点设计宽度，用于按屏幕分辨率缩放' })
    m_DesignWidth: number = DESIGN_ROOT_WIDTH;
    @property({ tooltip: '游戏根节点设计高度，用于按屏幕分辨率缩放' })
    m_DesignHeight: number = DESIGN_ROOT_HEIGHT;
    @property({ tooltip: '游戏根节点最大缩放，1 表示不超过设计尺寸（保持清晰），可调大以在大屏铺满' })
    m_GameRootMaxScale: number = 1;

    private m_Config: AutoChessConfig = null;
    private m_CharacterMap: Map<string, AutoChessCharacterConfig> = new Map();
    private m_Units: AutoChessUnitRuntime[] = [];
    private m_ShopItems: AutoChessShopItemRuntime[] = [];
    private m_OccupiedGrid: Map<string, number> = new Map();
    private m_Gold: number = 0;
    private m_PlayerLevel: number = 1;
    private m_WaveIndex: number = 0;
    private m_NextWaveCountdown: number = 0;
    private m_IsRunning: boolean = false;
    private m_UnitUid: number = 1;
    private m_OpenVersion: number = 0;
    private m_TitleHoldTime: number = 0;

    OnInit(): void {
        this.SetBtnEvent(this.m_PauseBtn, () => this.onPauseBtnClick());
        this.SetBtnEvent(this.m_RefreshBtn, () => this.onRefreshBtnClick());
        this.SetBtnEvent(this.m_LvUpBtn, () => this.onLvUpBtnClick());
        view.on('resize', this.adjustGameRootScale, this);
    }

    onDestroy(): void {
        view.off('resize', this.adjustGameRootScale, this);
    }

    OnOpen(): void {
        this.m_OpenVersion++;
        const openVersion = this.m_OpenVersion;
        this.adjustGameRootScale();
        this.setTitle('配置加载中...', 0);
        this.startGame(openVersion);
    }

    OnClose(): void {
        this.m_OpenVersion++;
        this.m_IsRunning = false;
        this.clearRuntimeNodes();
        super.OnClose();
    }

    onPauseBtnClick(): void {
        UIManager.GetInstance().OpenPanel(CommonUIID.PausePanel);
    }

    update(dt: number): void {
        if (!this.m_IsRunning || !this.m_Config) return;
        this.m_TitleHoldTime = Math.max(0, this.m_TitleHoldTime - dt);
        this.updateWave(dt);
        this.updateUnits(dt);
        this.checkFailState();
    }

    private async startGame(openVersion: number): Promise<void> {
        try {
            if (!this.m_Config) {
                this.m_Config = await AutoChessConfigLoader.load();
                this.buildConfigMaps();
            }
            if (openVersion !== this.m_OpenVersion) return;
            this.resetGameState();
            this.spawnPlayerCharacter(this.m_Config.economy.initialCharacterId);
            this.refreshShop(true);
            this.m_IsRunning = true;
            this.refreshHud();
        } catch (err) {
            console.error('GamePanel: 启动玩法失败', err);
            this.setTitle('配置加载失败');
        }
    }

    private buildConfigMaps(): void {
        this.m_CharacterMap.clear();
        this.m_Config.characters.forEach(config => this.m_CharacterMap.set(config.id, config));
    }

    private resetGameState(): void {
        this.clearRuntimeNodes();
        this.m_Gold = Math.max(0, this.m_Config.economy.initialGold);
        this.m_PlayerLevel = 1;
        this.m_WaveIndex = 0;
        this.m_NextWaveCountdown = Math.max(0, this.m_Config.waves.firstDelay);
        this.m_UnitUid = 1;
        this.m_TitleHoldTime = 0;
        this.m_IsRunning = false;
    }

    private clearRuntimeNodes(): void {
        this.m_Units.forEach(unit => {
            if (unit.node && unit.node.isValid) {
                unit.node.removeFromParent();
                unit.node.destroy();
            }
        });
        this.m_ShopItems.forEach(item => {
            if (item.node && item.node.isValid) {
                item.node.removeFromParent();
                item.node.destroy();
            }
        });
        this.m_Units.length = 0;
        this.m_ShopItems.length = 0;
        this.m_OccupiedGrid.clear();
    }

    private onRefreshBtnClick(): void {
        if (!this.m_Config) return;
        const cost = Math.max(0, this.m_Config.economy.refreshCost);
        if (this.m_Gold < cost) {
            this.setTitle(`金币不足，刷新需要 ${cost} 金币`);
            return;
        }
        this.m_Gold -= cost;
        this.refreshShop(false);
        this.refreshHud();
    }

    private onLvUpBtnClick(): void {
        if (!this.m_Config) return;
        const currentLevel = this.getLevelConfig(this.m_PlayerLevel);
        const nextLevel = this.getLevelConfig(this.m_PlayerLevel + 1);
        if (!currentLevel || !nextLevel) {
            this.setTitle('已达到最高等级');
            return;
        }
        const cost = Math.max(0, currentLevel.upgradeCost);
        if (this.m_Gold < cost) {
            this.setTitle(`金币不足，升级需要 ${cost} 金币`);
            return;
        }
        this.m_Gold -= cost;
        this.m_PlayerLevel = nextLevel.level;
        this.setTitle(`升级成功，当前 Lv.${this.m_PlayerLevel}`);
        this.refreshHud();
    }

    private refreshShop(free: boolean): void {
        if (!this.m_Config || !this.m_Item || !this.m_ItemSelectLayout) return;
        this.clearShopItems();
        for (let i = 0; i < SHOP_ITEM_COUNT; i++) {
            const characterConfig = this.rollShopCharacter();
            if (!characterConfig) continue;
            const itemNode = instantiate(this.m_Item);
            itemNode.active = true;
            itemNode.setParent(this.m_ItemSelectLayout);
            this.setShopItemView(itemNode, characterConfig);
            this.m_ShopItems.push({ characterId: characterConfig.id, node: itemNode });
        }
        if (!free) {
            this.setTitle(`商店已刷新，消耗 ${this.m_Config.economy.refreshCost} 金币`);
        }
    }

    private clearShopItems(): void {
        this.m_ShopItems.forEach(item => {
            if (item.node && item.node.isValid) {
                item.node.removeFromParent();
                item.node.destroy();
            }
        });
        this.m_ShopItems.length = 0;
    }

    private setShopItemView(itemNode: Node, characterConfig: AutoChessCharacterConfig): void {
        const typeLabel = this.findNode(itemNode, 'CharacterType')?.getComponent(Label);
        if (typeLabel) typeLabel.string = characterConfig.name;
        const coinLabel = this.findNode(itemNode, 'Coin')?.getComponent(Label);
        if (coinLabel) coinLabel.string = `${characterConfig.price}`;
        const itemBtn = this.findNode(itemNode, 'ItemBtn')?.getComponent(Button);
        if (itemBtn) {
            this.SetBtnEvent(itemBtn, () => this.buyShopItem(itemNode, characterConfig));
        }
    }

    private buyShopItem(itemNode: Node, characterConfig: AutoChessCharacterConfig): void {
        if (!itemNode || !itemNode.isValid || !itemNode.active) return;
        if (this.m_Gold < characterConfig.price) {
            this.setTitle(`金币不足，购买 ${characterConfig.name} 需要 ${characterConfig.price} 金币`);
            return;
        }
        const grid = this.findPlayerSpawnGrid();
        if (!grid) {
            this.setTitle('棋盘底部没有空位');
            return;
        }
        this.m_Gold -= characterConfig.price;
        itemNode.active = false;
        this.spawnPlayerCharacter(characterConfig.id, grid);
        this.checkMerge();
        this.refreshHud();
    }

    private spawnPlayerCharacter(characterId: string, grid?: AutoChessGridPos): AutoChessUnitRuntime | null {
        const characterConfig = this.m_CharacterMap.get(characterId);
        const spawnGrid = grid || this.findPlayerSpawnGrid();
        if (!characterConfig || !spawnGrid) return null;
        return this.createUnitFromCharacter(characterConfig, spawnGrid);
    }

    private createUnitFromCharacter(config: AutoChessCharacterConfig, grid: AutoChessGridPos): AutoChessUnitRuntime | null {
        if (!this.m_CharacterItem || !this.m_CharacterRoot) return null;
        const node = instantiate(this.m_CharacterItem);
        node.active = true;
        node.setParent(this.m_CharacterRoot);
        node.setPosition(this.gridToPosition(grid));
        const unit: AutoChessUnitRuntime = {
            uid: this.m_UnitUid++,
            camp: 'player',
            configId: config.id,
            name: config.name,
            tier: config.tier,
            hp: config.hp,
            maxHp: config.hp,
            attack: config.attack,
            attackInterval: config.attackInterval,
            moveInterval: config.moveInterval,
            goldReward: 0,
            grid,
            node,
            state: 'idle',
            moveCooldown: 0,
            attackCooldown: 0,
            targetUid: INVALID_UID,
        };
        this.m_Units.push(unit);
        this.setGridOccupied(grid, unit.uid);
        this.refreshUnitView(unit);
        return unit;
    }

    private createUnitFromEnemy(config: AutoChessEnemyConfig, grid: AutoChessGridPos, powerScale: number): AutoChessUnitRuntime | null {
        if (!this.m_CharacterItem || !this.m_CharacterRoot) return null;
        const node = instantiate(this.m_CharacterItem);
        node.active = true;
        node.setParent(this.m_CharacterRoot);
        node.setPosition(this.gridToPosition(grid));
        const unit: AutoChessUnitRuntime = {
            uid: this.m_UnitUid++,
            camp: 'enemy',
            configId: config.id,
            name: config.name,
            tier: config.tier,
            hp: Math.ceil(config.hp * powerScale),
            maxHp: Math.ceil(config.hp * powerScale),
            attack: Math.ceil(config.attack * powerScale),
            attackInterval: config.attackInterval,
            moveInterval: config.moveInterval,
            goldReward: config.gold,
            grid,
            node,
            state: 'idle',
            moveCooldown: 0,
            attackCooldown: 0,
            targetUid: INVALID_UID,
        };
        this.m_Units.push(unit);
        this.setGridOccupied(grid, unit.uid);
        this.refreshUnitView(unit);
        return unit;
    }

    private refreshUnitView(unit: AutoChessUnitRuntime): void {
        if (!unit.node || !unit.node.isValid) return;
        const typeLabel = this.findNode(unit.node, 'CharacterBg/CharacterType')?.getComponent(Label);
        if (typeLabel) typeLabel.string = unit.name;
        const hpBar = this.findNode(unit.node, 'CharacterBg/Hp')?.getComponent(ProgressBar);
        if (hpBar) hpBar.progress = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
    }

    private updateWave(dt: number): void {
        this.m_NextWaveCountdown -= dt;
        if (this.m_NextWaveCountdown <= 0) {
            this.spawnWave();
            this.m_NextWaveCountdown = this.getNextWaveInterval();
        }
        this.refreshHud();
    }

    private spawnWave(): void {
        this.m_WaveIndex++;
        const waveConfig = this.m_Config.waves;
        const count = Math.min(waveConfig.maxCount, waveConfig.baseCount + this.m_WaveIndex * waveConfig.countPerWave);
        const enemyConfig = this.getWaveEnemyConfig();
        const powerScale = 1 + Math.max(0, this.m_WaveIndex - 1) * waveConfig.powerScalePerWave;
        let spawned = 0;
        for (let i = 0; i < count; i++) {
            const grid = this.findEnemySpawnGrid();
            if (!grid) break;
            if (this.createUnitFromEnemy(enemyConfig, grid, powerScale)) {
                spawned++;
            }
        }
        this.setTitle(`第 ${this.m_WaveIndex} 波怪物来袭，共 ${spawned} 只`);
    }

    private getWaveEnemyConfig(): AutoChessEnemyConfig {
        const every = Math.max(1, this.m_Config.waves.enemyTierEveryWaves);
        const tier = Math.min(this.m_Config.enemies.length, 1 + Math.floor(Math.max(0, this.m_WaveIndex - 1) / every));
        return this.m_Config.enemies[Math.max(0, tier - 1)] || this.m_Config.enemies[0];
    }

    private getNextWaveInterval(): number {
        const waveConfig = this.m_Config.waves;
        const interval = waveConfig.maxInterval - this.m_WaveIndex * 1.2;
        return Math.max(waveConfig.minInterval, Math.min(waveConfig.maxInterval, interval));
    }

    private updateUnits(dt: number): void {
        const units = this.m_Units.filter(unit => unit.state !== 'dead');
        units.forEach(unit => {
            if (!unit.node || !unit.node.isValid || unit.state === 'dead') return;
            unit.moveCooldown = Math.max(0, unit.moveCooldown - dt);
            unit.attackCooldown = Math.max(0, unit.attackCooldown - dt);
            if (unit.state === 'moving' || unit.state === 'attacking') return;

            const target = this.findNearestTarget(unit);
            if (!target) {
                unit.targetUid = INVALID_UID;
                return;
            }
            unit.targetUid = target.uid;
            const distance = this.getGridDistance(unit.grid, target.grid);
            if (distance <= 1) {
                this.tryAttack(unit, target);
            } else {
                this.tryMoveToward(unit, target);
            }
        });
        this.m_Units = this.m_Units.filter(unit => unit.state !== 'dead');
    }

    private tryMoveToward(unit: AutoChessUnitRuntime, target: AutoChessUnitRuntime): void {
        if (unit.moveCooldown > 0) return;
        const nextGrid = this.findNextStep(unit.grid, target.grid);
        if (!nextGrid) {
            unit.moveCooldown = unit.moveInterval;
            return;
        }
        this.clearGridOccupied(unit.grid);
        unit.grid = nextGrid;
        this.setGridOccupied(unit.grid, unit.uid);
        unit.moveCooldown = unit.moveInterval;
        unit.state = 'moving';
        tween(unit.node)
            .to(0.16, { position: this.gridToPosition(nextGrid) })
            .call(() => {
                if (unit.state !== 'dead') unit.state = 'idle';
            })
            .start();
    }

    private tryAttack(unit: AutoChessUnitRuntime, target: AutoChessUnitRuntime): void {
        if (unit.attackCooldown > 0 || !target.node || !target.node.isValid) return;
        unit.attackCooldown = unit.attackInterval;
        unit.state = 'attacking';
        const origin = this.gridToPosition(unit.grid);
        const targetPosition = this.gridToPosition(target.grid);
        tween(unit.node)
            .to(0.08, { position: targetPosition })
            .call(() => this.damageUnit(target.uid, unit.attack, unit.camp))
            .to(0.08, { position: origin })
            .call(() => {
                if (unit.state !== 'dead') unit.state = 'idle';
            })
            .start();
    }

    private damageUnit(targetUid: number, damage: number, attackerCamp: string): void {
        const target = this.getUnitByUid(targetUid);
        if (!target || target.state === 'dead') return;
        target.hp -= Math.max(1, damage);
        this.refreshUnitView(target);
        if (target.hp > 0) return;
        this.killUnit(target, attackerCamp);
    }

    private killUnit(unit: AutoChessUnitRuntime, attackerCamp: string): void {
        if (unit.state === 'dead') return;
        unit.state = 'dead';
        this.clearGridOccupied(unit.grid);
        if (unit.camp === 'enemy' && attackerCamp === 'player') {
            this.m_Gold += unit.goldReward;
            this.setTitle(`击杀 ${unit.name}，获得 ${unit.goldReward} 金币`);
        }
        if (unit.node && unit.node.isValid) {
            unit.node.removeFromParent();
            unit.node.destroy();
        }
        this.refreshHud();
    }

    private checkMerge(): void {
        let merged = true;
        while (merged) {
            merged = false;
            const groups = new Map<string, AutoChessUnitRuntime[]>();
            this.m_Units.forEach(unit => {
                if (unit.camp !== 'player' || unit.state === 'dead') return;
                const list = groups.get(unit.configId) || [];
                list.push(unit);
                groups.set(unit.configId, list);
            });
            for (const [configId, units] of groups.entries()) {
                if (units.length < 3) continue;
                const config = this.m_CharacterMap.get(configId);
                if (!config || !config.nextId) continue;
                const nextConfig = this.m_CharacterMap.get(config.nextId);
                if (!nextConfig) continue;
                units.sort((a, b) => a.grid.row - b.grid.row || a.grid.col - b.grid.col);
                const keep = units[0];
                const removeUnits = units.slice(1, 3);
                removeUnits.forEach(unit => this.killUnitForMerge(unit));
                this.applyCharacterConfig(keep, nextConfig);
                this.setTitle(`合成成功：${nextConfig.name}`);
                merged = true;
                break;
            }
        }
    }

    private killUnitForMerge(unit: AutoChessUnitRuntime): void {
        unit.state = 'dead';
        this.clearGridOccupied(unit.grid);
        if (unit.node && unit.node.isValid) {
            unit.node.removeFromParent();
            unit.node.destroy();
        }
    }

    private applyCharacterConfig(unit: AutoChessUnitRuntime, config: AutoChessCharacterConfig): void {
        unit.configId = config.id;
        unit.name = config.name;
        unit.tier = config.tier;
        unit.maxHp = config.hp;
        unit.hp = config.hp;
        unit.attack = config.attack;
        unit.attackInterval = config.attackInterval;
        unit.moveInterval = config.moveInterval;
        unit.moveCooldown = 0;
        unit.attackCooldown = 0;
        unit.state = 'idle';
        this.refreshUnitView(unit);
    }

    private checkFailState(): void {
        const playerCount = this.m_Units.some(unit => unit.camp === 'player' && unit.state !== 'dead');
        const enemyCount = this.m_Units.filter(unit => unit.camp === 'enemy' && unit.state !== 'dead').length;
        if (enemyCount >= this.m_Config.economy.maxEnemyCount) {
            this.m_IsRunning = false;
            this.setTitle('敌人数量过多，游戏失败');
            return;
        }
        if (!playerCount) {
            const cheapest = this.getCheapestCharacterPrice();
            if (this.m_Gold < cheapest) {
                this.m_IsRunning = false;
                this.setTitle('没有棋子且金币不足，游戏失败');
            }
        }
    }

    private refreshHud(): void {
        if (this.m_LvText) {
            const levelConfig = this.getLevelConfig(this.m_PlayerLevel);
            const upgradeText = levelConfig && levelConfig.upgradeCost > 0 ? ` 升级:${levelConfig.upgradeCost}` : ' 满级';
            this.m_LvText.string = `Lv.${this.m_PlayerLevel} 金币:${this.m_Gold}${upgradeText}`;
        }
        if (!this.m_TitleText || !this.m_IsRunning) return;
        if (this.m_TitleHoldTime > 0) return;
        const seconds = Math.max(0, Math.ceil(this.m_NextWaveCountdown));
        if (seconds <= 3 && seconds > 0) {
            this.m_TitleText.string = `怪物即将抵达！${seconds} 秒`;
        } else if (seconds > 0) {
            this.m_TitleText.string = `第 ${this.m_WaveIndex + 1} 波怪物将在 ${seconds} 秒后抵达`;
        }
    }

    private setTitle(text: string, holdTime: number = 1.2): void {
        if (this.m_TitleText) {
            this.m_TitleText.string = text;
        }
        this.m_TitleHoldTime = Math.max(0, holdTime);
    }

    private rollShopCharacter(): AutoChessCharacterConfig | null {
        const levelConfig = this.getLevelConfig(this.m_PlayerLevel) || this.m_Config.levels[0];
        const weights = levelConfig.shopWeights || [];
        const totalWeight = weights.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
        if (totalWeight <= 0) return this.m_Config.characters[0] || null;
        let random = Math.random() * totalWeight;
        for (const item of weights) {
            random -= Math.max(0, item.weight);
            if (random <= 0) {
                return this.m_CharacterMap.get(item.characterId) || this.m_Config.characters[0] || null;
            }
        }
        const last = weights[weights.length - 1];
        return last ? this.m_CharacterMap.get(last.characterId) || null : null;
    }

    private getLevelConfig(level: number): AutoChessLevelConfig | null {
        return this.m_Config?.levels.find(config => config.level === level) || null;
    }

    private getCheapestCharacterPrice(): number {
        return this.m_Config.characters.reduce((min, item) => Math.min(min, item.price), Number.MAX_SAFE_INTEGER);
    }

    private findNearestTarget(unit: AutoChessUnitRuntime): AutoChessUnitRuntime | null {
        let nearest: AutoChessUnitRuntime = null;
        let nearestDistance = Number.MAX_SAFE_INTEGER;
        this.m_Units.forEach(target => {
            if (target.state === 'dead' || target.camp === unit.camp) return;
            const distance = this.getGridDistance(unit.grid, target.grid);
            if (distance < nearestDistance) {
                nearest = target;
                nearestDistance = distance;
            }
        });
        return nearest;
    }

    private findNextStep(from: AutoChessGridPos, to: AutoChessGridPos): AutoChessGridPos | null {
        const deltaCol = to.col - from.col;
        const deltaRow = to.row - from.row;
        const candidates: AutoChessGridPos[] = [];
        if (Math.abs(deltaCol) >= Math.abs(deltaRow) && deltaCol !== 0) {
            candidates.push({ col: from.col + Math.sign(deltaCol), row: from.row });
        }
        if (deltaRow !== 0) {
            candidates.push({ col: from.col, row: from.row + Math.sign(deltaRow) });
        }
        if (Math.abs(deltaCol) < Math.abs(deltaRow) && deltaCol !== 0) {
            candidates.push({ col: from.col + Math.sign(deltaCol), row: from.row });
        }
        return candidates.find(grid => this.isGridInside(grid) && !this.isGridOccupied(grid)) || null;
    }

    private findPlayerSpawnGrid(): AutoChessGridPos | null {
        for (let row = 0; row < this.m_Config.board.rows; row++) {
            for (let col = 0; col < this.m_Config.board.cols; col++) {
                const grid = { col, row };
                if (!this.isGridOccupied(grid)) return grid;
            }
        }
        return null;
    }

    private findEnemySpawnGrid(): AutoChessGridPos | null {
        for (let row = this.m_Config.board.rows - 1; row >= 0; row--) {
            for (let col = 0; col < this.m_Config.board.cols; col++) {
                const grid = { col, row };
                if (!this.isGridOccupied(grid)) return grid;
            }
        }
        return null;
    }

    private gridToPosition(grid: AutoChessGridPos): Vec3 {
        const board = this.m_Config.board;
        const x = (grid.col - (board.cols - 1) * 0.5) * board.cellSize;
        const y = (grid.row - (board.rows - 1) * 0.5) * board.cellSize;
        return new Vec3(x, y, 0);
    }

    private getGridDistance(a: AutoChessGridPos, b: AutoChessGridPos): number {
        return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
    }

    private isGridInside(grid: AutoChessGridPos): boolean {
        return grid.col >= 0 && grid.col < this.m_Config.board.cols && grid.row >= 0 && grid.row < this.m_Config.board.rows;
    }

    private isGridOccupied(grid: AutoChessGridPos): boolean {
        return this.m_OccupiedGrid.has(this.getGridKey(grid));
    }

    private setGridOccupied(grid: AutoChessGridPos, uid: number): void {
        this.m_OccupiedGrid.set(this.getGridKey(grid), uid);
    }

    private clearGridOccupied(grid: AutoChessGridPos): void {
        this.m_OccupiedGrid.delete(this.getGridKey(grid));
    }

    private getGridKey(grid: AutoChessGridPos): string {
        return `${grid.col}_${grid.row}`;
    }

    private getUnitByUid(uid: number): AutoChessUnitRuntime | null {
        return this.m_Units.find(unit => unit.uid === uid && unit.state !== 'dead') || null;
    }

    private findNode(root: Node, path: string): Node | null {
        if (!root || !path) return null;
        const parts = path.split('/');
        let node: Node = root;
        for (const part of parts) {
            node = node.getChildByName(part);
            if (!node) return null;
        }
        return node;
    }

    /**
     * 按屏幕分辨率对游戏根节点做 contain 缩放：
     * 以设计尺寸为基准，取可见区域与设计尺寸比值的较小值，
     * 保证设计尺寸内的棋盘与小羊完整显示在屏幕内，
     * 避免部分分辨率（如窄屏 fitHeight 横向裁边）下边缘小羊被切掉。
     */
    private adjustGameRootScale(): void {
        if (!this.m_GameRoot || !this.m_GameRoot.isValid) return;
        const designWidth = Math.max(1, this.m_DesignWidth);
        const designHeight = Math.max(1, this.m_DesignHeight);
        const visibleSize = view.getVisibleSize();
        const visibleWidth = visibleSize?.width || 0;
        const visibleHeight = visibleSize?.height || 0;
        if (visibleWidth <= 0 || visibleHeight <= 0) return;
        const maxScale = Math.max(0.01, this.m_GameRootMaxScale);
        const scale = Math.min(maxScale, visibleWidth / designWidth, visibleHeight / designHeight);
        this.m_GameRoot.setScale(scale, scale, 1);
    }
}
