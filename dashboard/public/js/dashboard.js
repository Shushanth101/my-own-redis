/**
 * dashboard.js — Main dashboard page interactions
 * Requires: api.js, toast.js (loaded via layout)
 */

(function () {
    "use strict";

    // ── State ─────────────────────────────────────────────────────────────
    let allKeys        = [];
    let refreshTimer   = null;
    const REFRESH_MS   = 5000;

    // ── Elements ──────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    const statusDot   = $("status-dot");
    const statusLabel = $("status-label");

    // Stats
    const valTotal    = $("val-total-keys");
    const valStrings  = $("val-string-keys");
    const valLists    = $("val-list-keys");
    const valExpiring = $("val-expiring-keys");

    // Quick ops
    const setKeyEl    = $("set-key");
    const setValueEl  = $("set-value");
    const setTtlEl    = $("set-ttl");
    const setBtn      = $("set-btn");
    const getKeyEl    = $("get-key");
    const getBtn      = $("get-btn");
    const getResult   = $("get-result");
    const getResultV  = $("get-result-value");

    // Keys snapshot
    const keysList    = $("recent-keys-list");
    const keysEmpty   = $("keys-empty-state");
    const keyBadge    = $("key-count-badge");

    // Controls
    const autoToggle  = $("auto-refresh-toggle");
    const flushBtn    = $("flush-all-btn");

    // ── Server connectivity check ──────────────────────────────────────────
    async function checkServer() {
        try {
            await RedisAPI.getAllKeys();
            statusDot.className   = "status-dot online";
            statusLabel.textContent = "Connected";
        } catch {
            statusDot.className   = "status-dot offline";
            statusLabel.textContent = "Offline";
        }
    }

    // ── Load stats & key list ──────────────────────────────────────────────
    async function loadData() {
        try {
            const { keys } = await RedisAPI.getAllKeys();
            allKeys = keys || [];

            const strings  = allKeys.filter(k => k.type === "string");
            const lists    = allKeys.filter(k => k.type === "list");
            const expiring = allKeys.filter(k => k.ttl >= 0);

            valTotal.textContent    = allKeys.length;
            valStrings.textContent  = strings.length;
            valLists.textContent    = lists.length;
            valExpiring.textContent = expiring.length;

            keyBadge.textContent = `${allKeys.length} key${allKeys.length !== 1 ? "s" : ""}`;

            renderSnapshot(allKeys);
        } catch (err) {
            console.error("Dashboard load error:", err);
        }
    }

    // ── Render key snapshot ────────────────────────────────────────────────
    function renderSnapshot(keys) {
        // Remove old key rows (keep empty-state)
        Array.from(keysList.querySelectorAll(".key-row")).forEach(el => el.remove());

        if (keys.length === 0) {
            keysEmpty.classList.remove("hidden");
            return;
        }

        keysEmpty.classList.add("hidden");

        const frag = document.createDocumentFragment();
        const show  = keys.slice(0, 20); // cap at 20 in snapshot

        show.forEach(k => {
            const row = document.createElement("div");
            row.className = "key-row";

            const preview = Array.isArray(k.preview)
                ? `[${k.preview.join(", ")}]`
                : (k.preview ?? "—");

            const ttlClass = k.ttl === -1 ? "ttl-chip--persistent"
                           : k.ttl <= 10  ? "ttl-chip--urgent"
                           :                "ttl-chip--expiring";

            const ttlText  = k.ttl === -1 ? "∞"
                           : k.ttl === -2 ? "none"
                           :                `${k.ttl}s`;

            row.innerHTML = `
                <span class="key-name">${escHtml(k.key)}</span>
                <span class="key-value-preview">${escHtml(String(preview).slice(0, 60))}</span>
                <span class="ttl-chip ${ttlClass}">${ttlText}</span>
                <span class="type-badge type-badge--${k.type}">${k.type}</span>
            `;

            frag.appendChild(row);
        });

        keysList.insertBefore(frag, keysEmpty);
    }

    // ── Quick SET ──────────────────────────────────────────────────────────
    setBtn.addEventListener("click", async () => {
        const key   = setKeyEl.value.trim();
        const value = setValueEl.value.trim();
        const ex    = parseInt(setTtlEl.value, 10) || undefined;

        if (!key || !value) {
            Toast.warning("Missing Fields", "Key and value are required.");
            return;
        }

        setBtn.disabled = true;
        try {
            await RedisAPI.set(key, value, ex);
            Toast.success("Key Set", `${key} = "${value}"${ex ? ` (TTL: ${ex}s)` : ""}`);
            setKeyEl.value = setValueEl.value = setTtlEl.value = "";
            await loadData();
        } catch (err) {
            Toast.error("SET Failed", err.message);
        } finally {
            setBtn.disabled = false;
        }
    });

    // Enter key on set fields
    [setKeyEl, setValueEl, setTtlEl].forEach(el =>
        el.addEventListener("keydown", e => { if (e.key === "Enter") setBtn.click(); })
    );

    // ── Quick GET ──────────────────────────────────────────────────────────
    getBtn.addEventListener("click", async () => {
        const key = getKeyEl.value.trim();
        if (!key) { Toast.warning("Missing Key", "Enter a key to GET."); return; }

        getBtn.disabled = true;
        try {
            const { value } = await RedisAPI.get(key);
            getResultV.textContent = value;
            getResult.classList.remove("hidden");
        } catch (err) {
            getResult.classList.add("hidden");
            Toast.error("GET Failed", err.message);
        } finally {
            getBtn.disabled = false;
        }
    });

    getKeyEl.addEventListener("keydown", e => { if (e.key === "Enter") getBtn.click(); });

    // ── FLUSHALL ──────────────────────────────────────────────────────────
    flushBtn.addEventListener("click", async () => {
        if (!confirm("FLUSHALL: This will delete ALL keys. Are you sure?")) return;
        flushBtn.disabled = true;
        try {
            await RedisAPI.flushAll();
            Toast.success("Database Flushed", "All keys have been deleted.");
            await loadData();
        } catch (err) {
            Toast.error("FLUSHALL Failed", err.message);
        } finally {
            flushBtn.disabled = false;
        }
    });

    // ── Auto-refresh ───────────────────────────────────────────────────────
    function startRefresh() {
        if (refreshTimer) return;
        refreshTimer = setInterval(loadData, REFRESH_MS);
    }

    function stopRefresh() {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }

    autoToggle.addEventListener("change", () => {
        autoToggle.checked ? startRefresh() : stopRefresh();
    });

    // ── Live TTL countdown ─────────────────────────────────────────────────
    // The snapshot TTL values are from the server; for exact real-time countdown
    // we'd need a local timer per key. For simplicity: reload data on interval.
    // This works because auto-refresh calls loadData() which re-fetches TTL values.

    // ── Init ───────────────────────────────────────────────────────────────
    checkServer();
    loadData();
    startRefresh();

    // Helper
    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

})();
