小岛游戏屋 PWA 安装版
=====================

内容
- index.html：游戏主页（四款小游戏）
- manifest.json：PWA 安装信息
- service-worker.js：离线缓存
- icons/：应用图标

部署到 GitHub Pages
1. 解压本 ZIP。
2. 将其中所有内容（包括 icons 文件夹）上传到 GitHub 仓库的发布目录。
3. 如果使用项目仓库，请确认 Pages 的发布源为 main 分支 / (root)。
4. 等待 Pages 发布完成，通过 HTTPS 网址打开。
5. 首次联网打开并等待页面加载完成，让离线资源写入缓存。
6. iPhone：使用 Safari 打开网站 -> 分享 -> 添加到主屏幕 -> 添加。
7. 回到主屏幕点击“小岛游戏屋”图标启动。首次缓存完成后，核心游戏可离线运行。

重要说明
- 不要只上传 index.html；manifest.json、service-worker.js 和 icons 文件夹都必须一起上传。
- Service Worker 需要 HTTPS（GitHub Pages 提供 HTTPS）。
- 更新网站后，可能需要联网重新打开一次，等待新版缓存更新。
- 离线时广告和在线统计不可用；本项目当前没有接入广告。
- 游戏记录保存在本机浏览器存储中，清除网站数据可能导致记录丢失。
