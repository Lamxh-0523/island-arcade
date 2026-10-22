import './games/index.js';

import { $, el } from './core/dom.js';
import { openDialog, openGameDialog } from './core/modal.js';
import { getGame, getGames } from './core/registry.js';
import { store, todayKey } from './core/store.js';
import { toast } from './core/toast.js';

/** 页面可见版本号：用于确认当前加载的是哪一次部署。 */
const APP_VERSION = '3.2.0';
const IOS_HINT_KEY = 'island-ios-hint';

/* -------------------------------------------------------------------------- */
/* 首页渲染                                                                    */
/* -------------------------------------------------------------------------- */

function renderCards() {
  const grid = $('#cards');
  const games = getGames();
  if (!grid) return;

  grid.replaceChildren(
    ...games.map((game) =>
      el(
        'article',
        { class: 'gamecard' },
        el('div', { class: `art ${game.tone}`, 'aria-hidden': 'true' }, game.icon),
        el(
          'div',
          { class: 'info' },
          el('h3', { text: game.title }),
          el('p', { text: game.tagline }),
          el(
            'button',
            {
              class: 'btn small',
              type: 'button',
              'aria-label': `开始 ${game.title}`,
              onclick: () => openGameDialog(game),
            },
            '开始挑战 →',
          ),
        ),
      ),
    ),
  );

  const count = $('#gameCount');
  if (count) count.textContent = `${games.length} 款 · 全部免费`;
}

function recordSummary(state) {
  const reaction = state.records.reaction ? `${state.records.reaction} ms` : '暂无';
  return `翻牌完成 ${state.records.memory} 次 · 猜数字成功 ${state.records.guess} 次 · 最快反应 ${reaction}`;
}

function renderStats() {
  const state = store.state;
  const claimed = state.daily === todayKey();

  const topStars = $('#topStars');
  const stars = $('#stars');
  const rounds = $('#rounds');
  const best = $('#best');
  const recordText = $('#recordText');
  const dailyBtn = $('#dailyBtn');
  const heroDailyBtn = $('#heroDailyBtn');
  const dailyStatus = $('#dailyStatus');

  if (topStars) topStars.textContent = String(state.stars);
  if (stars) stars.textContent = String(state.stars);
  if (rounds) rounds.textContent = String(state.rounds);
  if (best) best.textContent = String(state.best);
  if (recordText) recordText.textContent = recordSummary(state);

  if (dailyBtn) {
    dailyBtn.disabled = claimed;
    dailyBtn.textContent = claimed ? '今日已领取 ✓' : '领取今日奖励';
  }
  if (heroDailyBtn) {
    heroDailyBtn.disabled = claimed;
    heroDailyBtn.textContent = claimed ? '✓ 今日已领取' : '🎁 领取今日星星';
  }
  if (dailyStatus) dailyStatus.textContent = claimed ? '明天再来领取' : '每天可领取一次';
}

function claimDaily() {
  const gained = store.claimDaily();
  toast(gained ? `签到成功！获得 ${gained} 颗星星 ⭐` : '今天已经领取啦，明天见 🌷');
}

/* -------------------------------------------------------------------------- */
/* 弹窗内容                                                                    */
/* -------------------------------------------------------------------------- */

function recordRow(label, value) {
  return el('div', {}, el('span', { text: label }), el('b', { text: String(value) }));
}

function openRecords() {
  openDialog({
    title: '📒 我的游戏档案',
    render(root, ctx) {
      const draw = () => {
        const state = ctx.state;

        const resetBtn = el('button', { class: 'btn danger small', type: 'button' }, '清除本机记录');
        let armed = false;
        resetBtn.addEventListener('click', () => {
          if (!armed) {
            armed = true;
            resetBtn.textContent = '再点一次确认清除';
            ctx.timeout(() => {
              if (!resetBtn.isConnected) return;
              armed = false;
              resetBtn.textContent = '清除本机记录';
            }, 4000);
            return;
          }
          store.reset();
          ctx.toast('本机记录已清除');
          draw();
        });

        root.replaceChildren(
          el(
            'div',
            { class: 'record-list' },
            recordRow('⭐ 累积星星', state.stars),
            recordRow('🎮 完成局数', state.rounds),
            recordRow('🏆 2048 最高分', state.best),
            recordRow('🃏 翻牌完成', `${state.records.memory} 次`),
            recordRow('🔮 猜数字成功', `${state.records.guess} 次`),
            recordRow(
              '⚡ 最快反应',
              state.records.reaction ? `${state.records.reaction} ms` : '暂无',
            ),
            recordRow('🐹 打地鼠最佳', `${state.records.mole} 只`),
            recordRow('✊ 石头剪刀布最佳', `${state.records.rps} 胜`),
            recordRow('⭕ 三连棋获胜', `${state.records.ttt} 次`),
            recordRow('🧮 心算最佳', `${state.records.math} 题`),
            recordRow('🎨 颜色挑战最佳', `${state.records.color} 题`),
            recordRow('🎯 点点挑战最佳', `${state.records.target} 次`),
            recordRow('🧠 记忆顺序最佳', `${state.records.sequence} 关`),
            recordRow('🔍 找不同最佳', `${state.records.odd} 题`),
          ),
          el('p', {
            class: 'detail',
            text: '数据保存在本设备当前浏览器中，换设备或清除网站数据后不会同步。',
          }),
          el('div', { class: 'inline', style: 'margin-top:14px' }, resetBtn),
        );
      };

      draw();
    },
  });
}

function openPrivacy() {
  openDialog({
    title: '隐私说明',
    render(root) {
      root.append(
        el('p', {
          class: 'privacytext',
          text: '本网站不要求注册，不主动收集姓名、联系方式等身份信息。星星、成绩、签到记录仅存储在你使用的浏览器 localStorage 中，不会自动同步到服务器。清除浏览器网站数据后记录可能丢失。',
        }),
        el('p', {
          class: 'privacytext',
          text: '本站目前未接入统计脚本和第三方广告；未来如添加，会更新说明。GitHub Pages 作为托管服务可能依据自身政策处理访问日志。',
        }),
        el('p', {
          class: 'privacytext',
          text: '离线缓存由浏览器 Service Worker 提供，只保存本站自身的页面与脚本文件。',
        }),
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* 启动                                                                        */
/* -------------------------------------------------------------------------- */

function setupEvents() {
  $('#playBtn')?.addEventListener('click', () => {
    openGameDialog(getGame('2048') ?? getGames()[0]);
  });

  $('#heroDailyBtn')?.addEventListener('click', claimDaily);
  $('#dailyBtn')?.addEventListener('click', claimDaily);
  $('#recordsBtn')?.addEventListener('click', openRecords);
  $('#privacyBtn')?.addEventListener('click', openPrivacy);
}

function renderVersion() {
  const node = $('#appVersion');
  if (node) node.textContent = `v${APP_VERSION}`;
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;

  const standalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (standalone) return false;

  // Chrome / Firefox / Edge 在 iOS 上也是 WebKit，但没有「添加到主屏幕」
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function setupIosHint() {
  const hint = $('#iosHint');
  if (!hint || !isIosSafari()) return;

  try {
    if (sessionStorage.getItem(IOS_HINT_KEY) === 'dismissed') return;
  } catch {
    /* 隐私模式下忽略 */
  }

  hint.hidden = false;
  $('#iosHintClose')?.addEventListener('click', () => {
    hint.hidden = true;
    try {
      sessionStorage.setItem(IOS_HINT_KEY, 'dismissed');
    } catch {
      /* 忽略 */
    }
  });
}

/** 尽量让 iOS 不回收存档；Safari 可能忽略，失败也不影响使用。 */
function requestPersistentStorage() {
  if (navigator.storage && typeof navigator.storage.persist === 'function') {
    navigator.storage.persist().catch(() => {});
  }
}

/**
 * 注册 Service Worker。
 * - 首次访问不会打扰用户；
 * - 已有旧版本控制时，新版本接管后提示刷新，不强制打断游戏。
 */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;

  const hadController = Boolean(navigator.serviceWorker.controller);

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        updateViaCache: 'none',
      });
      registration.update().catch(() => {});

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) return;
        toast('新版本已就绪，刷新页面即可使用 ✨', 8000);
      });
    } catch (error) {
      console.warn('[app] 离线缓存注册失败', error);
    }
  });
}

renderCards();
renderStats();
renderVersion();
store.subscribe(renderStats);
setupEvents();
setupIosHint();
requestPersistentStorage();
registerServiceWorker();
