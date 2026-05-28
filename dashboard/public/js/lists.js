/**
 * lists.js — List operations page
 * Requires: api.js, toast.js (loaded via layout)
 */

(function () {
    "use strict";

    const $ = id => document.getElementById(id);

    // ── Push ──────────────────────────────────────────────────────────────
    const pushKey    = $("push-key");
    const pushValues = $("push-values");
    const lpushBtn   = $("lpush-btn");
    const rpushBtn   = $("rpush-btn");

    async function doPush(direction) {
        const key    = pushKey.value.trim();
        const rawVals = pushValues.value;

        if (!key) { Toast.warning("Missing Key", "Provide a list key."); return; }

        const values = rawVals.split("\n").map(v => v.trim()).filter(Boolean);
        if (values.length === 0) { Toast.warning("No Values", "Enter at least one value."); return; }

        const btn = direction === "L" ? lpushBtn : rpushBtn;
        btn.disabled = true;

        try {
            const fn = direction === "L" ? RedisAPI.lpush : RedisAPI.rpush;
            const { length } = await fn(key, values);
            Toast.success(`${direction}PUSH OK`, `"${key}" now has ${length} item(s).`);
            pushValues.value = "";
        } catch (err) {
            Toast.error(`${direction}PUSH Failed`, err.message);
        } finally {
            btn.disabled = false;
        }
    }

    lpushBtn.addEventListener("click", () => doPush("L"));
    rpushBtn.addEventListener("click", () => doPush("R"));

    // ── Pop ───────────────────────────────────────────────────────────────
    const popKey    = $("pop-key");
    const lpopBtn   = $("lpop-btn");
    const rpopBtn   = $("rpop-btn");
    const popResult = $("pop-result");
    const popResVal = $("pop-result-value");

    async function doPop(direction) {
        const key = popKey.value.trim();
        if (!key) { Toast.warning("Missing Key", "Provide a list key."); return; }

        const btn = direction === "L" ? lpopBtn : rpopBtn;
        btn.disabled = true;

        try {
            const fn = direction === "L" ? RedisAPI.lpop : RedisAPI.rpop;
            const { value } = await fn(key);
            popResVal.textContent = value;
            popResult.classList.remove("hidden");
            Toast.success(`${direction}POP`, `Popped: "${value}"`);
        } catch (err) {
            popResult.classList.add("hidden");
            Toast.error(`${direction}POP Failed`, err.message);
        } finally {
            btn.disabled = false;
        }
    }

    lpopBtn.addEventListener("click", () => doPop("L"));
    rpopBtn.addEventListener("click", () => doPop("R"));

    // ── LRANGE ────────────────────────────────────────────────────────────
    const lrangeKey    = $("lrange-key");
    const lrangeStart  = $("lrange-start");
    const lrangeStop   = $("lrange-stop");
    const lrangeBtn    = $("lrange-btn");
    const lrangeResult = $("lrange-result");
    const lrangeItems  = $("lrange-items");
    const lrangeCount  = $("lrange-count");
    const lrangeEmpty  = $("lrange-empty");

    lrangeBtn.addEventListener("click", async () => {
        const key   = lrangeKey.value.trim();
        const start = lrangeStart.value ?? "0";
        const stop  = lrangeStop.value  ?? "-1";

        if (!key) { Toast.warning("Missing Key", "Provide a list key."); return; }

        lrangeBtn.disabled = true;

        try {
            const { items } = await RedisAPI.lrange(key, start, stop);

            lrangeItems.innerHTML = "";
            lrangeCount.textContent = items.length;

            if (items.length === 0) {
                lrangeResult.classList.add("hidden");
                lrangeEmpty.classList.remove("hidden");
            } else {
                lrangeEmpty.classList.add("hidden");
                lrangeResult.classList.remove("hidden");
                const frag = document.createDocumentFragment();
                items.forEach(item => {
                    const li = document.createElement("li");
                    li.innerHTML = `<span>${escHtml(item)}</span>`;
                    frag.appendChild(li);
                });
                lrangeItems.appendChild(frag);
            }
        } catch (err) {
            Toast.error("LRANGE Failed", err.message);
        } finally {
            lrangeBtn.disabled = false;
        }
    });

    lrangeKey.addEventListener("keydown", e => { if (e.key === "Enter") lrangeBtn.click(); });

    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

})();
