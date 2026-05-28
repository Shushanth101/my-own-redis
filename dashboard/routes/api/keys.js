"use strict";

const express    = require("express");
const controller = require("../../controllers/keysController");

const router = express.Router();

router.get("/", controller.getAllKeys);

module.exports = router;
