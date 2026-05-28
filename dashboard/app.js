"use strict";

const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");

const apiKv      = require("./routes/api/kv");
const apiList    = require("./routes/api/list");
const apiConsole = require("./routes/api/console");
const apiKeys    = require("./routes/api/keys");
const pages      = require("./routes/pages");

const app  = express();
const PORT = 4000;

// ── View engine ──────────────────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Default locals so EJS partials never throw "X is not defined"
app.use((req, res, next) => {
    res.locals.page  = "";
    res.locals.title = "RedisKit";
    next();
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/kv",      apiKv);
app.use("/api/list",    apiList);
app.use("/api/console", apiConsole);
app.use("/api/keys",    apiKeys);

// ── Page routes ───────────────────────────────────────────────────────────────
app.use("/", pages);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render("404", { title: "Page Not Found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error("[ERROR]", err);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`\n  ┌─────────────────────────────────────────────┐`);
    console.log(`  │  Redis Dashboard  →  http://localhost:${PORT}  │`);
    console.log(`  │  TCP Redis Clone  →  localhost:7379         │ `);
    console.log(`  └─────────────────────────────────────────────┘\n`);
});
