// Runtime/HexTerrain/HexCoordinate.ts

/** 轴向坐标 (q, r) */
export interface AxialCoord {
    q: number;
    r: number;
}

/** 立方坐标 (q, r, s)，满足 q + r + s = 0 */
export interface CubeCoord {
    q: number;
    r: number;
    s: number;
}

/** 像素坐标 */
export interface PixelCoord {
    x: number;
    y: number;
}

/** 六角格朝向 */
export enum HexOrientation {
    FlatTop = 0,   // 平顶六角格
    PointyTop = 1, // 尖顶六角格
}

/** 六角格布局参数 */
export interface HexLayout {
    orientation: HexOrientation;
    size: number;       // 六角格外接圆半径
    origin: PixelCoord; // 网格原点的像素偏移
}

/**
 * 六角格坐标转换器
 * 提供轴向坐标、立方坐标和像素坐标之间的转换，
 * 以及距离计算、邻居查询和范围查询等工具方法。
 */
export class HexCoordinate {

    // ─── 坐标转换 ───────────────────────────────────

    /** 轴向坐标 → 立方坐标 */
    static axialToCube(axial: AxialCoord): CubeCoord {
        return { q: axial.q, r: axial.r, s: -axial.q - axial.r };
    }

    /** 立方坐标 → 轴向坐标 */
    static cubeToAxial(cube: CubeCoord): AxialCoord {
        return { q: cube.q, r: cube.r };
    }

    /** 轴向坐标 → 像素坐标 */
    static axialToPixel(axial: AxialCoord, layout: HexLayout): PixelCoord {
        const { q, r } = axial;
        const size = layout.size;
        let x: number, y: number;

        if (layout.orientation === HexOrientation.FlatTop) {
            x = size * (3 / 2 * q);
            y = size * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
        } else {
            x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
            y = size * (3 / 2 * r);
        }

        return { x: x + layout.origin.x, y: y + layout.origin.y };
    }

    /** 像素坐标 → 轴向坐标（取最近的六角格） */
    static pixelToAxial(pixel: PixelCoord, layout: HexLayout): AxialCoord {
        // 处理 NaN/Infinity 输入
        if (!isFinite(pixel.x) || !isFinite(pixel.y)) {
            console.warn('pixelToAxial: received NaN or Infinity pixel coordinate, returning {q: 0, r: 0}');
            return { q: 0, r: 0 };
        }

        const px = pixel.x - layout.origin.x;
        const py = pixel.y - layout.origin.y;
        const size = layout.size;
        let q: number, r: number;

        if (layout.orientation === HexOrientation.FlatTop) {
            q = (2 / 3 * px) / size;
            r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / size;
        } else {
            q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / size;
            r = (2 / 3 * py) / size;
        }

        return HexCoordinate.cubeRound({ q, r, s: -q - r });
    }

    /** 立方坐标四舍五入（浮点 → 整数坐标） */
    static cubeRound(cube: CubeCoord): AxialCoord {
        let rq = Math.round(cube.q);
        let rr = Math.round(cube.r);
        let rs = Math.round(cube.s);

        const dq = Math.abs(rq - cube.q);
        const dr = Math.abs(rr - cube.r);
        const ds = Math.abs(rs - cube.s);

        if (dq > dr && dq > ds) {
            rq = -rr - rs;
        } else if (dr > ds) {
            rr = -rq - rs;
        } else {
            rs = -rq - rr;
        }

        return { q: rq, r: rr };
    }

    // ─── 距离与邻居 ─────────────────────────────────

    /** 计算两个六角格之间的距离（立方坐标曼哈顿距离） */
    static distance(a: AxialCoord, b: AxialCoord): number {
        const ac = HexCoordinate.axialToCube(a);
        const bc = HexCoordinate.axialToCube(b);
        return Math.max(
            Math.abs(ac.q - bc.q),
            Math.abs(ac.r - bc.r),
            Math.abs(ac.s - bc.s)
        );
    }

    /** 六个方向的偏移量（轴向坐标） */
    static readonly DIRECTIONS: ReadonlyArray<AxialCoord> = [
        { q: 1, r: 0 },  { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
    ];

    /** 获取指定格子的 6 个相邻格子坐标 */
    static neighbors(center: AxialCoord): AxialCoord[] {
        return HexCoordinate.DIRECTIONS.map(d => ({
            q: center.q + d.q,
            r: center.r + d.r,
        }));
    }

    /** 获取指定格子在指定半径范围内的所有格子坐标 */
    static range(center: AxialCoord, radius: number): AxialCoord[] {
        if (radius < 0) {
            return [];
        }
        const results: AxialCoord[] = [];
        for (let q = -radius; q <= radius; q++) {
            for (let r = Math.max(-radius, -q - radius);
                 r <= Math.min(radius, -q + radius); r++) {
                results.push({ q: center.q + q, r: center.r + r });
            }
        }
        return results;
    }

    // ─── 工具方法 ────────────────────────────────────

    /** 坐标相等判断 */
    static equals(a: AxialCoord, b: AxialCoord): boolean {
        return a.q === b.q && a.r === b.r;
    }

    /** 生成坐标的字符串键（用于 Map 存储） */
    static toKey(coord: AxialCoord): string {
        return `${coord.q},${coord.r}`;
    }

    /** 从字符串键解析坐标 */
    static fromKey(key: string): AxialCoord {
        const parts = key.split(',');
        if (parts.length !== 2) {
            console.warn(`fromKey: invalid key format "${key}", returning {q: 0, r: 0}`);
            return { q: 0, r: 0 };
        }
        const q = Number(parts[0]);
        const r = Number(parts[1]);
        if (isNaN(q) || isNaN(r)) {
            console.warn(`fromKey: invalid key format "${key}", returning {q: 0, r: 0}`);
            return { q: 0, r: 0 };
        }
        return { q, r };
    }
}
