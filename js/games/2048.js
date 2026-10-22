import { registerGame } from '../core/registry.js';
import { addRandomTile, createBoard, hasMoves, maxTile, move } from '../logic/2048.js';

const DIRECTIONS = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

registerGame({
  id: '2048',
  title: '2048 数字合并',
  icon: '🔢',
  tagline: '动动脑筋，挑战合出 2048',
  tone: 'a',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="status">
        <span data-ui="score">分数 0</span>
        <span data-ui="best">最高 0</span>
      </div>
      <div class="gamearea">
        <div class="tilegrid" data-ui="board" aria-hidden="true"></div>
        <div class="controls" role="group" aria-label="移动方向">
          <button type="button" data-dir="up" aria-label="向上移动">↑</button>
          <button type="button" data-dir="left" aria-label="向左移动">←</button>
          <button type="button" data-dir="down" aria-label="向下移动">↓</button>
          <button type="button" data-dir="right" aria-label="向右移动">→</button>
        </div>
        <button class="btn secondary small" type="button" data-ui="restart">重新开始</button>
        <p class="detail" data-ui="message" aria-live="polite">
          电脑键盘方向键 / 手机按钮或滑动均可操作。合并相同数字。
        </p>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const boardEl = q('board');
    const scoreEl = q('score');
    const bestEl = q('best');
    const messageEl = q('message');
    const restartBtn = q('restart');

    let board = createBoard();
    let score = 0;
    let reached2048 = false;
    let finished = false;

    function render() {
      boardEl.innerHTML = board
        .map((value) => `<div class="tile" data-v="${value}">${value || ''}</div>`)
        .join('');
      scoreEl.textContent = `分数 ${score}`;
      bestEl.textContent = `最高 ${ctx.state.best}`;
    }

    function restart() {
      board = createBoard();
      score = 0;
      reached2048 = false;
      finished = false;
      addRandomTile(board);
      addRandomTile(board);
      messageEl.textContent = '电脑键盘方向键 / 手机按钮或滑动均可操作。合并相同数字。';
      render();
    }

    function play(direction) {
      if (finished) return;

      const result = move(board, direction);
      if (!result.moved) return;

      board = result.board;
      score += result.gained;
      addRandomTile(board);

      if (ctx.setBestScore(score)) bestEl.textContent = `最高 ${ctx.state.best}`;
      render();

      if (!reached2048 && maxTile(board) >= 2048) {
        reached2048 = true;
        ctx.award(20);
        messageEl.textContent = '🎉 你合出了 2048！可以继续冲分。';
      }

      if (!hasMoves(board)) {
        finished = true;
        if (!reached2048) ctx.award(3);
        messageEl.textContent = `本局结束！得分 ${score}，点击「重新开始」继续挑战。`;
      }
    }

    ctx.listen(restartBtn, 'click', restart);

    for (const button of root.querySelectorAll('[data-dir]')) {
      ctx.listen(button, 'click', () => play(button.dataset.dir));
    }

    ctx.listen(document, 'keydown', (event) => {
      const direction = DIRECTIONS[event.key];
      if (!direction) return;
      event.preventDefault();
      play(direction);
    });

    // 滑动：board 上设置了 touch-action:none，浏览器不会滚动页面
    let startX = 0;
    let startY = 0;

    ctx.listen(
      boardEl,
      'touchstart',
      (event) => {
        const touch = event.changedTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      },
      { passive: true },
    );

    ctx.listen(
      boardEl,
      'touchend',
      (event) => {
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
        play(
          Math.abs(deltaX) > Math.abs(deltaY)
            ? deltaX > 0
              ? 'right'
              : 'left'
            : deltaY > 0
              ? 'down'
              : 'up',
        );
      },
      { passive: true },
    );

    restart();
  },
});
