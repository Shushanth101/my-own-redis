"use strict";

const express    = require("express");
const controller = require("../../controllers/consoleController");

const router = express.Router();

router.post("/", controller.runCommand);

module.exports = router;
