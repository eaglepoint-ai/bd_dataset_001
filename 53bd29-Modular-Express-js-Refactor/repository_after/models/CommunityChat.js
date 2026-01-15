const mongoose = require("mongoose");

const communityChatsScheme = mongoose.Schema({
    from: String,
    community: String,
    forwardedFrom: String,
    content: String,
    media: String,
    reactions: Array,
    seen: Array,
    dateTime: Number
});

const communityChatsModel = mongoose.model("communityChats", communityChatsScheme);

module.exports = communityChatsModel;
