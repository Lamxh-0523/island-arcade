import { registerGame } from '../core/registry.js';

const DURATION_MS = 20_000;
const TICK_MS = 150;
const MAX_STARS = 20;

registerGame({
  id: 'target',
  title: '点点挑战',
  icon: '🎯',
  tagline: '20 秒内快速点击目标',
  tone: 'c',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span data-ui="time">剩余 20 秒</span>
          <span data-ui="hits">命中 0 次</span>
        </div>
        <div class="target-field" data-ui="field">
          <button type="button" class="target-dot" data-ui="dot" aria-label="点击目标">🎯</button>
        </div>
        <p class="detail" data-ui="message" aria-live="polite">快速点击不断移动的目标，每 2 次命中得 1 颗星星。</p>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const dot = q('dot');
    const timeEl = q('time');
    const hitsEl = q('hits');
    const messageEl = q('message');

    let hits = 0;
    let endAt = 0;
    let finished = false;
    let timerId = 0;

    function move() {
      dot.style.left = `${6 + Math.random() * 68}%`;
      dot.style.top = `${6 + Math.random() * 60}%`;
    }

    function stop() {
      if (timerId) {
        ctx.clearTimer(timerId);
        timerId = 0;
      }
    }

    function finish() {
      stop();
      finished = true;
      dot.disabled = true;
      timeEl.textContent = '剩余 0 秒';

      const stars = Math.min(MAX_STARS, Math.floor(hits / 2));
      ctx.award(stars);
      ctx.record('target', hits, 'higher');
      messageEl.textContent = `时间到！命中 ${hits} 次，获得 ${stars} ⭐`;
    }

    function tick() {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      timeEl.textContent = `剩余 ${left} 秒`;
      if (left === 0) finish();
    }

    function start() {
      stop();
      hits = 0;
      finished = false;
      endAt = Date.now() + DURATION_MS;

      hitsEl.textContent = '命中 0 次';
      timeEl.textContent = '剩余 20 秒';
      messageEl.textContent = '快速点击不断移动的目标，每 2 次命中得 1 颗星星。';
      dot.disabled = false;
      move();
      dot.focus({ preventScroll: true });

      timerId = ctx.interval(tick, TICK_MS);
    }

    ctx.listen(dot, 'click', () => {
      if (finished) return;
      hits += 1;
      hitsEl.textContent = `命中 ${hits} 次`;
      move();
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
