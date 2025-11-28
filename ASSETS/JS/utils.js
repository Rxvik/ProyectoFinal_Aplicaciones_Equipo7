export function qs(selector, root = document) {
    return root.querySelector(selector);
}
export function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
export function on(target, event, handler, opts) {
    target.addEventListener(event, handler, opts);
}
export function delegate(root, selector, event, handler) {
    root.addEventListener(event, e => {
        const el = e.target.closest(selector);
        if (el && root.contains(el)) handler(e, el);
    });
}
export function createEl(tag, attrs = {}, text) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text != null) el.textContent = text;
    return el;
}
export function setText(el, text) {
    if (!el) return;
    el.textContent = text;
}
export function formatDateISO(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}
export function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}
export function parseJSONSafe(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
}