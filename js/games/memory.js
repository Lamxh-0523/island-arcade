import { registerGame } from '../core/registry.js';

const ICONS = ['🍓', '🌷', '🐱', '⭐', '🍋', '🍀', '🍩', '🐳'];
const PAIRS = ICONS.length;

registerGame({
  id: 'memory',
  title: '记忆翻牌',
  icon: '🃏',
  tagline: '翻出相同卡片，训练记忆力',
  tone: 'b',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="status">
        <span data-ui="turns">翻牌次数 0</span>
        <span data-ui="pairs">已配对 0 / ${PAIRS}</span>
      </div>
      <div class="gamearea">
        <div class="memgrid" data-ui="grid" role="group" aria-label="记忆翻牌棋盘"></div>
        <p class="hint" data-ui="message" aria-live="polite">翻开两张相同图案的卡片</p>
        <button class="btn secondary small" type="button" data-ui="restart">再来一局</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const turnsEl = q('turns');
    const pairsEl = q('pairs');
    const messageEl = q('message');

    /** @type {{icon: string, faceUp: boolean, matched: boolean}[]} */
    let cards = [];
    /** @type {HTMLButtonElement[]} */
    let buttons = [];
    /** @type {number[]} */
    let opened = [];
    let locked = false;
    let matched = 0;
    let turns = 0;

    function shuffle(list) {
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return list;
    }

    function paint() {
      cards.forEach((card, index) => {
        const button = buttons[index];
        const revealed = card.faceUp || card.matched;
        button.classList.toggle('open', card.faceUp && !card.matched);
        button.classList.toggle('matched', card.matched);
        button.textContent = revealed ? card.icon : '？';
        button.disabled = card.matched;
        button.setAttribute(
          'aria-label',
          revealed ? `第 ${index + 1} 张卡片：${card.icon}` : `第 ${index + 1} 张卡片，未翻开`,
        );
      });
      turnsEl.textContent = `翻牌次数 ${turns}`;
      pairsEl.textContent = `已配对 ${matched} / ${PAIRS}`;
    }

    function build() {
      cards = shuffle([...ICONS, ...ICONS].map((icon) => ({ icon, faceUp: false, matched: false })));
      opened = [];
      locked = false;
      matched = 0;
      turns = 0;

      gridEl.innerHTML = cards
        .map(
          (_, index) =>
            `<button type="button" class="memcard" data-index="${index}" aria-label="第 ${index + 1} 张卡片，未翻开">？</button>`,
        )
        .join('');
      buttons = Array.from(gridEl.querySelectorAll('button'));
      paint();
    }

    function flip(index) {
      if (locked) return;

      const card = cards[index];
      if (!card || card.faceUp || card.matched) return;

      card.faceUp = true;
      opened.push(index);
      paint();

      if (opened.length < 2) return;

      turns += 1;
      const [first, second] = opened.map((i) => cards[i]);
      paint();

      if (first.icon === second.icon) {
        first.matched = true;
        second.matched = true;
        matched += 1;
        opened = [];
        paint();

        if (matched === PAIRS) {
          ctx.award(8);
          ctx.record('memory', ctx.state.records.memory + 1, 'higher');
          messageEl.textContent = '🎉 全部配对成功！你太棒啦！';
        }
      } else {
        locked = true;
        ctx.timeout(() => {
          first.faceUp = false;
          second.faceUp = false;
          opened = [];
          locked = false;
          paint();
        }, 800);
      }
    }

    ctx.listen(gridEl, 'click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-index]') : null;
      if (!target) return;
      flip(Number(target.dataset.index));
    });

    ctx.listen(q('restart'), 'click', () => {
      messageEl.textContent = '翻开两张相同图案的卡片';
      build();
    });

    build();
  },
});
