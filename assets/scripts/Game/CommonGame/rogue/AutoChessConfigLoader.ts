import { JsonAsset } from 'cc';
import { ResManager } from '../../../engine/ResManager';
import { CommonBundleName } from '../CommonUIConfig';
import { AutoChessConfig } from './AutoChessTypes';

const AUTO_CHESS_CONFIG_PATH = 'config/auto_chess_config';

export class AutoChessConfigLoader {
    static async load(): Promise<AutoChessConfig> {
        const asset = await ResManager.getInstance().loadFromBundleAsync(
            CommonBundleName.Game,
            AUTO_CHESS_CONFIG_PATH,
            JsonAsset,
        );
        const config = asset.json as AutoChessConfig;
        this.validate(config);
        return config;
    }

    private static validate(config: AutoChessConfig): void {
        if (!config) {
            throw new Error('AutoChessConfigLoader: 配置为空');
        }
        if (!config.board || config.board.cellSize <= 0 || config.board.cols <= 0 || config.board.rows <= 0) {
            throw new Error('AutoChessConfigLoader: board 配置错误');
        }
        if (!config.economy || !config.economy.initialCharacterId) {
            throw new Error('AutoChessConfigLoader: economy 配置错误');
        }
        if (!Array.isArray(config.levels) || config.levels.length <= 0) {
            throw new Error('AutoChessConfigLoader: levels 配置为空');
        }
        if (!Array.isArray(config.characters) || config.characters.length <= 0) {
            throw new Error('AutoChessConfigLoader: characters 配置为空');
        }
        if (!Array.isArray(config.enemies) || config.enemies.length <= 0) {
            throw new Error('AutoChessConfigLoader: enemies 配置为空');
        }
        if (!config.waves || config.waves.firstDelay < 0) {
            throw new Error('AutoChessConfigLoader: waves 配置错误');
        }
    }
}
