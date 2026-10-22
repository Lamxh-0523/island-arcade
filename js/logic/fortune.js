/**
 * 今日运势：由本地日期确定性生成，同一天刷新结果不变。
 * 纯函数，不读取系统时间；调用方传入 YYYY-MM-DD。
 */

const LEVELS = [
  {
    name: '大吉',
    stars: 5,
    emoji: '🌈',
    weight: 1,
    summaries: [
      '今天适合主动一点，想做的事就迈出第一步。',
      '状态在线，遇到机会别客气，接住它。',
      '好运偏向行动派，先开始就已经赢了一半。',
    ],
  },
  {
    name: '中吉',
    stars: 4,
    emoji: '🍀',
    weight: 2,
    summaries: [
      '节奏不错，稳扎稳打会有小惊喜。',
      '今天适合把重要的事往前放一放。',
      '不用太用力，顺着自己的节奏走就好。',
    ],
  },
  {
    name: '小吉',
    stars: 3,
    emoji: '🌷',
    weight: 4,
    summaries: [
      '小确幸在路上，留意身边的细节。',
      '今天的好运藏在日常里，慢一点就能看见。',
      '适合做点轻量的小事，给自己攒一点成就感。',
    ],
  },
  {
    name: '末吉',
    stars: 3,
    emoji: '🌤️',
    weight: 2,
    summaries: [
      '不必着急，把手里的事收个尾就好。',
      '今天适合整理和复盘，不必强行开新局。',
      '慢半拍也没关系，稳一点反而更顺。',
    ],
  },
  {
    name: '平',
    stars: 2,
    emoji: '🫧',
    weight: 1,
    summaries: [
      '普通的一天，也值得好好吃饭、好好休息。',
      '没有大起大落，正好适合给自己充充电。',
      '今天不争先，舒服最重要。',
    ],
  },
];

const COLORS = [
  { name: '薄荷绿', hex: '#7fd6b0' },
  { name: '樱花粉', hex: '#f4a7c1' },
  { name: '天空蓝', hex: '#7fb6ea' },
  { name: '奶油黄', hex: '#f2cf72' },
  { name: '丁香紫', hex: '#b6a4e8' },
  { name: '珊瑚橙', hex: '#f39a72' },
  { name: '雾灰蓝', hex: '#9aa8bd' },
  { name: '抹茶绿', hex: '#a8c98a' },
];

const HOURS = [
  '07:00–09:00',
  '09:00–11:00',
  '11:00–13:00',
  '13:00–15:00',
  '15:00–17:00',
  '17:00–19:00',
  '19:00–21:00',
];

const GOOD = [
  '整理房间',
  '尝试一条新路线',
  '和朋友聊聊天',
  '早点睡',
  '读几页书',
  '晒晒太阳',
  '喝一杯热饮',
  '做个小计划',
  '完成一件拖延很久的小事',
  '给自己做一顿饭',
  '散步二十分钟',
  '听一张喜欢的专辑',
];

const BAD = [
  '冲动消费',
  '熬夜',
  '翻旧账',
  '情绪化决定',
  '拖延',
  '空腹喝咖啡',
  '边走边看手机',
  '过度比较',
  '把话说太满',
  '同时开太多件事',
  '在气头上回消息',
  '忽略身体的疲惫',
];

const TIPS = [
  '把待办拆小一点，完成感会更好。',
  '给自己留十分钟发呆，也算正事。',
  '先做最不想做的那件事，后面会轻松很多。',
  '今天适合把话说慢一点。',
  '遇到选择时，先睡一觉再决定。',
  '记得喝水，别让身体替情绪买单。',
  '把手机放远一点，专心玩一局游戏也好。',
  '对帮过你的人说声谢谢。',
];

const KEYWORDS = [
  '慢慢来',
  '先开始',
  '保持好奇',
  '早点睡',
  '多喝水',
  '少纠结',
  '去散步',
  '断舍离',
  '笑一笑',
  '专注',
  '放轻松',
  '说真话',
];

/** FNV-1a，稳定且足够分散。 */
function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32：小而稳的可复现随机数。 */
function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** 按 weight 展开成池子，权重越高越常见。 */
const LEVEL_POOL = LEVELS.flatMap((level) => Array(level.weight).fill(level));

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function take(list, random, count) {
  const pool = list.slice();
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return picked;
}

/**
 * @typedef {object} Fortune
 * @property {string} date
 * @property {{name: string, stars: number, emoji: string}} level
 * @property {string} summary
 * @property {string} tip
 * @property {string} keyword
 * @property {string[]} good
 * @property {string[]} bad
 * @property {{name: string, hex: string}} color
 * @property {number} number
 * @property {string} hour
 */

/**
 * 生成指定日期的运势。同一天永远返回相同结果。
 * @param {string} dateKey YYYY-MM-DD
 * @returns {Fortune}
 */
export function getFortune(dateKey) {
  if (typeof dateKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new TypeError('dateKey 必须是 YYYY-MM-DD 格式');
  }

  const random = mulberry32(hashString(`island-arcade-fortune:${dateKey}`));
  const level = pick(LEVEL_POOL, random);

  return {
    date: dateKey,
    level: {
      name: level.name,
      stars: level.stars,
      emoji: level.emoji,
    },
    summary: pick(level.summaries, random),
    tip: pick(TIPS, random),
    keyword: pick(KEYWORDS, random),
    good: take(GOOD, random, 2),
    bad: take(BAD, random, 2),
    color: pick(COLORS, random),
    number: 1 + Math.floor(random() * 99),
    hour: pick(HOURS, random),
  };
}

/** @param {number} stars 1–5 */
export function starString(stars) {
  const filled = Math.max(0, Math.min(5, Math.round(stars)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}
