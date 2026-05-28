"use strict";

const express    = require("express");
const controller = require("../../controllers/listController");

const router = express.Router();

router.post("/lpush",           controller.lpush);
router.post("/rpush",           controller.rpush);
router.post("/lpop",            controller.lpop);
router.post("/rpop",            controller.rpop);
router.get("/lrange/:key",      controller.lrange);

module.exports = router;
