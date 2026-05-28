/**
 * toast.js — Lightweight toast notification system
 * No dependencies. Available globally via the layout.
 */

const Toast = (() => {
    const container = () => document.getElementById("toast-container");

    const ICONS = {
        success: `<svg viewBox="0 0 24 24" fill="none" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        error:   `<svg viewBox="0 0 24 24" fill="none" class="toast-icon"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
        info:    `<svg viewBox="0 0 24 24" fill="none" class="toast-icon"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
        warning: `<svg viewBox="0 0 24 24" fill="none" class="toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    };

    function show(type, title, message = "", duration = 3500) {
        const c = container();
        if (!c) return;

        const el = document.createElement("div");
        el.className = `toast toast--${type}`;
        el.setAttribute("role", "alert");
        el.innerHTML = `
            ${ICONS[type] || ICONS.info}
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                ${message ? `<div class="toast-msg">${message}</div>` : ""}
            </div>
        `;

        c.appendChild(el);

        // Auto-dismiss
        const dismiss = () => {
            el.classList.add("toast-out");
            el.addEventListener("animationend", () => el.remove(), { once: true });
        };

        const timer = setTimeout(dismiss, duration);
        el.addEventListener("click", () => { clearTimeout(timer); dismiss(); });
    }

    return {
        success: (title, msg, dur) => show("success", title, msg, dur),
        error:   (title, msg, dur) => show("error",   title, msg, dur),
        info:    (title, msg, dur) => show("info",    title, msg, dur),
        warning: (title, msg, dur) => show("warning", title, msg, dur),
    };
})();
