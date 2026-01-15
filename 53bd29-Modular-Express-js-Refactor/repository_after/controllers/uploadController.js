const postsModel = require("../models/Post");
const accountModel = require("../models/Account");
const asyncHandler = require("../middleware/asyncHandler");

const getUploadRoot = asyncHandler(async (req, res) => {
    res.status(200).send("Welcome to Upload Route");
});

const uploadImages = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let newPost = {
        "fullname": reqBody["fullname"],
        "username": reqBody["username"],
        "content": reqBody["content"],
        "image": req.imageName,
        "likes": 1,
        "commentCount": 0,
        "reposts": 0, 
        "likers": [
            reqBody["username"], 
        ],
        "comments": [],
        "reposters": [],
        "tags": reqBody["tags"] == null ? [] : reqBody["tags"],
        "reports": [],
        "hidden": reqBody["hidden"] == true ? true : false,
        "spoiler": reqBody["spoiler"] == true ? true : false,
        "nsfw": reqBody["nsfw"] == true ? true : false,
        "gore": reqBody["gore"] == true ? true : false,
        "time": Date.now(),
    }

    await postsModel.create(newPost);
    await accountModel.updateOne({"username": reqBody["username"]},{$inc: {"posts": 1}});
    res.status(200).send("New Post has been published!");
});

const uploadVideos = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let newPost = {
        "fullname": reqBody["fullname"],
        "username": reqBody["username"],
        "content": reqBody["content"],
        "image": "",
        "video": req.imageName,
        "likes": 1,
        "comments": 0,
        "reposts": 0, 
        "likers": [
            reqBody["username"],
        ],
        "commenters": [],
        "reposters": [],
        "tags": reqBody["tags"] == null ? [] : reqBody["tags"],
        "reports": [],
        "hidden": reqBody["hidden"] == true ? true : false,
        "spoiler": reqBody["spoiler"] == true ? true : false,
        "nsfw": reqBody["nsfw"] == true ? true : false,
        "gore": reqBody["gore"] == true ? true : false,
        "time": Date.now(),
    }

    await postsModel.create(newPost);
    await accountModel.updateOne({"username": reqBody["username"]},{$inc: {"posts": 1}});
    res.status(200).send("New Post has been published!");
});

module.exports = {
    getUploadRoot,
    uploadImages,
    uploadVideos
};
