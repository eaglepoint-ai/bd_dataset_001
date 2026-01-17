const accountModel = require("../models/Account");
const postsModel = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const getProfileRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome Profile Route");
});

const getProfile = asyncHandler(async (req, res) => {
    let username = req.params.username;
    let profile = await accountModel.findOne({"username": username});
    let posts = await postsModel.find({"username": username});
    let result = {
        "profile": profile,
        "posts": posts,
    }
    res.status(200).send(result);
});

const getAllProfiles = asyncHandler(async (req, res) => {
    let allAccounts = await accountModel.find({});
    res.status(200).send(allAccounts);
});

const getAllFollowing = asyncHandler(async (req, res) => {
    let username = req.params.username;
    let accountExists = await accountModel.findOne({"username": username});
    if(accountExists != [] && accountExists != null){
        let allFollowingUsernames = await accountModel.find({"username": username}, {"following": 1});
        let allFollowing = await accountModel.find({"username": {$in: allFollowingUsernames[0]["following"]}});
        res.status(200).send(allFollowing);
    } else {
        res.status(200).send("Account Doesn't exist");
    }
});

const getAllFollowers = asyncHandler(async (req, res) => {
    let username = req.params.username;
    let accountExists = await accountModel.findOne({"username": username});
    if(accountExists != [] && accountExists != null){
        let allFollowersUsernames = await accountModel.find({"username": username}, {"followers": 1});
        let allFollowers = await accountModel.find({"username": {$in: allFollowersUsernames[0]["followers"]}});
        res.status(200).send(allFollowers);
    } else {
        res.status(200).send("Account Doesn't exist");
    }
});

module.exports = {
    getProfileRoot,
    getProfile,
    getAllProfiles,
    getAllFollowing,
    getAllFollowers
};
