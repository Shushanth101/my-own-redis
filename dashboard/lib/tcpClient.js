"use strict";

/**
 * tcpClient.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A lightweight TCP client that communicates with the Redis clone server using
 * the RESP (Redis Serialization Protocol) over raw TCP sockets.
 *
 * Each call opens a fresh socket, sends one command, waits for the full
 * response, then closes the connection.  This keeps the implementation simple
 * and avoids shared-state bugs between concurrent requests.
 *
 * Usage:
 *   const { sendCommand } = require("../lib/tcpClient");
 *   const result = await sendCommand("SET", "foo", "bar");
 *   // → { type: "simple", value: "OK" }
 *
 *   const result = await sendCommand("GET", "foo");
 *   // → { type: "bulk",   value: "bar" }
 *
 *   const result = await sendCommand("LRANGE", "mylist", "0", "-1");
 *   // → { type: "array",  value: ["a", "b", "c"] }
 */

const net = require("net");

const TCP_HOST = process.env.REDIS_HOST || "127.0.0.1";
const TCP_PORT = parseInt(process.env.REDIS_PORT || "7379", 10);
const TIMEOUT  = 5000; // ms

// ─── RESP encoder ─────────────────────────────────────────────────────────────

/**
 * Encodes an array of string arguments into a RESP array bulk string.
 * e.g. ["SET", "key", "val"]  →  "*3\r\n$3\r\nSET\r\n$3\r\nkey\r\n$3\r\nval\r\n"
 */
function encodeCommand(...args) {
    let cmd = `*${args.length}\r\n`;
    for (const arg of args) {
        const str = String(arg);
        cmd += `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
    }
    return cmd;
}

// ─── RESP parser ──────────────────────────────────────────────────────────────

/**
 * Parses a raw RESP buffer.
 *
 * Returns:
 *   { type: "simple",  value: string }
 *   { type: "error",   value: string }
 *   { type: "integer", value: number }
 *   { type: "bulk",    value: string | null }
 *   { type: "array",   value: Array<string|null> }
 */
function parseResp(raw) {
    const text  = raw.toString("utf8");
    const lines = text.split("\r\n");
    return parseValue(lines, { pos: 0 });
}

function parseValue(lines, state) {
    const line = lines[state.pos++];
    if (!line && line !== "") return { type: "null", value: null };

    const prefix = line[0];
    const rest   = line.slice(1);

    switch (prefix) {
        case "+":
            return { type: "simple", value: rest };

        case "-":
            return { type: "error", value: rest };

        case ":":
            return { type: "integer", value: parseInt(rest, 10) };

        case "$": {
            const len = parseInt(rest, 10);
            if (len === -1) return { type: "bulk", value: null };
            const value = lines[state.pos++];
            return { type: "bulk", value };
        }

        case "*": {
            const count = parseInt(rest, 10);
            if (count === -1) return { type: "array", value: null };
            const items = [];
            for (let i = 0; i < count; i++) {
                const item = parseValue(lines, state);
                items.push(item.value);
            }
            return { type: "array", value: items };
        }

        default:
            return { type: "raw", value: line };
    }
}

// ─── Main sendCommand ─────────────────────────────────────────────────────────

/**
 * Opens a TCP socket, sends a RESP-encoded command, collects the response,
 * parses it, and resolves the promise.
 *
 * @param {...string} args - Command and arguments, e.g. ("SET", "key", "val")
 * @returns {Promise<{ type: string, value: any }>}
 */
function sendCommand(...args) {
    return new Promise((resolve, reject) => {
        const socket  = new net.Socket();
        const chunks  = [];
        let   settled = false;

        const settle = (fn, val) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            fn(val);
        };

        const timer = setTimeout(() => {
            settle(reject, new Error(`TCP timeout after ${TIMEOUT}ms`));
        }, TIMEOUT);

        socket.connect(TCP_PORT, TCP_HOST, () => {
            socket.write(encodeCommand(...args));
        });

        socket.on("data", (chunk) => {
            chunks.push(chunk);

            // A simple heuristic: try to parse once we have data ending with \r\n
            // For array responses we collect until we have all expected \r\n pairs
            const raw  = Buffer.concat(chunks);
            const text = raw.toString("utf8");

            try {
                const parsed = parseResp(raw);

                // For arrays, verify we got all items (count \r\n occurrences)
                if (parsed.type === "array" && parsed.value !== null) {
                    const expectedCount = parseInt(text.slice(1, text.indexOf("\r\n")), 10);
                    // Each item is "$len\r\nvalue\r\n" = 2 \r\n per item + header
                    const crlfCount = (text.match(/\r\n/g) || []).length;
                    if (crlfCount < 1 + expectedCount * 2) return; // wait for more
                }

                clearTimeout(timer);
                settle(resolve, parsed);
            } catch (_) {
                // Not enough data yet, keep collecting
            }
        });

        socket.on("end",   ()    => { clearTimeout(timer); settle(resolve, parseResp(Buffer.concat(chunks))); });
        socket.on("error", (err) => { clearTimeout(timer); settle(reject, err); });
    });
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/** Returns the string value from a bulk/simple response, or null. */
function extractString(parsed) {
    if (!parsed) return null;
    if (parsed.type === "error") throw new Error(parsed.value);
    return parsed.value ?? null;
}

/** Returns the integer value from an integer response. */
function extractInteger(parsed) {
    if (!parsed) return null;
    if (parsed.type === "error") throw new Error(parsed.value);
    return typeof parsed.value === "number" ? parsed.value : parseInt(parsed.value, 10);
}

/** Returns the array value, or empty array. */
function extractArray(parsed) {
    if (!parsed) return [];
    if (parsed.type === "error") throw new Error(parsed.value);
    return parsed.value || [];
}

module.exports = { sendCommand, extractString, extractInteger, extractArray };
