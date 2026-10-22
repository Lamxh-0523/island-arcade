import assert from 'node:assert/strict';
import test from 'node:test';

// 触发内置游戏注册（模块顶层只调用 registerGame，不访问 DOM）
import '../js/games/index.js';
import { getGame, getGames, registerGame } from '../js/core/registry.js';

const EXPECTED_ORDER = ['2048', 'memory', 'reaction', 'guess', 'mole', 'rps', 'ttt', 'math'];

test('八款游戏按顺序注册', () => {
  assert.deepEqual(getGames().map((game) => game.id), EXPECTED_ORDER);
});

test('每个游戏都有渲染所需的元数据', () => {
  for (const game of getGames()) {
    assert.equal(typeof game.title, 'string');
    assert.ok(game.title.length > 0);
    assert.equal(typeof game.icon, 'string');
    assert.ok(game.icon.length > 0);
    assert.equal(typeof game.tagline, 'string');
    assert.ok(game.tagline.length > 0);
    assert.equal(typeof game.mount, 'function');
    assert.ok(['a', 'b', 'c', 'd'].includes(game.tone));
  }
});

test('按 id 查找游戏', () => {
  assert.equal(getGame('2048')?.title, '2048 数字合并');
  assert.equal(getGame('not-exist'), null);
});

test('重复 id 会被拒绝', () => {
  const definition = {
    id: 'demo',
    title: '示例',
    icon: '🧪',
    tagline: '测试用',
    mount() {},
  };

  registerGame(definition);
  assert.throws(() => registerGame(definition), /重复注册/);
  assert.equal(getGame('demo')?.tone, 'a', '未指定配色时默认 a');
});

test('非法定义会被拒绝', () => {
  assert.throws(() => registerGame(null), /游戏定义对象/);
  assert.throws(
    () => registerGame({ id: 'Bad ID', title: 'x', icon: 'x', tagline: 'x', mount() {} }),
    /无效的游戏 id/,
  );
  assert.throws(
    () => registerGame({ id: 'missing-mount', title: 'x', icon: 'x', tagline: 'x' }),
    /缺少 mount/,
  );
  assert.throws(
    () => registerGame({ id: 'missing-title', icon: 'x', tagline: 'x', mount() {} }),
    /缺少 title/,
  );
});
