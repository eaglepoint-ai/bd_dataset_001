const mongoose = require("mongoose");

const privateChatsScheme = mongoose.Schema({
    from: String,
    to: String,
    forwardedFrom: String,
    content: String,
    media: String,
    reactions: Array,
    seen: Array,
    dateTime: Number
});

const privateChatsModel = mongoose.model("privateChats", privateChatsScheme);

module.exports = privateChatsModel;
