/**
 * 弹窗管理器：负责打开/关闭、焦点圈禁、焦点还原、背景 inert、页面滚动锁定。
 * 所有游戏都通过它挂载，因此计时器、事件监听会在关闭时统一清理。
 */

import { $ } from './dom.js';
import { store } from './store.js';
import { toast } from './toast.js';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let session = null;
let sequence = 0;
let wired = false;

/** @param {HTMLElement} container */
function focusableIn(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((node) => node instanceof HTMLElement && node.getClientRects().length > 0);
}

function wireStaticHandlers() {
  if (wired) return;
  wired = true;

  $('#overlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeDialog();
  });
  $('#closeModal')?.addEventListener('click', () => closeDialog());
}

/** Tab 在弹窗内循环，Esc 关闭。 */
function onKeydown(event) {
  if (!session) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeDialog();
    return;
  }
  if (event.key !== 'Tab') return;

  const modal = $('#modal');
  if (!modal) return;

  const items = focusableIn(modal);
  const active = document.activeElement;

  if (items.length === 0) {
    event.preventDefault();
    modal.focus({ preventScroll: true });
    return;
  }

  const first = items[0];
  const last = items[items.length - 1];

  if (!(active instanceof Node) || !modal.contains(active)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

document.addEventListener('keydown', onKeydown, true);

/**
 * 打开一个弹窗。
 * @param {object} options
 * @param {string} options.title
 * @param {(root: HTMLElement, ctx: import('./registry.js').GameContext) => (void | (() => void))} options.render
 * @param {string} [options.variant]
 */
export function openDialog({ title, render, variant = '' }) {
  wireStaticHandlers();

  if (session) closeDialog({ restoreFocus: false });

  const overlay = $('#overlay');
  const modal = $('#modal');
  const body = $('#modalBody');
  const titleNode = $('#modalTitle');
  const page = $('#page');
  if (!overlay || !modal || !body || !titleNode || !page) return;

  const previousFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const controller = new AbortController();
  /** @type {Set<number>} */
  const timers = new Set();
  /** @type {Set<Function>} */
  const disposers = new Set();
  const token = ++sequence;

  const ctx = {
    get state() {
      return store.state;
    },
    award(stars = 0) {
      const gained = Math.max(0, Math.floor(stars));
      store.completeRound(gained);
      if (gained > 0) toast(`获得 ${gained} 颗星星 ⭐`);
    },
    record(key, value, mode) {
      return store.setRecord(key, value, mode);
    },
    setBestScore(score) {
      return store.setBestScore(score);
    },
    toast,
    close: () => closeDialog(),
    onDispose(fn) {
      if (typeof fn === 'function') disposers.add(fn);
    },
    timeout(fn, ms) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    },
    interval(fn, ms) {
      const id = window.setInterval(fn, ms);
      timers.add(id);
      return id;
    },
    clearTimer(id) {
      if (typeof id !== 'number') return;
      window.clearTimeout(id);
      window.clearInterval(id);
      timers.delete(id);
    },
    listen(target, type, handler, options = {}) {
      target.addEventListener(type, handler, { ...options, signal: controller.signal });
      return () => target.removeEventListener(type, handler, options);
    },
  };

  const current = { token, controller, timers, disposers, previousFocus, overlay };
  session = current;

  titleNode.textContent = title;
  body.replaceChildren();
  if (variant) modal.dataset.variant = variant;
  else modal.removeAttribute('data-variant');

  overlay.classList.add('show');
  document.body.classList.add('modal-open');

  // 锁定页面滚动时补偿滚动条宽度，避免内容横向跳动
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

  page.inert = true;
  page.setAttribute('aria-hidden', 'true');

  try {
    const cleanup = render(body, ctx);
    if (typeof cleanup === 'function') disposers.add(cleanup);
  } catch (error) {
    console.error('[modal] 游戏渲染失败', error);
    closeDialog({ restoreFocus: true });
    toast('这个游戏暂时打不开，请刷新后重试');
    return;
  }

  requestAnimationFrame(() => {
    if (session !== current) return;
    if (modal.contains(document.activeElement) && document.activeElement !== modal) return;
    const target =
      body.querySelector('[data-autofocus]') || focusableIn(body)[0] || modal;
    target.focus({ preventScroll: true });
  });
}

/**
 * 关闭当前弹窗，并执行所有清理函数。
 * @param {{ restoreFocus?: boolean }} [options]
 */
export function closeDialog({ restoreFocus = true } = {}) {
  if (!session) return;

  const current = session;
  session = null;

  current.controller.abort();
  for (const id of current.timers) {
    window.clearTimeout(id);
    window.clearInterval(id);
  }
  current.timers.clear();

  for (const dispose of current.disposers) {
    try {
      dispose();
    } catch (error) {
      console.error('[modal] 清理失败', error);
    }
  }
  current.disposers.clear();

  const body = $('#modalBody');
  body?.replaceChildren();

  current.overlay.classList.remove('show');
  $('#modal')?.removeAttribute('data-variant');
  document.body.classList.remove('modal-open');
  document.body.style.paddingRight = '';

  const page = $('#page');
  if (page) {
    page.inert = false;
    page.removeAttribute('aria-hidden');
  }

  if (restoreFocus) {
    const target = current.previousFocus;
    if (target && target !== document.body && target.isConnected) {
      target.focus({ preventScroll: true });
    } else if (document.activeElement instanceof HTMLElement) {
      // 没有可还原的焦点时，避免焦点留在已隐藏的关闭按钮上
      document.activeElement.blur();
    }
  }
}

/** @param {import('./registry.js').GameDefinition} game */
export function openGameDialog(game) {
  if (!game) return;
  openDialog({
    title: `${game.icon} ${game.title}`,
    variant: game.id,
    render: (root, ctx) => game.mount(root, ctx),
  });
}
