/** 全局轻提示。同一时间只保留一条，重复调用会重置计时。 */
let timer = 0;

/**
 * @param {string} message
 * @param {number} [duration]
 */
export function toast(message, duration = 2600) {
  const node = document.getElementById('toast');
  if (!node) return;

  node.textContent = message;
  node.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => node.classList.remove('show'), duration);
}
