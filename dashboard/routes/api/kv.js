"use strict";

const express    = require("express");
const controller = require("../../controllers/kvController");

const router = express.Router();

router.post("/set",          controller.setKey);
router.get("/get/:key",      controller.getKey);
router.delete("/del/:key",   controller.delKey);
router.get("/exists/:key",   controller.existsKey);
router.get("/ttl/:key",      controller.ttlKey);
router.post("/flushall",     controller.flushAll);

module.exports = router;
