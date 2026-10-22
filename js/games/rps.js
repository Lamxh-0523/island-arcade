import { registerGame } from '../core/registry.js';
import { CHOICES, judge, RESULT_LABEL } from '../logic/rps.js';

const ROUNDS = 5;

registerGame({
  id: 'rps',
  title: '石头剪刀布',
  icon: '✊',
  tagline: '和小岛机器人进行五回合比赛',
  tone: 'c',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="status">
        <span data-ui="round">第 1 / ${ROUNDS} 回合</span>
        <span data-ui="score">获胜 0 次</span>
      </div>
      <div class="gamearea">
        <p class="howto">选择石头、剪刀或布，五回合结束结算星星。</p>
        <div class="controls" data-ui="choices" role="group" aria-label="选择出拳"></div>
        <p class="hint" data-ui="message" aria-live="polite">请出拳！</p>
        <button class="btn small secondary" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const choicesEl = q('choices');
    const roundEl = q('round');
    const scoreEl = q('score');
    const messageEl = q('message');

    choicesEl.innerHTML = CHOICES.map(
      (choice, index) => `
        <button type="button" class="choicebtn" data-choice="${index}" aria-label="${choice.label}">
          ${choice.emoji}<br><small>${choice.label}</small>
        </button>`,
    ).join('');

    /** @type {HTMLButtonElement[]} */
    const buttons = Array.from(choicesEl.querySelectorAll('button'));

    let round = 0;
    let wins = 0;
    let draws = 0;

    function reset() {
      round = 0;
      wins = 0;
      draws = 0;
      buttons.forEach((button) => {
        button.disabled = false;
      });
      roundEl.textContent = `第 1 / ${ROUNDS} 回合`;
      scoreEl.textContent = '获胜 0 次';
      messageEl.textContent = '请出拳！';
    }

    function choose(playerIndex) {
      if (round >= ROUNDS) return;

      const opponentIndex = Math.floor(Math.random() * CHOICES.length);
      const result = judge(playerIndex, opponentIndex);
      round += 1;

      if (result === 'win') wins += 1;
      if (result === 'draw') draws += 1;

      messageEl.textContent =
        `你 ${CHOICES[playerIndex].emoji} 对手 ${CHOICES[opponentIndex].emoji}：${RESULT_LABEL[result]}`;
      scoreEl.textContent = `获胜 ${wins} 次`;
      roundEl.textContent = `已进行 ${round} / ${ROUNDS} 回合`;

      if (round === ROUNDS) {
        buttons.forEach((button) => {
          button.disabled = true;
        });

        const stars = wins * 2;
        ctx.award(stars);
        ctx.record('rps', wins, 'higher');
        messageEl.textContent += ` · 比赛结束！获胜 ${wins} 次，平局 ${draws} 次，获得 ${stars} ⭐`;
      }
    }

    ctx.listen(choicesEl, 'click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-choice]') : null;
      if (!target) return;
      choose(Number(target.dataset.choice));
    });

    ctx.listen(q('restart'), 'click', reset);

    reset();
  },
});
