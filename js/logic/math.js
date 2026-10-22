/** 心算题生成：20 以内的加减法，减法保证结果不为负。 */

export const QUESTION_COUNT = 10;

/**
 * @typedef {object} Problem
 * @property {number} a
 * @property {number} b
 * @property {'+' | '−'} op
 * @property {number} answer
 * @property {string} text
 */

/**
 * @param {() => number} [random]
 * @returns {Problem}
 */
export function makeProblem(random = Math.random) {
  let a = 1 + Math.floor(random() * 20);
  let b = 1 + Math.floor(random() * 20);
  const plus = random() < 0.5;

  if (!plus && a < b) [a, b] = [b, a];

  return {
    a,
    b,
    op: plus ? '+' : '−',
    answer: plus ? a + b : a - b,
    text: `${a} ${plus ? '+' : '−'} ${b} = ?`,
  };
}
