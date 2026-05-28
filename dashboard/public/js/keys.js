/**
 * keys.js — Key Browser page interactions
 * Requires: api.js, toast.js (loaded via layout)
 */

(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    let allKeys      = [];
    let activeFilter = "all";
    let searchTerm   = "";

    const tbody       = $("keys-tbody");
    const loadingEl   = $("keys-loading");
    const emptyEl     = $("keys-empty");
    const searchInput = $("key-search");
    const refreshBtn  = $("refresh-keys-btn");

    // ── Load keys ─────────────────────────────────────────────────────────
    async function loadKeys() {
        loadingEl.style.display = "flex";
        tbody.innerHTML = "";
        emptyEl.classList.add("hidden");

        try {
            const { keys } = await RedisAPI.getAllKeys();
            allKeys = keys || [];
            renderTable();
        } catch (err) {
            Toast.error("Load Failed", err.message);
        } finally {
            loadingEl.style.display = "none";
        }
    }

    // ── Filter & render ───────────────────────────────────────────────────
    function getFiltered() {
        return allKeys.filter(k => {
            const matchType = activeFilter === "all"
                || k.type === activeFilter
                || (activeFilter === "expiring" && k.ttl >= 0);
            const matchSearch = !searchTerm || k.key.toLowerCase().includes(searchTerm);
            return matchType && matchSearch;
        });
    }

    function renderTable() {
        tbody.innerHTML = "";
        const filtered = getFiltered();

        if (filtered.length === 0) {
            emptyEl.classList.remove("hidden");
            return;
        }

        emptyEl.classList.add("hidden");

        const frag = document.createDocumentFragment();

        filtered.forEach(k => {
            const tr  = document.createElement("tr");
            tr.setAttribute("data-key", k.key);

            const ttlText  = k.ttl === -1 ? "∞"
                           : k.ttl === -2 ? "—"
                           :                `${k.ttl}s`;

            const ttlClass = k.ttl === -1 ? "ttl-chip--persistent"
                           : k.ttl <= 10  ? "ttl-chip--urgent"
                           :                "ttl-chip--expiring";

            const isExpanding = k.type === "list" && Array.isArray(k.preview) && k.preview.length > 0;
            const previewStr  = k.type === "string"
                ? escHtml(String(k.preview ?? "").slice(0, 80))
                : k.type === "list"
                    ? `<span class="type-badge type-badge--list">${(k.preview || []).length} items</span>`
                    : "—";

            tr.classList.toggle("expandable-row", isExpanding);
            tr.innerHTML = `
                <td class="td-key">${escHtml(k.key)}</td>
                <td><span class="type-badge type-badge--${k.type}">${k.type}</span></td>
                <td class="td-value">${previewStr}</td>
                <td><span class="ttl-chip ${ttlClass}">${ttlText}</span></td>
                <td class="td-actions">
                    <button class="icon-btn icon-btn--del" title="Delete key" data-del="${escHtml(k.key)}">
                        <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    </button>
                </td>
            `;

            // Expandable list preview
            if (isExpanding) {
                const expandTr = document.createElement("tr");
                expandTr.className = "expand-row hidden";
                expandTr.setAttribute("data-expand-for", k.key);
                const items = (k.preview || []).map(i =>
                    `<span class="expand-list-item">${escHtml(i)}</span>`
                ).join("");
                expandTr.innerHTML = `
                    <td colspan="5" class="expand-content">
                        <div class="expand-list">${items}</div>
                    </td>
                `;
                frag.appendChild(tr);
                frag.appendChild(expandTr);

                tr.addEventListener("click", (e) => {
                    if (e.target.closest(".icon-btn")) return;
                    expandTr.classList.toggle("hidden");
                });
            } else {
                frag.appendChild(tr);
            }
        });

        tbody.appendChild(frag);

        // Delegate DEL button clicks
        tbody.querySelectorAll(".icon-btn--del").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const key = btn.dataset.del;
                if (!confirm(`Delete key "${key}"?`)) return;
                try {
                    await RedisAPI.del(key);
                    Toast.success("Key Deleted", key);
                    await loadKeys();
                } catch (err) {
                    Toast.error("DEL Failed", err.message);
                }
            });
        });
    }

    // ── Tab filter ────────────────────────────────────────────────────────
    document.getElementById("type-tabs").addEventListener("click", e => {
        const tab = e.target.closest(".tab");
        if (!tab) return;
        document.querySelectorAll(".tab").forEach(t => {
            t.classList.toggle("active", t === tab);
            t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        activeFilter = tab.dataset.type;
        renderTable();
    });

    // ── Search ────────────────────────────────────────────────────────────
    searchInput.addEventListener("input", () => {
        searchTerm = searchInput.value.toLowerCase().trim();
        renderTable();
    });

    // ── Refresh ───────────────────────────────────────────────────────────
    refreshBtn.addEventListener("click", loadKeys);

    // ── Init ──────────────────────────────────────────────────────────────
    loadKeys();

    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

})();
