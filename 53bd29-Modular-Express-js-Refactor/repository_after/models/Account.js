const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
    "verified": Boolean,
    "fullname": String,
    "username": String,
    "password": String,
    "profilepic": String,
    "posts": Number,
    "followers": Array,
    "following": Array,
    "phone": String,
    "email": String,
    "bio": String,
    "communities": Array,
});

const accountModel = mongoose.model("accounts", accountSchema);

module.exports = accountModel;
