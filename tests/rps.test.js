import assert from 'node:assert/strict';
import test from 'node:test';

import { CHOICES, judge } from '../js/logic/rps.js';

test('三种出拳的定义顺序与长度', () => {
  assert.equal(CHOICES.length, 3);
  assert.deepEqual(CHOICES.map((choice) => choice.id), ['rock', 'scissors', 'paper']);
});

test('相同时为平局', () => {
  for (let i = 0; i < 3; i++) assert.equal(judge(i, i), 'draw');
});

test('石头胜剪刀、剪刀胜布、布胜石头', () => {
  assert.equal(judge(0, 1), 'win');
  assert.equal(judge(1, 2), 'win');
  assert.equal(judge(2, 0), 'win');
});

test('反向组合为失败', () => {
  assert.equal(judge(1, 0), 'lose');
  assert.equal(judge(2, 1), 'lose');
  assert.equal(judge(0, 2), 'lose');
});

test('九种组合共 3 胜 3 负 3 平', () => {
  let wins = 0;
  let loses = 0;
  let draws = 0;
  for (let player = 0; player < 3; player++) {
    for (let opponent = 0; opponent < 3; opponent++) {
      const result = judge(player, opponent);
      if (result === 'win') wins++;
      if (result === 'lose') loses++;
      if (result === 'draw') draws++;
    }
  }
  assert.equal(wins, 3);
  assert.equal(loses, 3);
  assert.equal(draws, 3);
});
