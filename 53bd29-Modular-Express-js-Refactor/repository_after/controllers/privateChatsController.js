const privateChatsModel = require("../models/PrivateChat");
const accountModel = require("../models/Account");
const asyncHandler = require("../middleware/asyncHandler");

const getPrivateChatsRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome to private chats route");
});

const sendPrivateMessage = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let from = reqBody["from"].toString().toLowerCase();
    let to = reqBody["to"].toString().toLowerCase();
    let forwardedFrom = reqBody["forwardedFrom"].toString().toLowerCase();
    let content = reqBody["content"];

    let newPrivateChat = {
        "from": from,
        "to": to,
        "forwardedFrom": forwardedFrom,
        "content": content,
        "media": "",
        "reactions": [],
        "seen": [from],
        "dateTime": Date.now(),
    };

    await privateChatsModel.create(newPrivateChat);
    res.status(200).send("Sent Message");
});

const getPrivateChat = asyncHandler(async (req, res) => {
    let from = req.params.from.toString().toLowerCase();
    let to = req.params.to.toString().toLowerCase();
    
    let chats = await privateChatsModel.find({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]});

    // Set the seen value
    await privateChatsModel.updateMany({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]}, {$push: {seen: from}});

    res.status(200).send(chats);
});

const clearPrivateChat = asyncHandler(async (req, res) => {
    let from = req.params.from.toString().toLowerCase();
    let to = req.params.to.toString().toLowerCase();
    
    await privateChatsModel.deleteMany({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]});

    res.status(200).send("Chat Cleared");
});

const getChats = asyncHandler(async (req, res) => {
    let username = req.params.username;
    let allMessages = await privateChatsModel.find({$or: [{"from": username}, {"to": username}]});
    let chats = [];
    for(var eachMessage of allMessages) {
        if (chats.includes(eachMessage["from"]) == false) {
            chats.push(eachMessage["from"])
        }
        if (chats.includes(eachMessage["to"]) == false) {
            chats.push(eachMessage["to"])
        }
    }

    let allChatAccounts = await accountModel.find({username: {$in: chats}});
    
    res.status(200).send(allChatAccounts);
});

module.exports = {
    getPrivateChatsRoot,
    sendPrivateMessage,
    getPrivateChat,
    clearPrivateChat,
    getChats
};
