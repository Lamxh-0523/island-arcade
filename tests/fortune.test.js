import assert from 'node:assert/strict';
import test from 'node:test';

import { getFortune, starString } from '../js/logic/fortune.js';

const LEVEL_NAMES = new Set(['大吉', '中吉', '小吉', '末吉', '平']);

test('同一天多次生成结果完全一致', () => {
  const first = getFortune('2026-10-23');
  const second = getFortune('2026-10-23');
  assert.deepEqual(first, second);
});

test('不同日期会给出不同结果', () => {
  const days = ['2026-10-23', '2026-10-24', '2026-10-25'];
  const signatures = days.map((day) => JSON.stringify(getFortune(day)));
  assert.equal(new Set(signatures).size, days.length);
});

test('字段完整且取值范围合法', () => {
  for (let month = 1; month <= 12; month++) {
    for (let day = 1; day <= 28; day += 3) {
      const key = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const fortune = getFortune(key);

      assert.equal(fortune.date, key);
      assert.ok(LEVEL_NAMES.has(fortune.level.name));
      assert.ok(Number.isInteger(fortune.level.stars));
      assert.ok(fortune.level.stars >= 1 && fortune.level.stars <= 5);
      assert.ok(fortune.level.emoji.length > 0);

      assert.ok(fortune.summary.length > 0);
      assert.ok(fortune.tip.length > 0);
      assert.ok(fortune.keyword.length > 0);

      assert.equal(fortune.good.length, 2);
      assert.equal(fortune.bad.length, 2);
      assert.equal(new Set(fortune.good).size, 2);
      assert.equal(new Set(fortune.bad).size, 2);

      assert.match(fortune.color.hex, /^#[0-9a-f]{6}$/i);
      assert.ok(fortune.color.name.length > 0);
      assert.ok(Number.isInteger(fortune.number));
      assert.ok(fortune.number >= 1 && fortune.number <= 99);
      assert.match(fortune.hour, /^\d{2}:\d{2}–\d{2}:\d{2}$/);
    }
  }
});

test('一年内的运势有足够变化', () => {
  const levels = new Set();
  const colors = new Set();
  for (let day = 0; day < 120; day++) {
    const date = new Date(Date.UTC(2026, 0, 1 + day));
    const key = date.toISOString().slice(0, 10);
    const fortune = getFortune(key);
    levels.add(fortune.level.name);
    colors.add(fortune.color.name);
  }
  assert.ok(levels.size >= 3, `运势等级变化过少：${[...levels].join('、')}`);
  assert.ok(colors.size >= 4, `幸运色变化过少：${colors.size}`);
});

test('非法日期格式会报错', () => {
  assert.throws(() => getFortune('2026/10/23'), /YYYY-MM-DD/);
  assert.throws(() => getFortune(''), /YYYY-MM-DD/);
  assert.throws(() => getFortune(null), /YYYY-MM-DD/);
});

test('星级字符串补齐 5 位', () => {
  assert.equal(starString(5), '★★★★★');
  assert.equal(starString(3), '★★★☆☆');
  assert.equal(starString(0), '☆☆☆☆☆');
  assert.equal(starString(9), '★★★★★');
});
