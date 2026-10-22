/**
 * 离线缓存策略（v3）
 *
 * - 导航请求：network-first，4 秒超时回退缓存。保证每次打开都是最新 HTML。
 * - 其它同源资源：stale-while-revalidate，先给缓存再后台更新。
 * - 安装时预缓存全部核心文件，单个失败不会拖垮整个安装。
 * - 发版时修改 CACHE_VERSION 即可清理旧缓存。
 */

const CACHE_VERSION = 'v4';
const CACHE_NAME = `island-arcade-${CACHE_VERSION}`;
const NAV_TIMEOUT_MS = 4000;

const SHELL_URL = new URL('./index.html', self.location.href).href;

const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/core/dom.js',
  './js/core/modal.js',
  './js/core/registry.js',
  './js/core/store.js',
  './js/core/toast.js',
  './js/games/index.js',
  './js/games/2048.js',
  './js/games/memory.js',
  './js/games/reaction.js',
  './js/games/guess.js',
  './js/games/mole.js',
  './js/games/rps.js',
  './js/games/ttt.js',
  './js/games/math.js',
  './js/games/color.js',
  './js/games/target.js',
  './js/games/sequence.js',
  './js/games/odd.js',
  './js/logic/2048.js',
  './js/logic/rps.js',
  './js/logic/ttt.js',
  './js/logic/math.js',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        CORE_ASSETS.map(async (path) => {
          const url = new URL(path, self.location.href).href;
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            await cache.put(url, response);
          } catch (error) {
            // 单个资源失败不影响其它资源与 SW 安装
            console.warn('[sw] 预缓存失败', path, error);
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('island-arcade-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NAV_TIMEOUT_MS);

  try {
    const response = await fetch(request, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
    return response;
  } catch {
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ??
      (await caches.match(SHELL_URL));
    if (cached) return cached;

    return new Response('离线中，无法加载页面。请联网后重试。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const response = await network;
  if (response) return response;

  return new Response('', { status: 504, statusText: 'Offline' });
}
