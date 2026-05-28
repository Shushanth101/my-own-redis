/**
 * api.js — Thin fetch wrapper for all /api/* routes
 * Available globally on every page via the layout.
 */

const RedisAPI = (() => {

    async function request(method, path, body) {
        const opts = {
            method,
            headers: { "Content-Type": "application/json" }
        };
        if (body !== undefined) opts.body = JSON.stringify(body);

        const res  = await fetch(path, opts);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.error || `HTTP ${res.status}`);
        }
        return data;
    }

    return {
        // ── Keys ──────────────────────────────────────────────────────────
        getAllKeys:  ()          => request("GET",    "/api/keys"),

        // ── KV ────────────────────────────────────────────────────────────
        set:        (key, value, ex) => request("POST",   "/api/kv/set",    { key, value, ex }),
        get:        (key)            => request("GET",    `/api/kv/get/${encodeURIComponent(key)}`),
        del:        (key)            => request("DELETE", `/api/kv/del/${encodeURIComponent(key)}`),
        exists:     (key)            => request("GET",    `/api/kv/exists/${encodeURIComponent(key)}`),
        ttl:        (key)            => request("GET",    `/api/kv/ttl/${encodeURIComponent(key)}`),
        flushAll:   ()               => request("POST",   "/api/kv/flushall"),

        // ── Lists ─────────────────────────────────────────────────────────
        lpush:  (key, values) => request("POST", "/api/list/lpush", { key, values }),
        rpush:  (key, values) => request("POST", "/api/list/rpush", { key, values }),
        lpop:   (key)         => request("POST", "/api/list/lpop",  { key }),
        rpop:   (key)         => request("POST", "/api/list/rpop",  { key }),
        lrange: (key, start, stop) =>
            request("GET", `/api/list/lrange/${encodeURIComponent(key)}?start=${start}&stop=${stop}`),

        // ── Console ───────────────────────────────────────────────────────
        console: (command)    => request("POST", "/api/console", { command }),
    };
})();

// Export for module-style usage if needed
if (typeof module !== "undefined") module.exports = RedisAPI;
