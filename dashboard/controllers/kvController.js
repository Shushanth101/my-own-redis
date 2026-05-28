"use strict";

const { sendCommand, extractString, extractInteger } = require("../lib/tcpClient");

// POST /api/kv/set  body: { key, value, ex? }
async function setKey(req, res, next) {
    try {
        const { key, value, ex } = req.body;
        if (!key || value === undefined) {
            return res.status(400).json({ error: "key and value are required" });
        }

        const args = ["SET", key, value];
        if (ex && parseInt(ex, 10) > 0) {
            args.push("EX", String(parseInt(ex, 10)));
        }

        const result = extractString(await sendCommand(...args));
        res.json({ ok: result === "OK", result });
    } catch (err) {
        next(err);
    }
}

// GET /api/kv/get/:key
async function getKey(req, res, next) {
    try {
        const { key } = req.params;
        const value = extractString(await sendCommand("GET", key));
        if (value === null) {
            return res.status(404).json({ error: "Key not found or expired" });
        }
        res.json({ key, value });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/kv/del/:key
async function delKey(req, res, next) {
    try {
        const { key } = req.params;
        const count = extractInteger(await sendCommand("DEL", key));
        res.json({ deleted: count > 0, count });
    } catch (err) {
        next(err);
    }
}

// GET /api/kv/exists/:key
async function existsKey(req, res, next) {
    try {
        const { key } = req.params;
        const count = extractInteger(await sendCommand("EXISTS", key));
        res.json({ exists: count === 1 });
    } catch (err) {
        next(err);
    }
}

// GET /api/kv/ttl/:key
async function ttlKey(req, res, next) {
    try {
        const { key } = req.params;
        const ttl = extractInteger(await sendCommand("TTL", key));
        res.json({ key, ttl });
    } catch (err) {
        next(err);
    }
}

// POST /api/kv/flushall
async function flushAll(req, res, next) {
    try {
        const result = extractString(await sendCommand("FLUSHALL"));
        res.json({ ok: result === "OK" });
    } catch (err) {
        next(err);
    }
}

module.exports = { setKey, getKey, delKey, existsKey, ttlKey, flushAll };
