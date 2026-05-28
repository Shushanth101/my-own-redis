/**
 * console.js — Redis terminal emulator
 * Requires: api.js, toast.js (loaded via layout)
 */

(function () {
    "use strict";

    // ── State ─────────────────────────────────────────────────────────────
    const history   = [];
    let   histIdx   = -1;
    let   acIdx     = -1;

    // ── Elements ──────────────────────────────────────────────────────────
    const output       = document.getElementById("terminal-output");
    const input        = document.getElementById("terminal-input");
    const sendBtn      = document.getElementById("terminal-send-btn");
    const clearBtn     = document.getElementById("clear-console-btn");
    const exportBtn    = document.getElementById("export-console-btn");
    const acPanel      = document.getElementById("autocomplete-panel");
    const acList       = document.getElementById("autocomplete-list");

    // ── Command autocomplete data ──────────────────────────────────────────
    const COMMANDS = [
        { name: "SET",      args: "key value [EX seconds]" },
        { name: "GET",      args: "key" },
        { name: "DEL",      args: "key" },
        { name: "EXISTS",   args: "key" },
        { name: "TTL",      args: "key" },
        { name: "TYPE",     args: "key" },
        { name: "KEYS",     args: "[pattern]" },
        { name: "FLUSHALL", args: "" },
        { name: "LPUSH",    args: "key value [value …]" },
        { name: "RPUSH",    args: "key value [value …]" },
        { name: "LPOP",     args: "key" },
        { name: "RPOP",     args: "key" },
        { name: "LRANGE",   args: "key start stop" },
    ];

    // ── Send command ──────────────────────────────────────────────────────
    async function sendCommand() {
        const raw = input.value.trim();
        if (!raw) return;

        closeAutocomplete();
        appendLine("prompt", raw);

        history.unshift(raw);
        if (history.length > 200) history.pop();
        histIdx = -1;
        input.value = "";

        try {
            const data = await RedisAPI.console(raw);
            renderResponse(data);
        } catch (err) {
            appendLine("error", `(connection error) ${err.message}`);
            Toast.error("Connection Error", err.message);
        }

        scrollBottom();
    }

    // ── Render a parsed RESP response ─────────────────────────────────────
    function renderResponse(data) {
        const { type, value } = data;

        switch (type) {
            case "simple":
                appendLine("ok", `+${value}`);
                break;

            case "error":
                appendLine("error", `-${value}`);
                break;

            case "integer":
                appendLine("integer", `(integer) ${value}`);
                break;

            case "bulk":
                if (value === null) {
                    appendLine("null", "(nil)");
                } else {
                    appendLine("bulk", `"${value}"`);
                }
                break;

            case "array":
                if (!value || value.length === 0) {
                    appendLine("null", "(empty array)");
                } else {
                    appendLine("array", `(array) ${value.length} item(s):`);
                    value.forEach((item, i) => {
                        const display = item === null ? "(nil)" : `"${item}"`;
                        appendLine("item", `  ${i + 1}) ${display}`);
                    });
                }
                break;

            default:
                appendLine("bulk", String(value ?? "(null)"));
        }
    }

    // ── Append a line to the terminal ──────────────────────────────────────
    function appendLine(type, text) {
        const div = document.createElement("div");
        div.className = "terminal-line";

        const classMap = {
            prompt:  "t-cmd",
            ok:      "t-ok",
            error:   "t-error",
            integer: "t-integer",
            bulk:    "t-bulk",
            null:    "t-null",
            array:   "t-array",
            item:    "t-item",
        };

        const span = document.createElement("span");
        span.className = classMap[type] || "t-bulk";

        if (type === "prompt") {
            const promptSpan = document.createElement("span");
            promptSpan.className = "t-prompt";
            promptSpan.textContent = "redis> ";
            div.appendChild(promptSpan);
        }

        span.textContent = text;
        div.appendChild(span);
        output.appendChild(div);
    }

    function scrollBottom() {
        output.scrollTop = output.scrollHeight;
    }

    // ── Keyboard handler ──────────────────────────────────────────────────
    input.addEventListener("keydown", e => {
        switch (e.key) {
            case "Enter":
                e.preventDefault();
                sendCommand();
                break;

            case "ArrowUp":
                e.preventDefault();
                if (history.length > 0) {
                    histIdx = Math.min(histIdx + 1, history.length - 1);
                    input.value = history[histIdx];
                    moveCursorToEnd();
                }
                closeAutocomplete();
                break;

            case "ArrowDown":
                e.preventDefault();
                if (histIdx > 0) {
                    histIdx--;
                    input.value = history[histIdx];
                } else {
                    histIdx = -1;
                    input.value = "";
                }
                moveCursorToEnd();
                closeAutocomplete();
                break;

            case "Tab":
                e.preventDefault();
                handleTabAutocomplete();
                break;

            case "Escape":
                closeAutocomplete();
                break;
        }
    });

    input.addEventListener("input", () => {
        histIdx = -1;
        updateAutocomplete();
    });

    sendBtn.addEventListener("click", sendCommand);

    // Click anywhere outside to close autocomplete
    document.addEventListener("click", e => {
        if (!e.target.closest(".terminal-window")) closeAutocomplete();
    });

    // ── Command history nav ───────────────────────────────────────────────
    function moveCursorToEnd() {
        const len = input.value.length;
        input.setSelectionRange(len, len);
    }

    // ── Autocomplete ──────────────────────────────────────────────────────
    function updateAutocomplete() {
        const val = input.value.toUpperCase();
        if (!val || val.includes(" ")) { closeAutocomplete(); return; }

        const matches = COMMANDS.filter(c => c.name.startsWith(val) && c.name !== val);
        if (matches.length === 0) { closeAutocomplete(); return; }

        acList.innerHTML = "";
        acIdx = -1;

        matches.forEach((cmd, i) => {
            const li = document.createElement("li");
            li.className = "autocomplete-item";
            li.setAttribute("role", "option");
            li.setAttribute("data-idx", i);
            li.innerHTML = `<span class="cmd-name">${cmd.name}</span> <span class="cmd-args">${cmd.args}</span>`;
            li.addEventListener("click", () => {
                input.value = cmd.name + (cmd.args ? " " : "");
                closeAutocomplete();
                input.focus();
            });
            acList.appendChild(li);
        });

        acPanel.classList.remove("hidden");
    }

    function handleTabAutocomplete() {
        const items = acList.querySelectorAll(".autocomplete-item");
        if (items.length === 0) return;

        // Cycle through items
        acIdx = (acIdx + 1) % items.length;
        items.forEach((el, i) => el.classList.toggle("highlighted", i === acIdx));

        const name = items[acIdx].querySelector(".cmd-name").textContent;
        const args = items[acIdx].querySelector(".cmd-args").textContent;
        input.value = name + (args ? " " : "");
    }

    function closeAutocomplete() {
        acPanel.classList.add("hidden");
        acList.innerHTML = "";
        acIdx = -1;
    }

    // ── Clear ─────────────────────────────────────────────────────────────
    clearBtn.addEventListener("click", () => {
        // Remove everything except the static welcome lines
        const lines = output.querySelectorAll(".terminal-line:not(.terminal-welcome)");
        lines.forEach(l => l.remove());
        Toast.info("Console Cleared");
    });

    // ── Export log ────────────────────────────────────────────────────────
    exportBtn.addEventListener("click", () => {
        const lines = Array.from(output.querySelectorAll(".terminal-line"))
            .map(l => l.textContent)
            .join("\n");

        const blob = new Blob([lines], { type: "text/plain" });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `redis-console-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Collapsible command reference ─────────────────────────────────────
    const cmdRefToggle = document.getElementById("cmd-ref-toggle");
    const cmdRefPanel  = document.getElementById("cmd-ref-panel");
    const cmdRefBody   = document.getElementById("cmd-ref-body");

    cmdRefToggle.addEventListener("click", () => {
        const isOpen = cmdRefPanel.classList.toggle("open");
        cmdRefToggle.setAttribute("aria-expanded", isOpen);
    });

    cmdRefToggle.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cmdRefToggle.click();
        }
    });

    // ── Focus terminal input on load ──────────────────────────────────────
    input.focus();
    scrollBottom();

})();
