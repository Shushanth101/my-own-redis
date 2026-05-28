"use strict";

const { sendCommand } = require("../lib/tcpClient");

/**
 * POST /api/console
 * body: { command: "SET foo bar EX 60" }  OR  { args: ["SET","foo","bar","EX","60"] }
 *
 * Returns the raw parsed RESP response object.
 */
async function runCommand(req, res, next) {
    try {
        let args;

        if (Array.isArray(req.body.args) && req.body.args.length > 0) {
            args = req.body.args.map(String);
        } else if (typeof req.body.command === "string" && req.body.command.trim()) {
            args = tokenize(req.body.command.trim());
        } else {
            return res.status(400).json({ error: "Provide command string or args array" });
        }

        if (args.length === 0) {
            return res.status(400).json({ error: "Empty command" });
        }

        const result = await sendCommand(...args);
        res.json({ ok: result.type !== "error", ...result, args });
    } catch (err) {
        next(err);
    }
}

/**
 * Splits a command string into tokens, respecting double-quoted strings.
 * e.g.  'SET foo "hello world"'  →  ["SET", "foo", "hello world"]
 */
function tokenize(str) {
    const tokens = [];
    let current  = "";
    let inQuote  = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === '"') {
            inQuote = !inQuote;
        } else if (ch === " " && !inQuote) {
            if (current) { tokens.push(current); current = ""; }
        } else {
            current += ch;
        }
    }

    if (current) tokens.push(current);
    return tokens;
}

module.exports = { runCommand };
