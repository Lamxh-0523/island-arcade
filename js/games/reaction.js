import { registerGame } from '../core/registry.js';

registerGame({
  id: 'reaction',
  title: '反应力挑战',
  icon: '⚡',
  tagline: '看到绿色再点击，比比谁更快',
  tone: 'c',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span>看到绿色后立即点击</span>
          <span data-ui="best">最好 — ms</span>
        </div>
        <button type="button" class="reaction" data-ui="panel">
          <span data-ui="emoji" aria-hidden="true">⚡</span>
          <strong data-ui="text" aria-live="polite">点击这里开始</strong>
          <small data-ui="hint">红色时请等待，绿色时立即点击</small>
        </button>
        <p class="detail" data-ui="message" aria-live="polite"></p>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const panel = q('panel');
    const emojiEl = q('emoji');
    const textEl = q('text');
    const hintEl = q('hint');
    const bestEl = q('best');
    const messageEl = q('message');

    /** @type {'idle' | 'waiting' | 'go' | 'early' | 'result'} */
    let phase = 'idle';
    let startedAt = 0;
    let waitTimer = 0;

    function paintBest() {
      const best = ctx.state.records.reaction;
      bestEl.textContent = best ? `最好 ${best} ms` : '最好 — ms';
    }

    function clearWait() {
      if (waitTimer) {
        ctx.clearTimer(waitTimer);
        waitTimer = 0;
      }
    }

    function arm() {
      clearWait();
      phase = 'waiting';
      panel.className = 'reaction ready';
      emojiEl.textContent = '⏳';
      textEl.textContent = '等待变绿……';
      hintEl.textContent = '现在不要点击';
      messageEl.textContent = '随机 1.5～4 秒后变绿，提前点击算失败。';

      waitTimer = ctx.timeout(() => {
        waitTimer = 0;
        phase = 'go';
        startedAt = performance.now();
        panel.className = 'reaction go';
        emojiEl.textContent = '💚';
        textEl.textContent = '快点击！';
        hintEl.textContent = '现在！';
      }, 1500 + Math.random() * 2600);
    }

    function handleClick() {
      if (phase === 'idle' || phase === 'result' || phase === 'early') {
        arm();
        return;
      }

      if (phase === 'waiting') {
        clearWait();
        phase = 'early';
        panel.className = 'reaction';
        emojiEl.textContent = '🙈';
        textEl.textContent = '太早啦，再试一次';
        hintEl.textContent = '点击重试';
        messageEl.textContent = '提前点击不计成绩，再来一次吧。';
        return;
      }

      const elapsed = Math.round(performance.now() - startedAt);
      phase = 'result';
      panel.className = 'reaction';
      emojiEl.textContent = '🏁';
      textEl.textContent = `${elapsed} 毫秒`;
      hintEl.textContent = '点击再测一次';

      const isBest = ctx.record('reaction', elapsed, 'lower');
      ctx.award(isBest ? 2 : 0);

      if (isBest) {
        messageEl.textContent = `🎉 新纪录！${elapsed} ms，+2 ⭐`;
      } else {
        const best = ctx.state.records.reaction;
        messageEl.textContent = `本次 ${elapsed} ms，未刷新纪录（最好 ${best} ms），+0 ⭐`;
      }
      paintBest();
    }

    function reset() {
      clearWait();
      phase = 'idle';
      panel.className = 'reaction';
      emojiEl.textContent = '⚡';
      textEl.textContent = '点击这里开始';
      hintEl.textContent = '红色时请等待，绿色时立即点击';
      messageEl.textContent = '';
      paintBest();
    }

    ctx.listen(panel, 'click', handleClick);
    ctx.listen(q('restart'), 'click', reset);
    ctx.onDispose(clearWait);

    paintBest();
  },
});
