const notificationModel = require("../models/Notification");
const postsModel = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const getNotificationsRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome to the Notifications route");
});

const getNotifications = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"];
    let results = await notificationModel.find({"destination": username});
    res.status(200).send(results);
});

const readNotifications = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let notificationID = reqBody["notificationID"];
    await notificationModel.updateOne({"_id": notificationID},{"isRead": true});
    res.status(200).send("Notification Read");
});

const readAllNotifications = asyncHandler(async (req, res) => {
    let username = req.username;
    await notificationModel.updateMany({"destination": username},{"isRead": true});
    res.status(200).send("All Notification Read");
});

const unreadAllNotifications = asyncHandler(async (req, res) => {
    let username = req.username;
    await notificationModel.updateMany({"destination": username},{"isRead": false});
    res.status(200).send("All Notification Read");
});

const getNotificationContent = asyncHandler(async (req, res) => {
    let notificationID = req.params.notificationID;
    let notification = await notificationModel.findOne({"_id": notificationID});
    let notificationContent = await postsModel.findOne({"_id": notification["content"]});
    res.status(200).send(notificationContent);
});

module.exports = {
    getNotificationsRoot,
    getNotifications,
    readNotifications,
    readAllNotifications,
    unreadAllNotifications,
    getNotificationContent
};
