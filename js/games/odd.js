import { registerGame } from '../core/registry.js';

const ROUNDS = 10;

const PAIRS = [
  ['🍎', '🍏'],
  ['🐱', '🐯'],
  ['🌸', '🌺'],
  ['🍋', '🍊'],
  ['⭐', '🌟'],
  ['🐸', '🐢'],
];

registerGame({
  id: 'odd',
  title: '找不同图案',
  icon: '🔍',
  tagline: '在九宫格里找出特别的图案',
  tone: 'a',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span data-ui="progress">第 1 / ${ROUNDS} 题</span>
          <span data-ui="score">答对 0 题</span>
        </div>
        <p class="howto">九宫格里只有一个图案和其他不同，点击它。</p>
        <div class="odd-grid" data-ui="grid" role="group" aria-label="图案九宫格"></div>
        <p class="detail" data-ui="message" aria-live="polite">看仔细，找出唯一不同的图案。</p>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const progressEl = q('progress');
    const scoreEl = q('score');
    const messageEl = q('message');

    let round = 0;
    let score = 0;
    let target = -1;
    let locked = false;
    let finished = false;

    function renderRound() {
      const [common, odd] = PAIRS[Math.floor(Math.random() * PAIRS.length)];
      target = Math.floor(Math.random() * 9);

      gridEl.innerHTML = Array.from(
        { length: 9 },
        (_, index) =>
          `<button type="button" data-cell="${index}" aria-label="第 ${index + 1} 个图案">${index === target ? odd : common}</button>`,
      ).join('');

      progressEl.textContent = `第 ${round + 1} / ${ROUNDS} 题`;
      scoreEl.textContent = `答对 ${score} 题`;
      messageEl.textContent = '看仔细，找出唯一不同的图案。';
      locked = false;

      ctx.timeout(() => gridEl.querySelector('button')?.focus({ preventScroll: true }), 0);
    }

    function finish() {
      finished = true;
      ctx.award(score);
      ctx.record('odd', score, 'higher');

      progressEl.textContent = `${ROUNDS} / ${ROUNDS} 题`;
      promptSummary();
    }

    function promptSummary() {
      gridEl.replaceChildren();
      scoreEl.textContent = `答对 ${score} 题`;
      messageEl.textContent = `🏆 挑战结束，找对 ${score} / ${ROUNDS} 题，获得 ${score} ⭐`;
    }

    function choose(index) {
      if (locked || finished) return;
      locked = true;

      if (index === target) score += 1;
      scoreEl.textContent = `答对 ${score} 题`;
      messageEl.textContent = index === target ? '✅ 找到了！' : '❌ 这个不是，下一题再试试。';

      for (const button of gridEl.querySelectorAll('button')) button.disabled = true;
      round += 1;

      ctx.timeout(() => {
        if (round >= ROUNDS) finish();
        else renderRound();
      }, 350);
    }

    function start() {
      round = 0;
      score = 0;
      locked = false;
      finished = false;
      scoreEl.textContent = '答对 0 题';
      renderRound();
    }

    ctx.listen(gridEl, 'click', (event) => {
      const cell = event.target instanceof Element ? event.target.closest('[data-cell]') : null;
      if (!cell) return;
      choose(Number(cell.dataset.cell));
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
