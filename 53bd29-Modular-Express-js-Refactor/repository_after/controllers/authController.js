const accountModel = require("../models/Account");
const config = require("../config/environment");
const asyncHandler = require("../middleware/asyncHandler");

const getAuthRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome to the authentication route");
});

const signup = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"];
    let emailDomain = config.emailDomain;
    let result = await accountModel.findOne({"username": username});
    if(result == null) {
        let newAccount = {
            "verified": false,
            "fullname": reqBody["fullname"],
            "username": reqBody["username"],
            "password": reqBody["password"],        
            "profilepic": "https://i.pinimg.com/564x/e0/ab/3a/e0ab3a820b9e6cb0553605314cf02717.jpg",
            "posts": 0,
            "followers": [],
            "following": [],
            "phone": "+1234567890",
            "email": reqBody["username"] + "@" + emailDomain + ".com",
            "bio": "Build, Break and Rebuild",
            "communities": [],
        };
        let newAccountObj = await accountModel.create(newAccount);
        res.status(200).send(newAccountObj);
    } else {
        res.status(200).send("Username already exists");
    }
});

const signupAnonymous = asyncHandler(async (req, res) => {
    let names = [];
    let usernames = [];

    let reqBody = req.body;
    let username = reqBody["username"];
    let emailDomain = config.emailDomain;
    let result = await accountModel.findOne({}, {username});
    if(result == null) {
        let newAccount = {
            "verified": false,
            "fullname": reqBody["fullname"],
            "username": reqBody["username"],
            "password": reqBody["password"],        
            "profilepic": "https://i.pinimg.com/564x/e0/ab/3a/e0ab3a820b9e6cb0553605314cf02717.jpg",
            "posts": 0,
            "followers": [],
            "following": [],
            "phone": "+1234567890",
            "email": reqBody["username"] + "@" + emailDomain + ".com",
            "bio": "Build, Break and Rebuild",
            "communities": [],
        };
        let newAccountObj = await accountModel.create(newAccount);
        res.status(200).send(newAccountObj);
    } else {
        res.status(200).send("Username already exists");
    }
});

const login = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"];
    let password = reqBody["password"];

    let result = await accountModel.findOne({"username": username});
    if(result != null){
        if (result["password"] == password){
            res.status(200).send(result);
        } else {
            res.status(200).send("Wrong Account Password");
        }
    } else {
        res.status(200).send("Username Not Found");
    }
});

module.exports = {
    getAuthRoot,
    signup,
    signupAnonymous,
    login
};
