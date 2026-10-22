# AGENTS.md

面向在本仓库中工作的 AI/自动化代理（也适用于人类贡献者）。

**先读这一条：这是一个零依赖、零构建的静态 PWA。** 不要为了改一个功能引入框架、打包器或依赖；
GitHub Pages 直接托管仓库根目录，`index.html` 打开即可运行。

## 项目概览

- 小岛游戏屋：12 款中文休闲小游戏（2048、记忆翻牌、反应力、猜数字、打地鼠、石头剪刀布、三连棋、心算、颜色挑战、点点挑战、记忆顺序、找不同）
- 技术栈：原生 HTML + CSS + ES Modules，无运行时依赖、无构建步骤
- 部署：GitHub Pages（仓库根目录），所有路径必须是相对路径
- 数据：只存在浏览器 `localStorage`，不联网、不注册、无统计、无广告

## 快速命令

| 目的 | 命令 | 说明 |
| --- | --- | --- |
| 本地运行 | `npm start` | 启动 `http://127.0.0.1:4173`，Service Worker 需要 http(s) |
| 单元测试 | `npm test` | Node 22+；使用 `--test-isolation=none`，避免沙箱内子进程 `EPERM` |
| 语法检查 | `node --check <file>` | 修改 JS 后逐个检查 |
| 安装依赖 | **不要执行** | 项目没有第三方依赖；确实需要时先征得同意 |

没有 lint、formatter、打包和类型检查步骤。保持现有代码风格即可。

## 目录与依赖方向

```
index.html            页面壳层（导航/Hero/统计/卡片容器/弹窗）
css/styles.css        设计变量与全部样式
service-worker.js     预缓存与离线策略
js/app.js             启动装配：渲染卡片、统计、签到、档案、注册 SW
js/core/              基础设施：store / modal / registry / dom / toast
js/games/             十二款游戏 + index.js 游戏清单
js/logic/             纯逻辑，无 DOM，可直接单测
tests/                node:test 单元测试
scripts/serve.mjs     本地静态服务器
```

允许的依赖方向：

- `app.js` → `core/*`、`games/index.js`、`games/*`
- `games/*` → `core/registry.js`、`js/logic/*`
- `core/*` → 只能依赖 `core/*`
- `logic/*` → 不依赖任何项目模块，不访问 DOM / window / localStorage
- **游戏之间禁止互相 import**；公共能力放 `core/` 或 `logic/`

## 关键机制

### 1. 游戏注册表

新游戏调用 `registerGame({ id, title, icon, tagline, tone, mount })`。
`js/games/index.js` 的 import 顺序就是首页卡片顺序。重复 id、非法 id、缺少字段会直接抛错。

`mount(root, ctx)` 负责把游戏画进弹窗；返回的函数（可选）会在关闭时执行。

### 2. 弹窗上下文 `ctx`

| 成员 | 用途 |
| --- | --- |
| `ctx.state` | 存档快照 |
| `ctx.award(stars)` | 完成一局：累加星星/局数，>0 时自动 toast |
| `ctx.record(key, value, mode)` | 写记录，`mode` 为 `'higher'` 或 `'lower'` |
| `ctx.setBestScore(score)` | 2048 最高分 |
| `ctx.toast(message)` | 轻提示 |
| `ctx.close()` | 关闭弹窗 |
| `ctx.listen(target, type, handler)` | 自动解绑的事件监听 |
| `ctx.timeout` / `ctx.interval` / `ctx.clearTimer` | 自动清理的计时器 |
| `ctx.onDispose(fn)` | 关闭时的额外清理 |

**规则：游戏内不要使用全局 `document.addEventListener`、裸 `setTimeout`/`setInterval`。**
一律走 `ctx`，否则关闭弹窗后计时器仍会跑，切换游戏会串状态。

### 3. 存档

- key 固定为 `little-island-arcade-v1`（**不要修改**，否则老玩家记录丢失）
- 结构版本 `v: 2`，读入经 `normalize()`：补默认值、过滤坏值、兼容 v1
- 所有读写集中在 `js/core/store.js`；游戏、页面不得直接碰 `localStorage`
- 状态变化通过 `store.subscribe()` 通知 UI；新增字段要同步 `KNOWN_RECORDS` 与档案弹窗

### 4. 离线缓存

- `CACHE_VERSION` 在 `service-worker.js` 顶部；**每次发版加一**（`v3` → `v4`）
- `CORE_ASSETS` 必须列出所有运行所需文件；漏文件在线可用、离线会挂
- 导航请求 network-first（4 秒超时回退缓存）；其它资源 stale-while-revalidate
- 预缓存是逐个 `put`，单个失败不影响安装；激活时只清理 `island-arcade-*` 前缀缓存

## 修改指南

### 新增一款游戏

1. 若有可复用规则，先写 `js/logic/<name>.js`（纯函数）和 `tests/<name>.test.js`
2. 新建 `js/games/<id>.js`，调用 `registerGame()`；模板见 `README.md`
3. 在 `js/games/index.js` 末尾 `import './<id>.js';`
4. 在 `service-worker.js` 的 `CORE_ASSETS` 补 `'./js/games/<id>.js'`（以及新的 logic 文件）
5. 更新 `README.md` 的游戏列表与数量（首页数量由注册表自动计算）
6. 跑 `npm test`，并在浏览器里打开、玩一局、关闭

游戏内部约定：

- 用 `data-ui="xxx"` 标记节点，通过 `root.querySelector('[data-ui="xxx"]')` 查询；**不要用全局 id**
- 文案用中文，语气轻松；按钮使用 `<button type="button">`
- 状态变化用 `aria-live="polite"` 播报；纯装饰 emoji 加 `aria-hidden="true"`
- 结算只调用一次 `ctx.award()`；可重复玩法的奖励要防止刷分（参考反应力：仅破纪录 +2）

### 修改存档结构

1. 保留 key 不变
2. 新字段加入 `KNOWN_RECORDS` 默认值，并在 `normalize()` 中处理
3. 在 `tests/store.test.js` 补旧数据迁移与坏数据用例
4. 记得在 `js/app.js` 的「我的游戏档案」里展示（如果玩家需要看到）

### 修改样式

- 颜色、圆角、阴影优先复用 `:root` 变量与现有组件类
- 断点：760px（平板/手机）、390px（窄屏）
- `[hidden] { display: none !important; }` 是刻意保留的，防止 `.inline { display:flex }` 覆盖隐藏
- iOS：使用 `env(safe-area-inset-*)` 留白；按钮最小 44pt；输入框字号 ≥16px 防止聚焦缩放
- 新增全屏页面或启动图时，同步 `apple-touch-startup-image` 列表与 `icons/splash-*`
- 不引入外部字体、CDN、CSS 框架

### 修改 Service Worker

改完必须验证离线：DevTools → Network → Offline → 刷新，页面、样式、12 张卡片都应正常。

## 代码风格

- 2 空格缩进、单引号、分号、ES Modules、具名导出
- 导出的函数/类型写 JSDoc；内部实现保持直白，不为抽象而抽象
- 注释与界面文案用中文，标识符用英文
- 不使用内联事件属性（`onclick="..."`），统一 `addEventListener` 或 `ctx.listen`
- 错误处理：存储失败静默降级；用户输入错误用 `toast` 提示，不弹 `alert`
- 隐私约束：不得新增任何网络请求、埋点、广告或第三方资源

## 完成前检查清单

1. `npm test` 全部通过（若新增测试，以实际输出为准）
2. 改动的 JS 逐个 `node --check`
3. `npm start` 后手动验证：12 张卡片、每款游戏能开能关、签到、刷新后记录仍在
4. iOS 视口（如 393×852）下检查：安全区不遮挡、安装提示、侧滑返回先关游戏
5. 如涉及资源/SW：断网刷新仍可用，`CACHE_VERSION` 已递增，`CORE_ASSETS` 无遗漏
6. `git status` 中没有截图、临时脚本、`node_modules` 等无关文件
7. 没有破坏 GitHub Pages 子路径部署：所有引用保持 `./` 相对路径

## 不要做

- ❌ 改存档 key、删旧记录迁移逻辑
- ❌ 引入框架/打包器/TypeScript/新依赖（除非明确要求）
- ❌ 把游戏逻辑塞回 `index.html` 或 `app.js`
- ❌ 在游戏里直接操作 `localStorage` 或使用全局事件监听
- ❌ 新增外链资源、统计脚本、广告位逻辑
- ❌ 把全部资源改成 cache-first 导航（会重新引入“更新不生效”问题）
- ❌ 提交调试截图、临时 CDP 脚本、`.tmp` 目录

## Git 与发布

- 提交前必须跑测试；提交信息使用 `type: 中文摘要`，类型取 `feat|fix|refactor|docs|test|chore`
- 发布：修改 `CACHE_VERSION` → 提交 → 推送 `main` → GitHub Pages 自动部署
- 只推送用户明确要求的提交；不要擅自改写历史或强推

## 已知坑

- `file://` 下 ES Modules 与 Service Worker 都不可用，必须用 `npm start`
- Node 测试在受限沙箱里默认会 `spawn EPERM`，所以脚本固定带 `--test-isolation=none`
- Windows 上 Git 会提示 `LF will be replaced by CRLF`，属于正常现象，不要批量改行尾
- 2048 棋盘对读屏软件使用 `aria-hidden`，分数与结果通过 `aria-live` 播报，这是有意简化
- 弹窗打开时 `#page` 会被设为 `inert` + `aria-hidden`，关闭时由 `modal.js` 恢复，不要在别处手动改
- 弹窗会 `history.pushState` 一条记录来支持 iOS 侧滑返回；游戏内不要自行操作 `history`
- 反应力只有刷新个人纪录才给星星，这是防刷分设计，不是 bug
