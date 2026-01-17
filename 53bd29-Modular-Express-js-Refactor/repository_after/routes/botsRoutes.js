const express = require("express");
const router = express.Router();
const botsController = require("../controllers/botsController");

router.get("/", botsController.getBotsRoot);
router.get("/allBotsPost", botsController.allBotsPost);

module.exports = router;
