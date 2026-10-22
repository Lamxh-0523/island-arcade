import { registerGame } from '../core/registry.js';

const HOLES = 9;
const DURATION_MS = 30_000;
const TICK_MS = 700;
const MOVE_CHANCE = 0.55;

registerGame({
  id: 'mole',
  title: '打地鼠',
  icon: '🐹',
  tagline: '30 秒内抓住冒头的小地鼠',
  tone: 'b',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="status">
        <span data-ui="hits">命中 0</span>
        <span data-ui="time">剩余 30 秒</span>
      </div>
      <div class="gamearea">
        <p class="howto">点击冒出来的 🐹！每只地鼠只能点一次。</p>
        <div class="molegrid" data-ui="grid" role="group" aria-label="打地鼠棋盘"></div>
        <p class="hint" data-ui="message" aria-live="polite">准备好了吗？</p>
        <button class="btn small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const hitsEl = q('hits');
    const timeEl = q('time');
    const messageEl = q('message');

    /** @type {HTMLButtonElement[]} */
    const holes = [];
    for (let index = 0; index < HOLES; index++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'molehole';
      button.dataset.index = String(index);
      button.textContent = '🕳️';
      button.setAttribute('aria-label', `第 ${index + 1} 个洞，空`);
      holes.push(button);
    }
    gridEl.replaceChildren(...holes);

    let position = -1;
    let hits = 0;
    let endAt = 0;
    let finished = false;
    let tickId = 0;

    function paint() {
      holes.forEach((hole, index) => {
        const active = index === position;
        hole.classList.toggle('active', active);
        hole.textContent = active ? '🐹' : '🕳️';
        hole.setAttribute(
          'aria-label',
          active ? `第 ${index + 1} 个洞，有地鼠` : `第 ${index + 1} 个洞，空`,
        );
        hole.disabled = finished;
      });
    }

    function stop() {
      if (tickId) {
        ctx.clearTimer(tickId);
        tickId = 0;
      }
    }

    function finish() {
      stop();
      finished = true;
      position = -1;
      paint();

      const stars = Math.min(12, Math.floor(hits / 3));
      ctx.award(stars);
      ctx.record('mole', hits, 'higher');

      timeEl.textContent = '剩余 0 秒';
      messageEl.textContent = `挑战结束！打中了 ${hits} 只地鼠，获得 ${stars} ⭐`;
    }

    function tick() {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      timeEl.textContent = `剩余 ${left} 秒`;

      if (left === 0) {
        finish();
        return;
      }
      if (position === -1 || Math.random() < MOVE_CHANCE) {
        position = Math.floor(Math.random() * HOLES);
        paint();
      }
    }

    function start() {
      stop();
      position = -1;
      hits = 0;
      finished = false;
      endAt = Date.now() + DURATION_MS;

      hitsEl.textContent = '命中 0';
      timeEl.textContent = '剩余 30 秒';
      messageEl.textContent = '准备好了吗？';
      position = Math.floor(Math.random() * HOLES);
      paint();

      tickId = ctx.interval(tick, TICK_MS);
    }

    ctx.listen(gridEl, 'click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-index]') : null;
      if (!target) return;

      const index = Number(target.dataset.index);
      if (finished || position !== index) return;

      hits += 1;
      hitsEl.textContent = `命中 ${hits}`;
      position = -1;
      paint();
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
