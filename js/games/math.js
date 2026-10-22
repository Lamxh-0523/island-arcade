import { registerGame } from '../core/registry.js';
import { makeProblem, QUESTION_COUNT } from '../logic/math.js';

registerGame({
  id: 'math',
  title: '心算挑战',
  icon: '🧮',
  tagline: '连续答对十道加减法题',
  tone: 'a',

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <div class="status">
          <span data-ui="progress">第 1 / ${QUESTION_COUNT} 题</span>
          <span data-ui="score">答对 0 题</span>
        </div>
        <p class="howto">限 ${QUESTION_COUNT} 题的加减法小挑战，答错也会进入下一题。</p>
        <h2 data-ui="question" style="font-size:34px;margin:25px 0">准备开始</h2>
        <form class="inline" data-ui="form" novalidate>
          <input type="number" inputmode="numeric" class="mathanswer" data-ui="input" aria-label="答案">
          <button class="btn" type="submit">提交</button>
        </form>
        <p class="hint" data-ui="message" aria-live="polite">输入答案，点击提交</p>
        <button class="btn small secondary" type="button" data-ui="restart">重新开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);
    const form = q('form');
    const input = q('input');
    const progressEl = q('progress');
    const scoreEl = q('score');
    const questionEl = q('question');
    const messageEl = q('message');

    let index = 0;
    let correct = 0;
    let answer = 0;
    let finished = false;

    function next() {
      const problem = makeProblem();
      answer = problem.answer;
      questionEl.textContent = problem.text;
      progressEl.textContent = `第 ${index + 1} / ${QUESTION_COUNT} 题`;
      input.value = '';
      input.focus();
    }

    function finish() {
      finished = true;
      form.hidden = true;
      questionEl.textContent = '完成！🎉';
      progressEl.textContent = `${QUESTION_COUNT} / ${QUESTION_COUNT} 题`;
      scoreEl.textContent = `答对 ${correct} 题`;
      messageEl.textContent = `共答对 ${correct} / ${QUESTION_COUNT} 题，获得 ${correct} ⭐`;
      ctx.award(correct);
      ctx.record('math', correct, 'higher');
    }

    function start() {
      index = 0;
      correct = 0;
      finished = false;
      form.hidden = false;
      scoreEl.textContent = '答对 0 题';
      messageEl.textContent = '输入答案，点击提交';
      next();
    }

    ctx.listen(form, 'submit', (event) => {
      event.preventDefault();
      if (finished) return;

      const raw = input.value.trim();
      if (!raw || !Number.isFinite(Number(raw))) {
        ctx.toast('请先填写答案');
        input.focus();
        return;
      }

      if (Number(raw) === answer) correct += 1;
      index += 1;
      scoreEl.textContent = `答对 ${correct} 题`;

      if (index >= QUESTION_COUNT) {
        finish();
        return;
      }
      messageEl.textContent = '继续加油！';
      next();
    });

    ctx.listen(q('restart'), 'click', start);

    start();
  },
});
