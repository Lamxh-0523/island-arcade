/** 三连棋的纯逻辑：棋盘用 'x' / 'o' / '' 表示。 */

export const LINES = Object.freeze([
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
].map((line) => Object.freeze(line)));

export const CENTER = 4;
export const CORNERS = Object.freeze([0, 2, 6, 8]);
export const SIDES = Object.freeze([1, 3, 5, 7]);

/**
 * @param {string[]} board
 * @returns {'x' | 'o' | 'draw' | null}
 */
export function winner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

/**
 * 找出能让 mark 立刻获胜的位置，没有则返回 -1。
 * @param {string[]} board
 * @param {'x' | 'o'} mark
 */
export function findWinningMove(board, mark) {
  for (let index = 0; index < board.length; index++) {
    if (board[index]) continue;
    board[index] = mark;
    const wins = winner(board) === mark;
    board[index] = '';
    if (wins) return index;
  }
  return -1;
}

/**
 * 电脑落子：能赢就赢 → 挡住对手 → 占中心 → 占角 → 占边。
 * @param {string[]} board
 * @param {() => number} [random]
 */
export function computerMove(board, random = Math.random) {
  const win = findWinningMove(board, 'o');
  if (win !== -1) return win;

  const block = findWinningMove(board, 'x');
  if (block !== -1) return block;

  if (!board[CENTER]) return CENTER;

  const corners = CORNERS.filter((index) => !board[index]);
  if (corners.length) return corners[Math.floor(random() * corners.length)];

  const sides = SIDES.filter((index) => !board[index]);
  if (sides.length) return sides[Math.floor(random() * sides.length)];

  return -1;
}
