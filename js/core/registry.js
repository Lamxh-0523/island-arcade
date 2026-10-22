/**
 * 游戏注册表。
 *
 * 新增一款游戏 = 新建 js/games/<id>.js 并在 js/games/index.js 里 import 一次，
 * 首页卡片、弹窗标题、打开/关闭、计时器清理都会自动处理。
 */

/**
 * 游戏运行上下文，由弹窗在打开时创建，关闭时自动销毁。
 * @typedef {object} GameContext
 * @property {() => any} state 读取存档快照
 * @property {(stars?: number) => void} award 完成一局：累加星星与局数
 * @property {(key: string, value: number, mode?: 'higher' | 'lower') => boolean} record 写入记录
 * @property {(score: number) => boolean} setBestScore 更新 2048 最高分
 * @property {(message: string) => void} toast 轻提示
 * @property {() => void} close 关闭当前弹窗
 * @property {(fn: () => void) => void} onDispose 注册关闭时的清理函数
 * @property {(fn: Function, ms: number) => number} timeout 自动清理的 setTimeout
 * @property {(fn: Function, ms: number) => number} interval 自动清理的 setInterval
 * @property {(id: number) => void} clearTimer 取消上面两种计时器
 * @property {(target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions) => () => void} listen 自动解绑的事件监听
 */

/**
 * @typedef {object} GameDefinition
 * @property {string} id 唯一 id，小写字母/数字/连字符
 * @property {string} title 中文名
 * @property {string} icon emoji
 * @property {string} tagline 一句话简介
 * @property {'a' | 'b' | 'c' | 'd'} [tone] 卡片配色
 * @property {(root: HTMLElement, ctx: GameContext) => (void | (() => void))} mount 渲染并接管 root
 */

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const TONES = new Set(['a', 'b', 'c', 'd']);

/** @type {Map<string, GameDefinition>} */
const registry = new Map();

/**
 * @param {GameDefinition} definition
 * @returns {GameDefinition}
 */
export function registerGame(definition) {
  if (!definition || typeof definition !== 'object') {
    throw new TypeError('registerGame 需要一个游戏定义对象');
  }

  const { id, title, icon, tagline, mount } = definition;

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
    throw new Error(`无效的游戏 id：${String(id)}（只允许小写字母、数字和连字符）`);
  }
  if (registry.has(id)) {
    throw new Error(`游戏 id 重复注册：${id}`);
  }
  for (const [key, value] of Object.entries({ title, icon, tagline })) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`游戏 ${id} 缺少 ${key}`);
    }
  }
  if (typeof mount !== 'function') {
    throw new Error(`游戏 ${id} 缺少 mount() 函数`);
  }

  const game = Object.freeze({
    id,
    title: title.trim(),
    icon,
    tagline: tagline.trim(),
    tone: TONES.has(definition.tone) ? definition.tone : 'a',
    mount,
  });

  registry.set(id, game);
  return game;
}

/** 按注册顺序返回全部游戏。 */
export function getGames() {
  return Array.from(registry.values());
}

/** @param {string} id */
export function getGame(id) {
  return registry.get(id) ?? null;
}
