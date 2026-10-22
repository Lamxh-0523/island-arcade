/** 2048 的纯逻辑：不依赖 DOM，可直接单测。 */

export const SIZE = 4;

/** @returns {number[]} */
export function createBoard() {
  return Array(SIZE * SIZE).fill(0);
}

/** @param {number[]} board @returns {number[]} */
export function emptyCells(board) {
  const cells = [];
  for (let i = 0; i < board.length; i++) if (board[i] === 0) cells.push(i);
  return cells;
}

/**
 * 在随机空格放一个 2（90%）或 4（10%）。会修改传入的棋盘。
 * @param {number[]} board
 * @param {() => number} [random]
 * @returns {number} 放置位置，-1 表示没有空格
 */
export function addRandomTile(board, random = Math.random) {
  const cells = emptyCells(board);
  if (cells.length === 0) return -1;

  const index = cells[Math.floor(random() * cells.length)];
  board[index] = random() < 0.9 ? 2 : 4;
  return index;
}

/** @param {number[]} board */
export function maxTile(board) {
  return board.reduce((max, value) => (value > max ? value : max), 0);
}

/**
 * 把一行（按移动方向排好序）压缩合并。
 * 每个方块在一次移动中只合并一次：[2,2,2,2] → [4,4]，而不是 [8]。
 * @param {number[]} line
 */
function slideLine(line) {
  const values = line.filter((value) => value !== 0);
  /** @type {number[]} */
  const merged = [];
  let gained = 0;

  for (let i = 0; i < values.length; i++) {
    if (i + 1 < values.length && values[i] === values[i + 1]) {
      const value = values[i] * 2;
      merged.push(value);
      gained += value;
      i++;
    } else {
      merged.push(values[i]);
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { line: merged, gained };
}

/**
 * 某一列/行在指定方向下的下标顺序（按“先到达边缘”的顺序）。
 * @param {'left' | 'right' | 'up' | 'down'} direction
 * @param {number} index
 */
function lineIndices(direction, index) {
  /** @type {number[]} */
  const indices = [];
  for (let step = 0; step < SIZE; step++) {
    const offset = direction === 'right' || direction === 'down' ? SIZE - 1 - step : step;
    if (direction === 'left' || direction === 'right') indices.push(index * SIZE + offset);
    else indices.push(offset * SIZE + index);
  }
  return indices;
}

/**
 * 执行一次移动。
 * @param {number[]} board
 * @param {'left' | 'right' | 'up' | 'down'} direction
 * @returns {{ board: number[], gained: number, moved: boolean }}
 */
export function move(board, direction) {
  const next = board.slice();
  let gained = 0;

  for (let index = 0; index < SIZE; index++) {
    const indices = lineIndices(direction, index);
    const result = slideLine(indices.map((i) => board[i]));
    gained += result.gained;
    indices.forEach((cell, position) => {
      next[cell] = result.line[position];
    });
  }

  const moved = next.some((value, index) => value !== board[index]);
  return { board: next, gained, moved };
}

/**
 * 是否还存在合法操作（空格或相邻同值）。
 * @param {number[]} board
 */
export function hasMoves(board) {
  if (board.some((value) => value === 0)) return true;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const value = board[row * SIZE + col];
      if (col + 1 < SIZE && value === board[row * SIZE + col + 1]) return true;
      if (row + 1 < SIZE && value === board[(row + 1) * SIZE + col]) return true;
    }
  }
  return false;
}
