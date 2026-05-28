"use strict";

const express = require("express");
const router  = express.Router();

router.get("/", (req, res) => {
    res.locals.page = "dashboard";
    res.render("dashboard", { title: "Dashboard" });
});

router.get("/keys", (req, res) => {
    res.locals.page = "keys";
    res.render("keys", { title: "Key Browser" });
});

router.get("/lists", (req, res) => {
    res.locals.page = "lists";
    res.render("lists", { title: "Lists" });
});

router.get("/console", (req, res) => {
    res.locals.page = "console";
    res.render("console", { title: "Console" });
});

module.exports = router;
