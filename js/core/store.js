/**
 * 存档层：唯一负责 localStorage 读写的地方。
 *
 * 设计要点：
 * - key 沿用 v1 的 little-island-arcade-v1，老玩家的星星/记录不会丢；
 * - 读入时统一做 normalize，坏数据不会让页面崩溃；
 * - 写入失败（隐私模式、配额满）静默降级；
 * - 任何状态变化都会通知订阅者，UI 只订阅、不主动刷新。
 */

/** 存档 key：不要随意修改，否则老用户记录会丢失。 */
export const STORAGE_KEY = 'little-island-arcade-v1';

/** 存档结构版本，仅用于将来迁移。 */
export const SCHEMA_VERSION = 2;

/** 每日签到奖励。 */
export const DAILY_STARS = 5;

const KNOWN_RECORDS = Object.freeze({
  memory: 0,   // 翻牌完成次数
  reaction: null, // 最快反应（ms，越小越好）
  guess: 0,    // 猜数字成功次数
  mole: 0,     // 打地鼠最佳命中
  rps: 0,      // 石头剪刀布最佳胜场
  ttt: 0,      // 三连棋获胜次数
  math: 0,     // 心算最佳答对数
  color: 0,    // 颜色挑战最佳答对数
  target: 0,   // 点点挑战最佳命中
  sequence: 0, // 记忆顺序最佳关卡
  odd: 0,      // 找不同最佳答对数
});

/** @returns {{v:number, stars:number, rounds:number, best:number, daily:string, records:Record<string, number|null>}} */
function createInitialState() {
  return {
    v: SCHEMA_VERSION,
    stars: 0,
    rounds: 0,
    best: 0,
    daily: '',
    records: { ...KNOWN_RECORDS },
  };
}

/** @param {unknown} value */
function toCount(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/** 把任意读到的数据整理成合法状态。 */
function normalize(raw) {
  const state = createInitialState();
  if (!raw || typeof raw !== 'object') return state;

  state.stars = toCount(/** @type {any} */ (raw).stars);
  state.rounds = toCount(/** @type {any} */ (raw).rounds);
  state.best = toCount(/** @type {any} */ (raw).best);

  const daily = /** @type {any} */ (raw).daily;
  state.daily = typeof daily === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(daily) ? daily : '';

  const records = /** @type {any} */ (raw).records;
  if (records && typeof records === 'object') {
    for (const [key, value] of Object.entries(records)) {
      if (key === 'reaction') {
        state.records.reaction =
          typeof value === 'number' && Number.isFinite(value) && value > 0
            ? Math.round(value)
            : null;
      } else if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        state.records[key] = Math.floor(value);
      }
    }
  }

  return state;
}

/** 返回本地日期 YYYY-MM-DD，用于每日签到判定。 */
export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 探测可用的存储；隐私模式下返回 null。 */
function resolveStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    const probe = '__island_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/**
 * @typedef {object} GameRecord
 * @property {number} stars
 * @property {number} rounds
 */

export class Store {
  /** @type {Storage | null} */
  #storage;
  /** @type {Set<(state: any) => void>} */
  #listeners = new Set();
  /** @type {ReturnType<typeof createInitialState>} */
  state;

  /** @param {Storage | null} [storage] 传入自定义存储便于测试 */
  constructor(storage) {
    this.#storage = storage === undefined ? resolveStorage() : storage;
    this.state = this.#load();
  }

  #load() {
    if (!this.#storage) return createInitialState();
    try {
      const raw = this.#storage.getItem(STORAGE_KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch {
      return createInitialState();
    }
  }

  #save() {
    if (!this.#storage) return;
    try {
      this.#storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* 配额不足或被禁用：忽略，内存中的状态仍然有效 */
    }
  }

  #emit() {
    for (const listener of this.#listeners) {
      try {
        listener(this.state);
      } catch (error) {
        console.error('[store] 订阅回调出错', error);
      }
    }
  }

  /** @param {(state: any) => void} listener @returns {() => void} */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** 完成一局：累加星星与局数。 */
  completeRound(stars = 0) {
    this.state.rounds += 1;
    this.state.stars += Math.max(0, Math.floor(stars));
    this.#save();
    this.#emit();
  }

  /** 仅当分数更高时更新 2048 最高分。 */
  setBestScore(score) {
    if (!Number.isFinite(score) || score <= this.state.best) return false;
    this.state.best = Math.floor(score);
    this.#save();
    this.#emit();
    return true;
  }

  /**
   * 更新某项记录。
   * @param {string} key
   * @param {number} value
   * @param {'higher' | 'lower'} [mode] 数值越大越好 / 越小越好
   * @returns {boolean} 是否刷新了记录
   */
  setRecord(key, value, mode = 'higher') {
    if (typeof key !== 'string' || !key) throw new TypeError('记录名必须是非空字符串');
    if (!Number.isFinite(value)) return false;

    const prev = this.state.records[key];
    const improved =
      prev === null || prev === undefined
        ? true
        : mode === 'lower'
          ? value < prev
          : value > prev;

    if (!improved) return false;

    this.state.records[key] = value;
    this.#save();
    this.#emit();
    return true;
  }

  /** 每日签到。返回获得的星星数，0 表示今天已领过。 */
  claimDaily(date = new Date()) {
    const key = todayKey(date);
    if (this.state.daily === key) return 0;

    this.state.daily = key;
    this.state.stars += DAILY_STARS;
    this.#save();
    this.#emit();
    return DAILY_STARS;
  }

  /** 清空本机存档（设置页使用）。 */
  reset() {
    this.state = createInitialState();
    this.#save();
    this.#emit();
  }
}

/** 全局单例。页面生命周期内共享同一份状态。 */
export const store = new Store();
