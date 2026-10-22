import { registerGame } from '../core/registry.js';

const ROUNDS = 10;

const COLORS = [
  { name: '红色', value: '#ed6a78' },
  { name: '蓝色', value: '#649ae6' },
  { name: '绿色', value: '#60c69c' },
  { name: '黄色', value: '#f0c14d' },
  { name: '紫色', value: '#a58ce6' },
  { name: '橙色', value: '#f6a65d' },
];

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

registerGame({
  id: 'color',
  title: '颜色挑战',
  icon: '🎨',
  tagline: '找到指定颜色，连续答对加分',
  tone: 'b',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span data-ui="progress">第 1 / ${ROUNDS} 题</span>
          <span data-ui="score">答对 0 题</span>
        </div>
        <h2 data-ui="prompt" style="font-size:24px;margin:18px 0">准备开始</h2>
        <div class="color-grid" data-ui="grid" role="group" aria-label="颜色选项"></div>
        <p class="detail" data-ui="message" aria-live="polite">看颜色，点击对应色块</p>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const progressEl = q('progress');
    const scoreEl = q('score');
    const promptEl = q('prompt');
    const messageEl = q('message');

    let round = 0;
    let score = 0;
    let target = -1;
    let locked = false;
    let finished = false;

    function renderChoices() {
      const options = shuffle([...COLORS.keys()]).slice(0, 4);
      target = options[Math.floor(Math.random() * options.length)];

      gridEl.innerHTML = options
        .map(
          (index) =>
            `<button type="button" data-color="${index}" style="background:${COLORS[index].value}" aria-label="${COLORS[index].name}"></button>`,
        )
        .join('');

      progressEl.textContent = `第 ${round + 1} / ${ROUNDS} 题`;
      scoreEl.textContent = `答对 ${score} 题`;
      promptEl.textContent = `请选择「${COLORS[target].name}」`;
      messageEl.textContent = '看颜色，点击对应色块';
      locked = false;

      // 上一轮的按钮已被替换，把焦点交给第一个色块，键盘也能继续玩
      ctx.timeout(() => gridEl.querySelector('button')?.focus({ preventScroll: true }), 0);
    }

    function finish() {
      finished = true;
      ctx.award(score);
      ctx.record('color', score, 'higher');

      progressEl.textContent = `${ROUNDS} / ${ROUNDS} 题`;
      scoreEl.textContent = `答对 ${score} 题`;
      promptEl.textContent = '🎉 完成！';
      gridEl.replaceChildren();
      messageEl.textContent = `共答对 ${score} / ${ROUNDS} 题，获得 ${score} ⭐`;
    }

    function choose(index) {
      if (locked || finished) return;
      locked = true;

      if (index === target) score += 1;
      scoreEl.textContent = `答对 ${score} 题`;
      messageEl.textContent =
        index === target
          ? '✅ 答对了！'
          : `❌ 正确答案是「${COLORS[target].name}」`;

      for (const button of gridEl.querySelectorAll('button')) button.disabled = true;
      round += 1;

      ctx.timeout(() => {
        if (round >= ROUNDS) finish();
        else renderChoices();
      }, 350);
    }

    function start() {
      round = 0;
      score = 0;
      finished = false;
      locked = false;
      scoreEl.textContent = '答对 0 题';
      renderChoices();
    }

    ctx.listen(gridEl, 'click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-color]') : null;
      if (!button) return;
      choose(Number(button.dataset.color));
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
