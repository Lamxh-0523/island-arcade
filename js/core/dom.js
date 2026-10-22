/**
 * 极简 DOM 工具，避免引入框架。
 * 仅保留项目真正需要的三个能力：查询、批量查询、创建元素。
 */

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T | null}
 */
export function $(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * @template {Element} T
 * @param {string} selector
 * @param {ParentNode} [root]
 * @returns {T[]}
 */
export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * 创建一个元素。
 * attrs 支持：class / text / html / dataset / on* 事件 / 普通属性。
 *
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param {...(Node | string | number | null | false | undefined | Array<Node | string | number | null | false | undefined>)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}
