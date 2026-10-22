import assert from 'node:assert/strict';
import test from 'node:test';

import { DAILY_STARS, STORAGE_KEY, Store, todayKey } from '../js/core/store.js';

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
  removeItem(key) {
    this.map.delete(key);
  }
}

test('初始状态为零', () => {
  const store = new Store(new MemoryStorage());
  assert.equal(store.state.stars, 0);
  assert.equal(store.state.rounds, 0);
  assert.equal(store.state.best, 0);
  assert.equal(store.state.daily, '');
  assert.equal(store.state.records.reaction, null);
  assert.equal(store.state.records.memory, 0);
});

test('完成一局会累加星星和局数，0 星也计一局', () => {
  const store = new Store(new MemoryStorage());
  store.completeRound(3);
  store.completeRound(0);
  assert.equal(store.state.stars, 3);
  assert.equal(store.state.rounds, 2);
});

test('负数星星会被夹到 0', () => {
  const store = new Store(new MemoryStorage());
  store.completeRound(-5);
  assert.equal(store.state.stars, 0);
  assert.equal(store.state.rounds, 1);
});

test('最高分只增不减', () => {
  const store = new Store(new MemoryStorage());
  assert.equal(store.setBestScore(120), true);
  assert.equal(store.setBestScore(80), false);
  assert.equal(store.state.best, 120);
});

test('反应时间越小越好，其它记录越大越好', () => {
  const store = new Store(new MemoryStorage());

  assert.equal(store.setRecord('reaction', 300, 'lower'), true);
  assert.equal(store.setRecord('reaction', 350, 'lower'), false);
  assert.equal(store.setRecord('reaction', 200, 'lower'), true);
  assert.equal(store.state.records.reaction, 200);

  assert.equal(store.setRecord('mole', 5), true);
  assert.equal(store.setRecord('mole', 3), false);
  assert.equal(store.state.records.mole, 5);
});

test('每日签到只能领取一次', () => {
  const store = new Store(new MemoryStorage());
  const date = new Date(2026, 9, 22);

  assert.equal(store.claimDaily(date), DAILY_STARS);
  assert.equal(store.state.stars, DAILY_STARS);
  assert.equal(store.claimDaily(date), 0);
  assert.equal(store.state.stars, DAILY_STARS);
  assert.equal(store.state.daily, '2026-10-22');
});

test('状态会写入存储并在新实例中恢复', () => {
  const storage = new MemoryStorage();
  const store = new Store(storage);

  store.completeRound(8);
  store.setBestScore(512);
  store.setRecord('memory', 3);
  store.claimDaily(new Date(2026, 9, 22));

  const restored = new Store(storage);
  assert.equal(restored.state.stars, 8 + DAILY_STARS);
  assert.equal(restored.state.best, 512);
  assert.equal(restored.state.records.memory, 3);
  assert.equal(restored.state.daily, '2026-10-22');
});

test('旧版存档（v1）可以平滑迁移', () => {
  const storage = new MemoryStorage();
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      stars: 42,
      rounds: 7,
      best: 2048,
      daily: '2026-10-21',
      records: { memory: 4, reaction: 210, guess: 2 },
    }),
  );

  const store = new Store(storage);
  assert.equal(store.state.stars, 42);
  assert.equal(store.state.rounds, 7);
  assert.equal(store.state.best, 2048);
  assert.equal(store.state.records.memory, 4);
  assert.equal(store.state.records.reaction, 210);
  assert.equal(store.state.records.guess, 2);
  // 新版新增字段使用默认值
  assert.equal(store.state.records.mole, 0);
  assert.equal(store.state.records.math, 0);
});

test('坏数据不会让页面崩溃', () => {
  const storage = new MemoryStorage();
  storage.setItem(STORAGE_KEY, '{ 这不是 JSON');

  const store = new Store(storage);
  assert.equal(store.state.stars, 0);
  assert.equal(store.state.records.reaction, null);
});

test('reset 清空所有记录', () => {
  const store = new Store(new MemoryStorage());
  store.completeRound(10);
  store.setBestScore(99);
  store.reset();

  assert.equal(store.state.stars, 0);
  assert.equal(store.state.rounds, 0);
  assert.equal(store.state.best, 0);
  assert.equal(store.state.records.reaction, null);
});

test('订阅会在状态变化时收到通知', () => {
  const store = new Store(new MemoryStorage());
  let calls = 0;
  const unsubscribe = store.subscribe(() => {
    calls += 1;
  });

  store.completeRound(1);
  assert.equal(calls, 1);

  unsubscribe();
  store.completeRound(1);
  assert.equal(calls, 1);
});

test('todayKey 输出本地日期', () => {
  assert.equal(todayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(todayKey(new Date(2026, 11, 31)), '2026-12-31');
});
