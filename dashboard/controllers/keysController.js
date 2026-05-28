"use strict";

const { sendCommand, extractString, extractInteger, extractArray } = require("../lib/tcpClient");

// GET /api/keys  — all keys with type and TTL
async function getAllKeys(req, res, next) {
    try {
        const keys = extractArray(await sendCommand("KEYS", "*"));

        const details = await Promise.all(
            keys.map(async (key) => {
                const [typeRes, ttlRes] = await Promise.all([
                    sendCommand("TYPE", key),
                    sendCommand("TTL",  key),
                ]);

                const type = extractString(typeRes);
                const ttl  = extractInteger(ttlRes);

                let preview = null;
                if (type === "string") {
                    preview = extractString(await sendCommand("GET", key));
                } else if (type === "list") {
                    const items = extractArray(await sendCommand("LRANGE", key, "0", "4"));
                    preview = items;
                }

                return { key, type, ttl, preview };
            })
        );

        res.json({ keys: details });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllKeys };
