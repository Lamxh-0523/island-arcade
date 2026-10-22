import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addRandomTile,
  createBoard,
  emptyCells,
  hasMoves,
  maxTile,
  move,
} from '../js/logic/2048.js';

/** @param {number[][]} rows */
const boardOf = (rows) => rows.flat();

test('向左：相邻相同合并且不连锁', () => {
  const result = move(boardOf([[2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
  assert.equal(result.moved, true);
  assert.equal(result.gained, 4);
  assert.deepEqual(result.board.slice(0, 4), [4, 4, 0, 0]);
});

test('向左：四个相同只合并成两个', () => {
  const result = move(boardOf([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
  assert.equal(result.gained, 8);
  assert.deepEqual(result.board.slice(0, 4), [4, 4, 0, 0]);
});

test('向左：[2,2,2,0] 只合并一次', () => {
  const result = move(boardOf([[2, 2, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
  assert.equal(result.gained, 4);
  assert.deepEqual(result.board.slice(0, 4), [4, 2, 0, 0]);
});

test('向右移动靠右排列', () => {
  const result = move(boardOf([[2, 2, 4, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'right');
  assert.deepEqual(result.board.slice(0, 4), [0, 0, 4, 8]);
  assert.equal(result.gained, 12);
});

test('向上/向下按列合并', () => {
  const board = boardOf([
    [2, 0, 0, 0],
    [2, 0, 0, 0],
    [4, 0, 0, 0],
    [4, 0, 0, 0],
  ]);

  const up = move(board, 'up');
  assert.deepEqual([up.board[0], up.board[4], up.board[8], up.board[12]], [4, 8, 0, 0]);
  assert.equal(up.gained, 12);

  const down = move(board, 'down');
  assert.deepEqual([down.board[0], down.board[4], down.board[8], down.board[12]], [0, 0, 4, 8]);
});

test('没有变化时 moved 为 false，且不修改原棋盘', () => {
  const board = boardOf([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
  const snapshot = board.slice();
  const result = move(board, 'left');
  assert.equal(result.moved, false);
  assert.deepEqual(board, snapshot);
});

test('满盘且有相邻同值时仍可移动', () => {
  assert.equal(hasMoves(boardOf([[2, 2, 4, 8], [4, 8, 16, 32], [2, 4, 8, 16], [4, 8, 16, 32]])), true);
});

test('满盘且无相邻同值时无路可走', () => {
  assert.equal(hasMoves(boardOf([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]])), false);
});

test('空棋盘只要还有空格就能移动', () => {
  assert.equal(hasMoves(createBoard()), true);
  assert.equal(emptyCells(createBoard()).length, 16);
});

test('addRandomTile 只填空格，且放的是 2 或 4', () => {
  const board = createBoard();
  const index = addRandomTile(board, () => 0);
  assert.equal(index, 0);
  assert.equal(board[0], 2);

  const full = boardOf([[2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]]);
  assert.equal(addRandomTile(full, () => 0), -1);
});

test('maxTile 返回最大值', () => {
  assert.equal(maxTile([0, 2, 64, 4]), 64);
  assert.equal(maxTile(createBoard()), 0);
});
