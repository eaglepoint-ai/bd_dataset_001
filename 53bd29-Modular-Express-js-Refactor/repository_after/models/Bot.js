const mongoose = require("mongoose");

const botsSchema = new mongoose.Schema({
    botName: String,
    sourceOfContent: String,
});

const botsModel = mongoose.model("bots", botsSchema);

module.exports = botsModel;
