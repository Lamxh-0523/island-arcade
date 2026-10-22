import { $, el } from '../core/dom.js';
import { openDialog } from '../core/modal.js';
import { todayKey } from '../core/store.js';
import { getFortune, starString } from '../logic/fortune.js';

let renderedDate = '';
/** @type {import('../logic/fortune.js').Fortune | null} */
let current = null;

function formatDate(dateKey) {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function starLabel(stars) {
  return `幸运指数 ${stars} 星，共 5 星`;
}

function paint() {
  const panel = $('#fortunePanel');
  if (!panel) return;

  const dateKey = todayKey();
  if (dateKey === renderedDate) return;

  const fortune = getFortune(dateKey);
  renderedDate = dateKey;
  current = fortune;

  const stars = starString(fortune.level.stars);
  const starsNode = $('#fortuneStars');

  panel.hidden = false;
  $('#fortuneDate').textContent = `${formatDate(dateKey)} · 今日运势`;
  $('#fortuneLevel').textContent = fortune.level.name;
  $('#fortuneEmoji').textContent = fortune.level.emoji;
  $('#fortuneSummary').textContent = fortune.summary;
  $('#fortuneColor').textContent = fortune.color.name;
  $('#fortuneColorDot').style.background = fortune.color.hex;
  $('#fortuneNumber').textContent = String(fortune.number);
  $('#fortuneHour').textContent = fortune.hour;
  $('#fortuneKeyword').textContent = fortune.keyword;

  if (starsNode) {
    starsNode.textContent = stars;
    starsNode.setAttribute('aria-label', starLabel(fortune.level.stars));
  }
}

function detailItem(label, value, wide = false) {
  return el(
    'div',
    { class: `fortune-detail-item${wide ? ' wide' : ''}` },
    el('span', { text: label }),
    el('b', { text: value }),
  );
}

function openFortuneDialog() {
  const fortune = current ?? getFortune(todayKey());

  openDialog({
    title: '🔮 今日运势',
    render(root) {
      root.append(
        el(
          'div',
          { class: 'fortune-detail' },
          el('p', {
            class: 'fortune-detail-date',
            text: `${formatDate(fortune.date)} · 仅供娱乐`,
          }),
          el(
            'div',
            { class: 'fortune-detail-head' },
            el('strong', { text: `${fortune.level.emoji} ${fortune.level.name}` }),
            el('span', {
              class: 'fortune-stars',
              role: 'img',
              'aria-label': starLabel(fortune.level.stars),
              text: starString(fortune.level.stars),
            }),
          ),
          el('p', { class: 'fortune-advice', text: fortune.summary }),
          el(
            'div',
            { class: 'fortune-detail-grid' },
            el(
              'div',
              { class: 'fortune-detail-item' },
              el('span', { text: '🎨 幸运色' }),
              el(
                'b',
                {},
                el('span', {
                  class: 'fortune-dot',
                  'aria-hidden': 'true',
                  style: `background:${fortune.color.hex}`,
                }),
                ` ${fortune.color.name}`,
              ),
            ),
            detailItem('🔢 幸运数字', String(fortune.number)),
            detailItem('⏰ 幸运时段', fortune.hour),
            detailItem('🍀 幸运关键词', fortune.keyword),
            detailItem('🌿 小岛建议', fortune.tip, true),
          ),
          el(
            'div',
            { class: 'fortune-detail-section' },
            el('h3', { text: '今天适合' }),
            el('p', { text: fortune.good.join(' · ') }),
            el('h3', { text: '尽量避开' }),
            el('p', { text: fortune.bad.join(' · ') }),
          ),
          el('p', {
            class: 'detail',
            text: '运势由本地日期生成，同一天结果固定，仅供娱乐。',
          }),
        ),
      );
    },
  });
}

export function setupFortune() {
  paint();
  $('#fortuneBtn')?.addEventListener('click', openFortuneDialog);

  // 页面长时间停留在后台时，跨过零点后回来能自动换成新一天的运势
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) paint();
  });

  // 页面一直开着时也跨天刷新；同一天内 paint 会直接返回
  window.setInterval(paint, 60_000);
}
