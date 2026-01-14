const express = require("express");
const router = express.Router();
const privateChatsController = require("../controllers/privateChatsController");

router.get("/", privateChatsController.getPrivateChatsRoot);
router.post("/sendPrivateMessage", privateChatsController.sendPrivateMessage);
router.get("/getPrivateChat/:from/:to", privateChatsController.getPrivateChat);
router.get("/clearPrivateChat/:from/:to", privateChatsController.clearPrivateChat);
router.get("/getChats/:username", privateChatsController.getChats);

module.exports = router;
