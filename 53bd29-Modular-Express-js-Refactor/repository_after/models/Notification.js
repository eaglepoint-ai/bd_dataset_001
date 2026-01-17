const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    "source": String,
    "destination": String, 
    "message": String,
    "content": String,
    "isRead": Boolean,
    "time": Number,
});

const notificationModel = mongoose.model("notifications", notificationSchema);

module.exports = notificationModel;
