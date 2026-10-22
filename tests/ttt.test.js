import assert from 'node:assert/strict';
import test from 'node:test';

import { computerMove, findWinningMove, winner } from '../js/logic/ttt.js';

/** @param {string} pattern 9 个字符，'-' 表示空 */
const boardOf = (pattern) => [...pattern].map((char) => (char === '-' ? '' : char));

test('识别横向、纵向、对角线获胜', () => {
  assert.equal(winner(boardOf('xxx------')), 'x');
  assert.equal(winner(boardOf('o--o--o--')), 'o');
  assert.equal(winner(boardOf('x---x---x')), 'x');
  assert.equal(winner(boardOf('x---x--x-')), null);
});

test('满盘无连线判为平局', () => {
  assert.equal(winner(boardOf('xoxxoooxx')), 'draw');
});

test('findWinningMove 找到制胜点，没有则返回 -1', () => {
  assert.equal(findWinningMove(boardOf('oo-------'), 'o'), 2);
  assert.equal(findWinningMove(boardOf('xx-------'), 'x'), 2);
  assert.equal(findWinningMove(boardOf('---------'), 'x'), -1);
});

test('电脑优先自己取胜', () => {
  // 电脑 o 在 0、1；玩家 x 在 3、4；电脑应直接落在 2 获胜
  assert.equal(computerMove(boardOf('oo-xx----'), () => 0), 2);
});

test('电脑其次堵住玩家', () => {
  // 玩家 x 在 0、1；电脑 o 在 3；电脑必须堵 2
  assert.equal(computerMove(boardOf('xx-o-----'), () => 0), 2);
});

test('空盘先占中心', () => {
  assert.equal(computerMove(boardOf('---------'), () => 0), 4);
});

test('中心被占后优先占角', () => {
  const board = boardOf('----x----');
  const move = computerMove(board, () => 0);
  assert.equal(board[move], '');
  assert.ok([0, 2, 6, 8].includes(move), `期望落在角上，实际 ${move}`);
});
