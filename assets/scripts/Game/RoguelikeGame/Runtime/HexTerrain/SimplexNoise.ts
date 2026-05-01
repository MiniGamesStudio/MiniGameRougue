// Runtime/HexTerrain/SimplexNoise.ts

/**
 * 2D Simplex Noise 实现
 * 纯 TypeScript，无外部依赖，支持种子控制
 * 用于程序化地形生成的连续伪随机噪声
 *
 * 参考 Stefan Gustavson 的 Simplex Noise 论文和参考实现
 */

// 2D 梯度向量（12 个方向）
const GRAD2: ReadonlyArray<readonly [number, number]> = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
];

// Skew / unskew 常量
const F2 = 0.5 * (Math.sqrt(3.0) - 1.0); // ≈ 0.3660254
const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;  // ≈ 0.2113249

export class SimplexNoise {
    private _perm: Uint8Array;       // 512 entries (256 doubled)
    private _permMod12: Uint8Array;  // perm[i] % 12 for gradient lookup

    /**
     * @param seed 随机种子，相同种子产生相同噪声序列
     */
    constructor(seed: number) {
        this._perm = new Uint8Array(512);
        this._permMod12 = new Uint8Array(512);
        this._buildPermutationTable(seed);
    }

    /**
     * 使用种子生成确定性排列表
     * 使用线性同余生成器 (LCG) 进行 Fisher-Yates 洗牌
     */
    private _buildPermutationTable(seed: number): void {
        // 初始化 0..255 的有序数组
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        // 使用种子初始化 LCG 状态
        let s = seed | 0;
        // 确保种子不为 0（LCG 需要非零状态）
        if (s === 0) s = 1;

        // LCG 参数（Numerical Recipes 推荐值）
        const nextRandom = (): number => {
            s = (s * 1664525 + 1013904223) | 0;
            return (s >>> 0); // 转为无符号 32 位整数
        };

        // Fisher-Yates 洗牌
        for (let i = 255; i > 0; i--) {
            const j = nextRandom() % (i + 1);
            const tmp = p[i];
            p[i] = p[j];
            p[j] = tmp;
        }

        // 双倍填充排列表
        for (let i = 0; i < 256; i++) {
            this._perm[i] = p[i];
            this._perm[i + 256] = p[i];
            this._permMod12[i] = p[i] % 12;
            this._permMod12[i + 256] = p[i] % 12;
        }
    }

    /**
     * 2D Simplex Noise
     * @param x X 坐标
     * @param y Y 坐标
     * @returns 噪声值，范围 [-1, 1]
     */
    noise2D(x: number, y: number): number {
        const perm = this._perm;
        const permMod12 = this._permMod12;

        // Skew 输入空间到简单三角网格
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);

        // Unskew 回到原始空间
        const t = (i + j) * G2;
        const X0 = i - t; // 单元格原点在原始空间的坐标
        const Y0 = j - t;
        const x0 = x - X0; // 输入点相对于单元格原点的偏移
        const y0 = y - Y0;

        // 确定所在的单纯形（三角形）
        // 对于 2D，单纯形是等边三角形
        let i1: number, j1: number;
        if (x0 > y0) {
            // 下三角形: (0,0) → (1,0) → (1,1)
            i1 = 1;
            j1 = 0;
        } else {
            // 上三角形: (0,0) → (0,1) → (1,1)
            i1 = 0;
            j1 = 1;
        }

        // 三个顶点相对于输入点的偏移
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        // 哈希坐标到排列表索引
        const ii = i & 255;
        const jj = j & 255;

        // 计算三个顶点的贡献
        let n0 = 0, n1 = 0, n2 = 0;

        // 顶点 0
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            const gi0 = permMod12[ii + perm[jj]];
            t0 *= t0;
            n0 = t0 * t0 * (GRAD2[gi0][0] * x0 + GRAD2[gi0][1] * y0);
        }

        // 顶点 1
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            const gi1 = permMod12[ii + i1 + perm[jj + j1]];
            t1 *= t1;
            n1 = t1 * t1 * (GRAD2[gi1][0] * x1 + GRAD2[gi1][1] * y1);
        }

        // 顶点 2
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            const gi2 = permMod12[ii + 1 + perm[jj + 1]];
            t2 *= t2;
            n2 = t2 * t2 * (GRAD2[gi2][0] * x2 + GRAD2[gi2][1] * y2);
        }

        // 缩放到 [-1, 1] 范围
        // 标准 2D Simplex Noise 的缩放因子为 70.0
        return 70.0 * (n0 + n1 + n2);
    }

    /**
     * 多层叠加噪声（Fractal Brownian Motion）
     * @param x X 坐标
     * @param y Y 坐标
     * @param octaves 叠加层数
     * @param frequency 基础频率
     * @param amplitude 基础振幅
     * @param lacunarity 频率倍增系数（默认 2.0）
     * @param persistence 振幅衰减系数（默认 0.5）
     * @returns 叠加后的噪声值，归一化到 [0, 1]
     */
    fbm(
        x: number, y: number,
        octaves: number,
        frequency: number,
        amplitude: number,
        lacunarity: number = 2.0,
        persistence: number = 0.5,
    ): number {
        let value = 0;
        let maxValue = 0;
        let freq = frequency;
        let amp = amplitude;

        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * freq, y * freq) * amp;
            maxValue += amp;
            freq *= lacunarity;
            amp *= persistence;
        }

        // 归一化到 [0, 1]
        // noise2D 返回 [-1, 1]，所以 value/maxValue 在 [-1, 1]
        // (value/maxValue + 1) / 2 映射到 [0, 1]
        return (value / maxValue + 1) / 2;
    }
}
