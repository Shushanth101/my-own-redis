"use strict";

const { sendCommand, extractInteger, extractArray, extractString } = require("../lib/tcpClient");

// POST /api/list/lpush  body: { key, values: string[] }
async function lpush(req, res, next) {
    try {
        const { key, values } = req.body;
        if (!key || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({ error: "key and values[] are required" });
        }
        const count = extractInteger(await sendCommand("LPUSH", key, ...values));
        res.json({ ok: true, length: count });
    } catch (err) {
        next(err);
    }
}

// POST /api/list/rpush  body: { key, values: string[] }
async function rpush(req, res, next) {
    try {
        const { key, values } = req.body;
        if (!key || !Array.isArray(values) || values.length === 0) {
            return res.status(400).json({ error: "key and values[] are required" });
        }
        const count = extractInteger(await sendCommand("RPUSH", key, ...values));
        res.json({ ok: true, length: count });
    } catch (err) {
        next(err);
    }
}

// POST /api/list/lpop  body: { key }
async function lpop(req, res, next) {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: "key is required" });
        const value = extractString(await sendCommand("LPOP", key));
        if (value === null) return res.status(404).json({ error: "List empty or key not found" });
        res.json({ ok: true, value });
    } catch (err) {
        next(err);
    }
}

// POST /api/list/rpop  body: { key }
async function rpop(req, res, next) {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ error: "key is required" });
        const value = extractString(await sendCommand("RPOP", key));
        if (value === null) return res.status(404).json({ error: "List empty or key not found" });
        res.json({ ok: true, value });
    } catch (err) {
        next(err);
    }
}

// GET /api/list/lrange/:key?start=0&stop=-1
async function lrange(req, res, next) {
    try {
        const { key } = req.params;
        const start   = req.query.start ?? "0";
        const stop    = req.query.stop  ?? "-1";
        const items   = extractArray(await sendCommand("LRANGE", key, String(start), String(stop)));
        res.json({ key, items, length: items.length });
    } catch (err) {
        next(err);
    }
}

module.exports = { lpush, rpush, lpop, rpop, lrange };
