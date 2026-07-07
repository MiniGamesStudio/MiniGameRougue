import { Node } from 'cc';

export interface AutoChessBoardConfig {
    cellSize: number;
    cols: number;
    rows: number;
}

export interface AutoChessEconomyConfig {
    initialGold: number;
    refreshCost: number;
    initialCharacterId: string;
    maxEnemyCount: number;
}

export interface AutoChessShopWeightConfig {
    characterId: string;
    weight: number;
}

export interface AutoChessLevelConfig {
    level: number;
    upgradeCost: number;
    shopWeights: AutoChessShopWeightConfig[];
}

export interface AutoChessCharacterConfig {
    id: string;
    name: string;
    line: string;
    tier: number;
    nextId: string;
    price: number;
    hp: number;
    attack: number;
    attackInterval: number;
    moveInterval: number;
    attackRange?: number;
    bulletType?: string;
}

export interface AutoChessEnemyConfig {
    id: string;
    name: string;
    tier: number;
    hp: number;
    attack: number;
    attackInterval: number;
    moveInterval: number;
    attackRange?: number;
    bulletType?: string;
    gold: number;
}

export interface AutoChessWaveConfig {
    firstDelay: number;
    minInterval: number;
    maxInterval: number;
    baseCount: number;
    countPerWave: number;
    maxCount: number;
    enemyTierEveryWaves: number;
    powerScalePerWave: number;
}

export interface AutoChessConfig {
    board: AutoChessBoardConfig;
    economy: AutoChessEconomyConfig;
    levels: AutoChessLevelConfig[];
    characters: AutoChessCharacterConfig[];
    enemies: AutoChessEnemyConfig[];
    waves: AutoChessWaveConfig;
}

export type AutoChessUnitCamp = 'player' | 'enemy';
export type AutoChessUnitState = 'idle' | 'moving' | 'attacking' | 'dead';

export interface AutoChessGridPos {
    col: number;
    row: number;
}

export interface AutoChessUnitRuntime {
    uid: number;
    camp: AutoChessUnitCamp;
    configId: string;
    name: string;
    tier: number;
    hp: number;
    maxHp: number;
    attack: number;
    attackInterval: number;
    moveInterval: number;
    attackRange: number;
    bulletType: string;
    goldReward: number;
    grid: AutoChessGridPos;
    node: Node;
    state: AutoChessUnitState;
    moveCooldown: number;
    attackCooldown: number;
    targetUid: number;
}

export interface AutoChessShopItemRuntime {
    characterId: string;
    node: Node;
}
