import assert from 'node:assert/strict';
import test from 'node:test';

import { makeProblem, QUESTION_COUNT } from '../js/logic/math.js';

test('题量为 10', () => {
  assert.equal(QUESTION_COUNT, 10);
});

test('生成 500 道题，答案、范围、文案都合法', () => {
  for (let i = 0; i < 500; i++) {
    const problem = makeProblem();

    assert.ok(problem.a >= 1 && problem.a <= 20, `a 越界：${problem.a}`);
    assert.ok(problem.b >= 1 && problem.b <= 20, `b 越界：${problem.b}`);
    assert.ok(problem.op === '+' || problem.op === '−');

    const expected = problem.op === '+' ? problem.a + problem.b : problem.a - problem.b;
    assert.equal(problem.answer, expected);
    assert.ok(problem.answer >= 0, '减法结果不应为负');
    assert.equal(problem.text, `${problem.a} ${problem.op} ${problem.b} = ?`);
  }
});

test('可以注入随机数，方便复现', () => {
  const values = [0, 0, 0]; // a=1, b=1, 加法
  let index = 0;
  const problem = makeProblem(() => values[index++ % values.length]);
  assert.deepEqual(
    { a: problem.a, b: problem.b, op: problem.op, answer: problem.answer },
    { a: 1, b: 1, op: '+', answer: 2 },
  );
});
