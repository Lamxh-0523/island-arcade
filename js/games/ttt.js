import { registerGame } from '../core/registry.js';
import { computerMove, winner } from '../logic/ttt.js';

const MARKS = { x: '❌', o: '⭕' };

registerGame({
  id: 'ttt',
  title: '三连棋',
  icon: '⭕',
  tagline: '连成一条线，战胜电脑对手',
  tone: 'd',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <p class="howto">你是 ❌，电脑是 ⭕。率先连成三格即获胜。</p>
        <div class="tttgrid" data-ui="grid" role="group" aria-label="三连棋棋盘"></div>
        <p class="hint" data-ui="message" aria-live="polite">轮到你啦！</p>
        <button class="btn small secondary" type="button" data-ui="restart">再来一局</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const gridEl = q('grid');
    const messageEl = q('message');

    gridEl.innerHTML = Array.from(
      { length: 9 },
      (_, index) =>
        `<button type="button" class="tttcell" data-index="${index}" aria-label="棋盘位置 ${index + 1}，空"></button>`,
    ).join('');

    /** @type {HTMLButtonElement[]} */
    const cells = Array.from(gridEl.querySelectorAll('button'));

    /** @type {('' | 'x' | 'o')[]} */
    let board = Array(9).fill('');
    let over = false;

    function paint() {
      cells.forEach((cell, index) => {
        const mark = board[index];
        cell.textContent = mark ? MARKS[mark] : '';
        cell.disabled = over || Boolean(mark);
        cell.setAttribute(
          'aria-label',
          mark
            ? `棋盘位置 ${index + 1}：${mark === 'x' ? '你' : '电脑'}`
            : `棋盘位置 ${index + 1}，空`,
        );
      });
    }

    function finish(result) {
      over = true;
      paint();

      if (result === 'x') {
        ctx.record('ttt', ctx.state.records.ttt + 1, 'higher');
        ctx.award(8);
        messageEl.textContent = '🎉 你赢啦！获得 8 ⭐';
      } else if (result === 'draw') {
        ctx.award(2);
        messageEl.textContent = '平局！再来一局，获得 2 ⭐';
      } else {
        ctx.award(0);
        messageEl.textContent = '电脑获胜，再试一次吧';
      }
    }

    function play(index) {
      if (over || board[index]) return;

      board[index] = 'x';
      let result = winner(board);

      if (!result) {
        const move = computerMove(board);
        if (move !== -1) board[move] = 'o';
        result = winner(board);
      }

      paint();
      if (result) finish(result);
    }

    function reset() {
      board = Array(9).fill('');
      over = false;
      messageEl.textContent = '轮到你啦！';
      paint();
    }

    ctx.listen(gridEl, 'click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-index]') : null;
      if (!target) return;
      play(Number(target.dataset.index));
    });

    ctx.listen(q('restart'), 'click', reset);

    reset();
  },
});
