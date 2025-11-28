import { CONFIG } from './config.js';

function getStoredToken() {
    try {
        const raw = localStorage.getItem(CONFIG.storageKey)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed?.token || null
    } catch (e) {
        return null
    }
}

function buildUrl(path) {
    if (!path) return CONFIG.apiBase
    if (/^https?:\/\//.test(path)) return path
    return CONFIG.apiBase.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '')
}

async function request(method, path, { body = null, params = null, headers = {}, signal = null } = {}) {
    const url = buildUrl(path) + (params ? '?' + new URLSearchParams(params).toString() : '')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout)
    const token = getStoredToken()

    const defaultHeaders = {
        'Accept': 'application/json',
        ...headers
    };

    // si body es objeto y no es FormData, enviamos JSON
    let payload = body;
    if (body && !(body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(url, {
            method,
            headers: defaultHeaders,
            body: payload,
            signal: signal || controller.signal
        });

        clearTimeout(timeoutId);

        const text = await res.text()
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

        if (!res.ok) {
            return { ok: false, status: res.status, data, error: data?.error || data || res.statusText }
        }
        return { ok: true, status: res.status, data }
    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
            return { ok: false, status: 0, error: 'timeout' }
        }
        return { ok: false, status: 0, error: err.message || 'network_error' }
    }
}

export async function apiGet(path, opts = {}) { return request('GET', path, opts); }
export async function apiPost(path, body, opts = {}) { return request('POST', path, { ...opts, body }); }
export async function apiPut(path, body, opts = {}) { return request('PUT', path, { ...opts, body }); }
export async function apiDelete(path, body = null, opts = {}) { return request('DELETE', path, { ...opts, body }); }

export function getToken() { return getStoredToken(); }
export function setToken(raw) {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(raw))
        return true;
    } catch (e) { return false; }
}
export function clearToken() {
    try { localStorage.removeItem(CONFIG.storageKey) } catch (e) {}
}
export default { apiGet, apiPost, apiPut, apiDelete, getToken, setToken, clearToken }