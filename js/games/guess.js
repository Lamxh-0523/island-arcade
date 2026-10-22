import { registerGame } from '../core/registry.js';

registerGame({
  id: 'guess',
  title: '神秘数字',
  icon: '🔮',
  tagline: '猜中 1～100 的隐藏数字',
  tone: 'd',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <p class="hint" data-ui="hint" aria-live="polite">我心里有一个 1～100 的整数，你能猜到吗？</p>
        <form class="inline" data-ui="form" novalidate>
          <input
            type="number" inputmode="numeric" min="1" max="100" step="1"
            class="guessinput" data-ui="input"
            aria-label="输入 1 到 100 之间的整数" placeholder="1-100">
          <button class="btn" type="submit" data-ui="submit">猜一猜</button>
        </form>
        <p class="detail" data-ui="turns">已猜 0 次</p>
        <button class="btn secondary small" type="button" data-ui="restart">换一个数字</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const form = q('form');
    const input = q('input');
    const submitBtn = q('submit');
    const hintEl = q('hint');
    const turnsEl = q('turns');

    let secret = 0;
    let count = 0;
    let finished = false;

    function reset() {
      secret = 1 + Math.floor(Math.random() * 100);
      count = 0;
      finished = false;
      hintEl.textContent = '我心里有一个 1～100 的整数，你能猜到吗？';
      turnsEl.textContent = '已猜 0 次';
      input.value = '';
      submitBtn.disabled = false;
      input.focus();
    }

    ctx.listen(form, 'submit', (event) => {
      event.preventDefault();
      if (finished) return;

      const raw = input.value.trim();
      const value = Number(raw);

      if (!raw || !Number.isInteger(value) || value < 1 || value > 100) {
        ctx.toast('请输入 1～100 之间的整数');
        input.focus();
        return;
      }

      count += 1;
      turnsEl.textContent = `已猜 ${count} 次`;

      if (value === secret) {
        finished = true;
        const stars = Math.max(2, 12 - count);
        ctx.record('guess', ctx.state.records.guess + 1, 'higher');
        ctx.award(stars);
        hintEl.textContent = `🎉 猜对啦！答案是 ${secret}，总共猜了 ${count} 次，获得 ${stars} ⭐。`;
        submitBtn.disabled = true;
      } else {
        hintEl.textContent =
          value > secret ? '⬇️ 大了一点，试试更小的数字！' : '⬆️ 小了一点，试试更大的数字！';
        input.value = '';
        input.focus();
      }
    });

    ctx.listen(q('restart'), 'click', reset);

    reset();
  },
});
