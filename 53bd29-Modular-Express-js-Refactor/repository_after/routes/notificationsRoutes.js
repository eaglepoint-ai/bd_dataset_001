const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");

router.get("/", notificationsController.getNotificationsRoot);
router.post("/getNotifications", notificationsController.getNotifications);
router.post("/readNotifications", notificationsController.readNotifications);
router.get("/readAllNotifications/:username", notificationsController.readAllNotifications);
router.get("/unreadAllNotifications/:username", notificationsController.unreadAllNotifications);
router.get("/getNotificationContent/:notificationID", notificationsController.getNotificationContent);

module.exports = router;
