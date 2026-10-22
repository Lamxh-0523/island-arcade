# 小岛游戏屋

十二款免费休闲小游戏，纯前端 PWA。**零依赖、零构建**，直接托管即可运行，支持安装到桌面与离线游玩。

- 游戏：2048、记忆翻牌、反应力挑战、神秘数字、打地鼠、石头剪刀布、三连棋、心算挑战、颜色挑战、点点挑战、记忆顺序、找不同图案
- 今日运势：按本地日期生成，包含幸运等级、幸运色、幸运数字、时段、关键词与宜忌
- 统一积分：每日签到 + 完成对局获得星星
- 数据只存在本机浏览器，不联网、不注册
- 浅色柔和风格；适配手机、平板、桌面

## 技术栈

原生 HTML + CSS + ES Modules，无框架、无打包工具、无运行时依赖。
生产环境就是仓库里的静态文件，GitHub Pages 可直接托管。

## 目录结构

```
.
├── index.html               # 页面壳层：导航、Hero、统计、卡片容器、弹窗
├── manifest.json            # PWA 清单
├── service-worker.js        # 离线缓存策略（导航 network-first，资源 SWR）
├── css/
│   └── styles.css           # 设计变量 + 全部样式
├── js/
│   ├── app.js               # 启动：渲染卡片、统计、运势、签到、档案、注册 SW
│   ├── core/
│   │   ├── dom.js           # $ / $$ / el 三个 DOM 工具
│   │   ├── store.js         # 存档、迁移、订阅、签到、记录
│   │   ├── registry.js      # 游戏注册表与类型约定
│   │   ├── modal.js         # 弹窗、焦点圈禁、计时器与监听清理
│   │   └── toast.js         # 轻提示
│   ├── features/
│   │   └── fortune.js       # 今日运势的首页卡片与详情弹窗
│   ├── games/
│   │   ├── index.js         # 游戏清单（import 顺序 = 卡片顺序）
│   │   └── 2048.js ...      # 十二款游戏，各自独立文件
│   └── logic/
│       ├── 2048.js          # 纯逻辑，可直接单测
│       ├── ttt.js
│       ├── rps.js
│       ├── math.js
│       └── fortune.js       # 按日期确定性生成运势
├── tests/                   # node:test 单元测试
├── scripts/serve.mjs        # 本地静态服务器（Node 内置模块）
└── icons/
```

分层原则：

- `logic/` 只放纯函数，不碰 DOM，方便写测试；
- `games/` 只负责“把状态画出来、把点击接回来”，通过 `ctx` 读写存档；
- `features/` 放不属于游戏的独立功能（如今日运势），复用 `core/` 的弹窗与样式；
- `core/` 提供存档、弹窗、注册表等基础设施，游戏之间互不引用。

## 本地开发

需要 Node.js 22+（仅用于本地服务器和测试，运行网站本身不需要 Node）。

```bash
npm start        # http://127.0.0.1:4173
npm test         # 运行单元测试
```

不需要 `npm install`，项目没有第三方依赖。

> Service Worker 只在 `http(s)` 下生效，直接双击 `index.html`（`file://`）无法验证离线能力。

## iOS / 添加到主屏幕

针对 iPhone / iPad 做了以下适配：

- **安全区**：左右刘海、底部 Home 指示条通过 `env(safe-area-inset-*)` 留白，页脚、弹窗、Toast 不会被遮挡；
- **启动图**：内置 14 张 `apple-touch-startup-image`（iPhone 15/16 系列、14、13、SE 与 iPad），从主屏幕启动不再白屏；
- **安装引导**：Safari 中且未安装时，首页显示一次「分享 → 添加到主屏幕」提示（会话内可关闭）；
- **侧滑返回**：游戏弹窗写入一条 history 记录，侧滑或按返回键先关闭游戏，而不是直接离开站点；
- **触控细节**：44pt 最小按钮、`touch-action: manipulation` 防止双击缩放、去掉点击灰块、滚动链与回弹收敛；
- **输入不缩放**：输入框字号 ≥ 16px，iOS 聚焦时不会自动放大页面；
- **存档持久化**：启动时调用 `navigator.storage.persist()`，降低被系统回收的概率。

安装方法：Safari 打开站点 → 分享按钮 → 「添加到主屏幕」。
iOS 不支持 `beforeinstallprompt`，因此只能引导，无法弹原生安装框。

## 今日运势

首页 Hero 下方会显示当天的运势卡片，点「查看今日运势」打开详情：幸运等级、星级、幸运色、幸运数字、幸运时段、关键词、宜忌与小岛建议。

- 结果由**本地日期**确定性生成（FNV-1a + mulberry32），同一天刷新、换设备都不变；
- 不读取网络、不写存档、不奖励星星，纯内容展示；
- 跨过零点或从后台回到页面时会自动换成新一天；
- 文案与配色集中在 `js/logic/fortune.js` 的 `LEVELS`、`COLORS`、`GOOD`、`BAD`、`TIPS`、`KEYWORDS`，改文案不需要动 UI。

## 新增一款游戏

### 1. 写游戏模块

新建 `js/games/my-game.js`：

```js
import { registerGame } from '../core/registry.js';

registerGame({
  id: 'my-game',            // 小写字母、数字、连字符
  title: '我的游戏',
  icon: '🎲',
  tagline: '一句话介绍这款游戏',
  tone: 'b',                // 卡片配色：a / b / c / d

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gamearea">
        <p class="hint" data-ui="message">点一下按钮开始</p>
        <button class="btn" type="button" data-ui="start">开始</button>
      </div>`;

    const q = (name) => root.querySelector(`[data-ui="${name}"]`);

    ctx.listen(q('start'), 'click', () => {
      ctx.award(3);                    // 完成一局：+3 星星
      ctx.record('myGame', 10);        // 记录（默认越大越好）
      q('message').textContent = '完成！';
    });

    return () => {
      // 可选：额外的清理逻辑。计时器、事件监听会由 ctx 自动清理。
    };
  },
});
```

### 2. 注册到清单

在 `js/games/index.js` 末尾加一行：

```js
import './my-game.js';
```

### 3. 加入离线缓存

在 `service-worker.js` 的 `CORE_ASSETS` 里补上 `'./js/games/my-game.js'`。

### 4. 可选：补测试

如果游戏有独立逻辑，放到 `js/logic/` 并在 `tests/` 下新建 `*.test.js`，运行 `npm test` 即可。

### `ctx` 能做什么

| 成员 | 说明 |
| --- | --- |
| `ctx.state` | 当前存档快照（只读使用） |
| `ctx.award(stars)` | 完成一局：累加星星与局数，`stars > 0` 时弹提示 |
| `ctx.record(key, value, mode)` | 写入记录，`mode` 为 `'higher'`（默认）或 `'lower'`，返回是否刷新记录 |
| `ctx.setBestScore(score)` | 更新 2048 最高分 |
| `ctx.toast(message)` | 轻提示 |
| `ctx.close()` | 关闭弹窗 |
| `ctx.listen(target, type, handler)` | 事件监听，弹窗关闭时自动解绑 |
| `ctx.timeout(fn, ms)` / `ctx.interval(fn, ms)` | 计时器，弹窗关闭时自动清除 |
| `ctx.clearTimer(id)` | 手动取消计时器 |
| `ctx.onDispose(fn)` | 注册关闭时的额外清理 |

约定：

- 游戏内部用 `data-ui="..."` 标记需要查询的节点，避免全局 `id` 冲突；
- 不要在游戏里直接读写 `localStorage`，统一走 `ctx`；
- 不要用全局 `document.addEventListener`，改用 `ctx.listen`；
- `mount()` 返回的函数会在关闭弹窗时执行，适合停掉音频、RAF 等。

## 存档

- 存储 key：`little-island-arcade-v1`（**保持不变**，老玩家记录不会丢）
- 结构版本：`v: 2`
- 主要字段：

```json
{
  "v": 2,
  "stars": 0,
  "rounds": 0,
  "best": 0,
  "daily": "2026-10-22",
  "records": {
    "memory": 0, "reaction": null, "guess": 0,
    "mole": 0, "rps": 0, "ttt": 0, "math": 0
  }
}
```

`reaction` 记录最快毫秒数（越小越好），其余记录越大越好。
读档时会做 normalize：缺字段补默认值、坏 JSON 回退初始值、旧版本自动迁移。

清除方式：「我的游戏档案 → 清除本机记录」，或在浏览器设置中清除站点数据。

## 离线缓存与发版

- 导航请求（打开页面）：**network-first**，4 秒超时回退缓存，保证每次打开都拿到最新 HTML。
- 静态资源：**stale-while-revalidate**，先返回缓存，同时后台更新。
- 安装时预缓存 `CORE_ASSETS`，单个资源失败不会导致整个安装失败。

发版流程：改完代码后，把 `service-worker.js` 里的 `CACHE_VERSION` 加一（例如 `v3` → `v4`），
旧缓存会在新 SW 激活时自动清理。页面检测到新版本会提示「新版本已就绪，刷新页面即可使用」。

## 部署

1. 把仓库推送到 GitHub；
2. 仓库 Settings → Pages → Source 选择 `main` 分支根目录；
3. 等待部署完成，用返回的 URL 打开。

所有资源都使用相对路径（`./`），因此部署在 `https://<user>.github.io/<repo>/` 子路径下也能正常工作。
不需要构建步骤，上传什么就运行什么。

## 测试

```bash
npm test
```

覆盖：2048 合并算法、三连棋胜负与 AI、猜拳判定、心算出题、今日运势生成、存档读写/迁移/签到、游戏注册表。

## 本次重构（v3）

修复的已知问题：

- **反应力面板改为 `<button>`**，支持键盘与读屏；
- **弹窗焦点管理**：打开时聚焦第一个控件、Tab 在弹窗内循环、关闭后焦点还原、背景 `inert`；
- **2048 滑动**：棋盘设置 `touch-action: none`，滑动不再带动页面/弹窗滚动；
- **星星经济**：反应力只有刷新个人纪录才 +2；打地鼠、猜拳、心算取消“0 分保底 1 星”，避免刷星；
- **离线更新**：导航改 network-first，静态资源 SWR，不再需要用户手动清缓存；
- **计时器/监听统一回收**：关闭弹窗即清理，切换游戏不会残留定时器；
- 补齐分享 meta、180px 图标、`robots.txt`、`README`。

架构调整：单文件 29 KB 拆分为 `core / games / logic` 三层，新增游戏只需一个文件加一行 import。
同时把 v2.1 新增的颜色挑战、点点挑战、记忆顺序、找不同图案移植为独立模块，当前共 12 款游戏。

### v3.2 · iOS 适配

- 安全区留白、iOS 启动图、Safari 安装引导、侧滑返回关闭游戏；
- 触控目标与点击反馈、输入框防缩放、滚动回弹收敛；
- 页脚显示版本号，配合 `no-store` 与 `updateViaCache: none` 确认更新是否生效。

### v3.3 · 今日运势

- 首页新增今日运势卡片与详情弹窗；
- 按本地日期确定性生成，跨天自动刷新，不写存档、不奖励星星。

## 已知限制

- 2048 棋盘对读屏软件做了简化（`aria-hidden`），分数和结果通过 `aria-live` 播报；
- 界面仅中文，暂无 i18n；
- 星星只用于展示，没有消费场景；
- 暂无成绩分享/排行榜（需要后端，与“纯静态”目标冲突）。

## 隐私

不要求注册，不收集身份信息；星星、成绩、签到记录仅存在浏览器 `localStorage`。
未接入统计脚本和第三方广告。GitHub Pages 可能依据自身政策处理访问日志。
详见站内「隐私说明」。
