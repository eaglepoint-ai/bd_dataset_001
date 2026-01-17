const postsModel = require("../models/Post");
const accountModel = require("../models/Account");
const commentsModel = require("../models/Comment");
const asyncHandler = require("../middleware/asyncHandler");

const getPostsRoot = asyncHandler(async (req, res) => {
    res.send("Welcome to the posts route");
});

const createNewPost = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let newPost = {
        "fullname": reqBody["fullname"],
        "username": reqBody["username"],
        "content": reqBody["content"],
        "isByBot": reqBody["isByBot"] || false,
        "image": "",
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

const getAllPosts = asyncHandler(async (req, res) => {
    let allPosts = await postsModel.find({});
    res.status(200).send(allPosts);
});

const getFeed = asyncHandler(async (req, res) => {
    let username = req.params.username;
    let user = await accountModel.findOne({"username": username}, {"following": 1});
    let userFollowing = user["following"];
    userFollowing.push(username);
    let feed = await postsModel.find({"username": {$in: userFollowing}});
    res.status(200).send(feed);
});

const getUserPosts = asyncHandler(async (req, res) => {
    let username = req.body["username"];
    let allUserPosts = await postsModel.find({"username": username});
    res.status(200).send(allUserPosts);
});

const getPostComments = asyncHandler(async (req, res) => {
    let postID = req.params.postID;
    let comments = await commentsModel.find({"postID": postID});
    res.status(200).send(comments);
});

const deletePost = asyncHandler(async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"]; 
    let content = reqBody["content"]; 
    let time = reqBody["time"]; 
    await postsModel.deleteOne({"username": username, "content": content, "time": time});
    await accountModel.updateOne({"username": username}, {$inc: {"posts": -1}});
    res.status(200).send("Post Deleted");
});

module.exports = {
    getPostsRoot,
    createNewPost,
    getAllPosts,
    getFeed,
    getUserPosts,
    getPostComments,
    deletePost
};
