import { registerGame } from '../core/registry.js';

const PADS = 4;
const MAX_STARS = 20;

registerGame({
  id: 'sequence',
  title: '记忆顺序',
  icon: '🧠',
  tagline: '记住闪烁顺序并依次点击',
  tone: 'd',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span data-ui="level">第 1 关</span>
          <span data-ui="message" aria-live="polite">记住亮起顺序</span>
        </div>
        <p class="howto">四个色块会依次亮起，请按相同顺序点击。答错即结束。</p>
        <div class="sequence-grid" data-ui="grid" role="group" aria-label="记忆顺序色块">
          <button type="button" class="sequence-pad" data-pad="0" aria-label="色块 1"></button>
          <button type="button" class="sequence-pad" data-pad="1" aria-label="色块 2"></button>
          <button type="button" class="sequence-pad" data-pad="2" aria-label="色块 3"></button>
          <button type="button" class="sequence-pad" data-pad="3" aria-label="色块 4"></button>
        </div>
        <p class="detail" data-ui="hint" aria-live="polite">越往后越长，量力而行。</p>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const levelEl = q('level');
    const messageEl = q('message');
    const hintEl = q('hint');

    const pads = Array.from(gridEl.querySelectorAll('[data-pad]'));

    /** @type {number[]} */
    let pattern = [];
    let inputIndex = 0;
    let locked = true;
    let finished = false;

    function flash(index, on) {
      pads[index]?.classList.toggle('lit', on);
    }

    function showPattern() {
      locked = true;
      messageEl.textContent = '请观看';
      hintEl.textContent = '先看，后点。';

      pattern.forEach((pad, index) => {
        ctx.timeout(() => flash(pad, true), 550 + index * 750);
        ctx.timeout(() => flash(pad, false), 1000 + index * 750);
      });

      ctx.timeout(() => {
        locked = false;
        messageEl.textContent = '轮到你了';
        inputIndex = 0;
      }, 650 + pattern.length * 750);
    }

    function nextRound() {
      if (finished) return;
      pattern.push(Math.floor(Math.random() * PADS));
      levelEl.textContent = `第 ${pattern.length} 关`;
      showPattern();
    }

    function endGame() {
      finished = true;
      locked = true;
      const reached = pattern.length - 1;
      const stars = Math.min(MAX_STARS, reached);

      ctx.award(stars);
      ctx.record('sequence', reached, 'higher');
      hintEl.textContent = `记错了！闯过 ${reached} 关，获得 ${stars} ⭐`;
      messageEl.textContent = '本局结束';
    }

    function tap(index) {
      if (locked || finished) return;

      if (index !== pattern[inputIndex]) {
        endGame();
        return;
      }

      inputIndex += 1;
      if (inputIndex === pattern.length) {
        locked = true;
        messageEl.textContent = '✅ 答对啦！';
        ctx.timeout(nextRound, 800);
      }
    }

    function start() {
      pattern = [];
      inputIndex = 0;
      locked = true;
      finished = false;

      pads.forEach((pad) => pad.classList.remove('lit'));
      levelEl.textContent = '第 1 关';
      messageEl.textContent = '记住亮起顺序';
      hintEl.textContent = '越往后越长，量力而行。';

      nextRound();
    }

    ctx.listen(gridEl, 'click', (event) => {
      const pad = event.target instanceof Element ? event.target.closest('[data-pad]') : null;
      if (!pad) return;
      tap(Number(pad.dataset.pad));
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
