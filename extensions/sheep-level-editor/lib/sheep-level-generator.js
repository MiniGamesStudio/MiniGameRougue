'use strict';

const ROW_COUNT = 16;
const COL_COUNT = 8;
const DEFAULT_TYPE = 'normal';

const Direction = {
    Up: 'Up',
    Right: 'Right',
    Down: 'Down',
    Left: 'Left',
};

const DirectionCycle = [Direction.Up, Direction.Left, Direction.Down, Direction.Right];
const DirectionConfigs = {
    [Direction.Up]: { rowDelta: -1, colDelta: 0 },
    [Direction.Right]: { rowDelta: 0, colDelta: 1 },
    [Direction.Down]: { rowDelta: 1, colDelta: 0 },
    [Direction.Left]: { rowDelta: 0, colDelta: -1 },
};

const DefaultTypeConfigs = {
    [DEFAULT_TYPE]: {
        vertical: { rowSpan: 2, colSpan: 1 },
        horizontal: { rowSpan: 1, colSpan: 2 },
    },
};

function normalizeTypeConfigs(typeConfigs) {
    return {
        ...DefaultTypeConfigs,
        ...(typeConfigs || {}),
    };
}

function generateLevel(level, typeCounts, typeConfigs) {
    const normalizedTypeConfigs = normalizeTypeConfigs(typeConfigs);
    const typeSequence = createTypeSequence(typeCounts);
    const sheep = generateSolvableLayout(typeSequence, normalizedTypeConfigs);
    if (sheep.length < typeSequence.length) {
        throw new Error(`只生成了 ${sheep.length}/${typeSequence.length} 只羊，请减少数量或调整类型占格`);
    }

    const levelData = {
        level,
        rowCount: ROW_COUNT,
        colCount: COL_COUNT,
        sheep,
    };
    if (!canSolveLevel(levelData, normalizedTypeConfigs)) {
        throw new Error(`第 ${level} 关生成后不可解`);
    }

    return levelData;
}

function canSolveLevel(level, typeConfigs) {
    const normalizedTypeConfigs = normalizeTypeConfigs(typeConfigs);
    const sheepList = (level.sheep || []).map((sheep) => {
        const footprint = getFootprint(sheep.direction, sheep.type, normalizedTypeConfigs);
        return {
            ...sheep,
            rowSpan: footprint.rowSpan,
            colSpan: footprint.colSpan,
            removed: false,
        };
    });
    let remainCount = sheepList.length;

    while (remainCount > 0) {
        const removable = sheepList.find((sheep) => !sheep.removed && !isBlocked(sheep, sheepList, normalizedTypeConfigs));
        if (!removable) return false;

        removable.removed = true;
        remainCount--;
    }

    return true;
}

function createTypeSequence(typeCounts) {
    const sequence = [];
    (typeCounts || []).forEach((item) => {
        const type = item.type || DEFAULT_TYPE;
        const count = Math.max(0, Math.floor(Number(item.count) || 0));
        for (let i = 0; i < count; i++) {
            sequence.push(type);
        }
    });

    return sequence.length > 0 ? sequence : [DEFAULT_TYPE];
}

function generateSolvableLayout(typeSequence, typeConfigs) {
    const placed = [];
    const occupied = createOccupiedGrid();
    const centerRow = (ROW_COUNT - 1) * 0.5;
    const centerCol = (COL_COUNT - 1) * 0.5;
    const first = {
        row: Math.max(0, Math.floor(centerRow) - 1),
        col: Math.floor(centerCol),
        direction: Direction.Up,
        type: typeSequence[0] || DEFAULT_TYPE,
    };

    if (!canPlace(first, occupied, typeConfigs)) return placed;

    placed.push(first);
    markOccupied(first, occupied, typeConfigs);

    while (placed.length < typeSequence.length) {
        const nextType = typeSequence[placed.length] || DEFAULT_TYPE;
        const candidates = collectCandidates(placed, occupied, centerRow, centerCol, typeConfigs, nextType);
        if (candidates.length <= 0) break;

        candidates.sort((a, b) => a.score - b.score || Math.random() - 0.5);
        const next = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))].item;
        placed.push(next);
        markOccupied(next, occupied, typeConfigs);
    }

    return placed;
}

function collectCandidates(placed, occupied, centerRow, centerCol, typeConfigs, type) {
    const candidates = [];
    const directionCycle = shuffle(DirectionCycle);
    directionCycle.forEach((direction, directionIndex) => {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                const item = { row, col, direction, type };
                if (!canPlace(item, occupied, typeConfigs)) continue;
                if (blocksAnyPlacedPath(item, placed, typeConfigs)) continue;

                const centerDistance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
                const dependencyScore = isPathBlockedByPlaced(item, placed, typeConfigs) ? 0 : 30;
                candidates.push({
                    item,
                    score: dependencyScore + directionIndex * 100 + centerDistance + Math.random(),
                });
            }
        }
    });

    return candidates;
}

function createOccupiedGrid() {
    const grid = [];
    for (let row = 0; row < ROW_COUNT; row++) {
        const rowData = [];
        for (let col = 0; col < COL_COUNT; col++) {
            rowData.push(false);
        }
        grid.push(rowData);
    }

    return grid;
}

function canPlace(item, occupied, typeConfigs) {
    const footprint = getFootprint(item.direction, item.type, typeConfigs);
    if (!isFootprintInside(item.row, item.col, footprint)) return false;

    for (let rowOffset = 0; rowOffset < footprint.rowSpan; rowOffset++) {
        for (let colOffset = 0; colOffset < footprint.colSpan; colOffset++) {
            if (occupied[item.row + rowOffset][item.col + colOffset]) return false;
        }
    }

    return true;
}

function markOccupied(item, occupied, typeConfigs) {
    const footprint = getFootprint(item.direction, item.type, typeConfigs);
    for (let rowOffset = 0; rowOffset < footprint.rowSpan; rowOffset++) {
        for (let colOffset = 0; colOffset < footprint.colSpan; colOffset++) {
            occupied[item.row + rowOffset][item.col + colOffset] = true;
        }
    }
}

function blocksAnyPlacedPath(item, placed, typeConfigs) {
    const itemRect = getRect(item, typeConfigs);
    return placed.some((placedItem) => getPathRects(placedItem, typeConfigs).some((pathRect) => rectsOverlap(itemRect, pathRect)));
}

function isPathBlockedByPlaced(item, placed, typeConfigs) {
    const pathRects = getPathRects(item, typeConfigs);
    return placed.some((placedItem) => {
        const placedRect = getRect(placedItem, typeConfigs);
        return pathRects.some((pathRect) => rectsOverlap(placedRect, pathRect));
    });
}

function isBlocked(sheep, sheepList, typeConfigs) {
    const pathRects = getPathRects(sheep, typeConfigs);
    return sheepList.some((other) => {
        if (other === sheep || other.removed) return false;

        const otherRect = getRect(other, typeConfigs);
        return pathRects.some((pathRect) => rectsOverlap(otherRect, pathRect));
    });
}

function getPathRects(item, typeConfigs) {
    const config = DirectionConfigs[item.direction];
    const footprint = getFootprint(item.direction, item.type, typeConfigs);
    const rects = [];
    let row = item.row + config.rowDelta;
    let col = item.col + config.colDelta;

    while (isFootprintInside(row, col, footprint)) {
        rects.push({ row, col, rowSpan: footprint.rowSpan, colSpan: footprint.colSpan });
        row += config.rowDelta;
        col += config.colDelta;
    }

    return rects;
}

function getRect(item, typeConfigs) {
    const footprint = 'rowSpan' in item
        ? { rowSpan: item.rowSpan, colSpan: item.colSpan }
        : getFootprint(item.direction, item.type, typeConfigs);
    return {
        row: item.row,
        col: item.col,
        rowSpan: footprint.rowSpan,
        colSpan: footprint.colSpan,
    };
}

function rectsOverlap(a, b) {
    return a.row < b.row + b.rowSpan
        && a.row + a.rowSpan > b.row
        && a.col < b.col + b.colSpan
        && a.col + a.colSpan > b.col;
}

function isFootprintInside(row, col, footprint) {
    return row >= 0
        && col >= 0
        && row + footprint.rowSpan <= ROW_COUNT
        && col + footprint.colSpan <= COL_COUNT;
}

function getFootprint(direction, type, typeConfigs) {
    const typeConfig = typeConfigs[type || DEFAULT_TYPE] || typeConfigs[DEFAULT_TYPE] || DefaultTypeConfigs[DEFAULT_TYPE];
    if (direction === Direction.Left || direction === Direction.Right) {
        return typeConfig.horizontal;
    }

    return typeConfig.vertical;
}

function shuffle(list) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[randomIndex];
        result[randomIndex] = temp;
    }

    return result;
}

module.exports = {
    ROW_COUNT,
    COL_COUNT,
    DEFAULT_TYPE,
    DefaultTypeConfigs,
    generateLevel,
    canSolveLevel,
};
