let express = require("express");
let app = new express();
let mongoose = require("mongoose");
let cors = require('cors');
let path = require("path");
let multer = require("multer");

//! Mongoose Settings
mongoose.set("strictQuery", false);

//! Middleware 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//! Environment Variables
let appName = process.env.APP_NAME || "Philomena";
let portNum = process.env.PORT || 7000;
let mongoAtlastUrl = process.env.DBURL || "";

//! ========================================
//! MODELS (Mongoose Schemas)
//! ========================================

// Account Model
let accountSchema = new mongoose.Schema({
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
})
let accountModel = new mongoose.model("accounts", accountSchema);

// Posts Model
let postsScheme = new mongoose.Schema({
    fullname: String,
    username: String,
    isByBot: Boolean,
    content: String,
    image: String,
    video: String,
    likes: Number,
    commentCount: Number,
    reposts: Number,
    likers: Array,
    comments: Array,
    reposters: Array,
    tags: Array,
    reports: Array,
    hidden: Boolean,
    spoiler: Boolean,
    nsfw: Boolean,
    gore: Boolean,
    time: Number,
})
let postsModel = new mongoose.model("posts", postsScheme);

// Comments Model
let commentsScheme = new mongoose.Schema({
    fullname: String,
    username: String,
    isByBot: Boolean,
    postID: String,
    content: String,
    image: String,
    video: String,
    likeCount: Number,
    commentCount: Number,
    repostCount: Number,
    likers: Array,
    comments: Array,
    reposters: Array,
    tags: Array,
    reports: Array,
    hidden: Boolean,
    spoiler: Boolean,
    nsfw: Boolean,
    gore: Boolean,
    time: Number,
})
let commentsModel = new mongoose.model("comments", commentsScheme);

// Community Model
let communitySchema = new mongoose.Schema({
    name: String,
    username: String,
    members: Array,
    profilePic: String,
    bannerPic: String,
    bio: String,
    introduction: String,
    rules: String,
    faq: String,
    private: Boolean,
    owner: String,
    admins: Array,
})
let communityModel = new mongoose.model("communities", communitySchema);

// Community Chats Model
let communityChatsScheme = mongoose.Schema({
    from: String,
    community: String,
    forwardedFrom: String,
    content: String,
    media: String,
    reactions: Array,
    seen: Array,
    dateTime: Number
})
let communityChatsModel = new mongoose.model("communityChats", communityChatsScheme);

// Private Chats Model
let privateChatsScheme = mongoose.Schema({
    from: String,
    to: String,
    forwardedFrom: String,
    content: String,
    media: String,
    reactions: Array,
    seen: Array,
    dateTime: Number
})
let privateChatsModel = new mongoose.model("privateChats", privateChatsScheme);

// Notification Model
let notificationSchema = new mongoose.Schema({
    "source": String,
    "destination": String, 
    "message": String,
    "content": String,
    "isRead": Boolean,
    "time": Number,
});
let notificationModel = new mongoose.model("notifications", notificationSchema);

// Bots Model
let botsSchema = new mongoose.Schema({
    botName: String,
    sourceOfContent: String,
})
let botsModel = new mongoose.model("bots", botsSchema);

//! ========================================
//! FILE UPLOAD MIDDLEWARE
//! ========================================
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "../public_html/userdata/media")
    },
    filename: (req, file, cb) => {
        let imageFileName = Date.now() + path.extname(file.originalname);
        req.imageName = imageFileName;
        cb(null, imageFileName);
    }
}) 
let upload = multer({storage: storage});

//! ========================================
//! DATABASE CONNECTION
//! ========================================
async function connectToDB(){
    console.log("Connecting...");
    await mongoose.connect(mongoAtlastUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(console.log("MDBA Connected!")).catch(err => console.log("ERROR"));
    console.log("connected!");
}

//! ========================================
//! SERVER
//! ========================================
app.listen(portNum, ()=>{
    console.log(`Server listening on port ${portNum}`);
});

//! ========================================
//! ROUTES & CONTROLLERS
//! ========================================

// Root Route
app.get("/philomena/", async (req, res) => {
    res.send(`Welcome to ${appName} API dev`);
});

//! ========================================
//! AUTHENTICATION ROUTES
//! ========================================
app.get("/philomena/authentication/", (req, res) => {
    res.status(200).send("Welcome to the authentication route");
});

app.post("/philomena/authentication/signup", async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"];
    let emailDomain = process.env.APP_NAME || "philomena";
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

app.post("/philomena/authentication/signupAnonymous", async (req, res) => {
    let names = [];
    let usernames = [];

    let reqBody = req.body;
    let username = reqBody["username"];
    let emailDomain = process.env.APP_NAME || "philomena";
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

app.post("/philomena/authentication/login", async (req, res) => {
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

//! ========================================
//! POSTS ROUTES
//! ========================================
app.get("/philomena/posts/", (req, res) => {
    res.send("Welcome to the posts route");
});

app.post("/philomena/posts/newPost", async (req, res) => {
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

app.get("/philomena/posts/getAllPosts", async (req, res) => {
    let allPosts = await postsModel.find({});
    res.status(200).send(allPosts);
});

app.get("/philomena/posts/getFeed/:username", async (req, res) => {
    let username = req.params.username;
    let user = await accountModel.findOne({"username": username}, {"following": 1});
    let userFollowing = user["following"];
    userFollowing.push(username);
    let feed = await postsModel.find({"username": {$in: userFollowing}});
    res.status(200).send(feed);
});

app.post("/philomena/posts/getUserPosts", async (req, res) => {
    let username = req.body["username"];
    let allUserPosts = await postsModel.find({"username": username});
    res.status(200).send(allUserPosts);
});

app.get("/philomena/posts/getPostComments/:postID", async (req, res) => {
    let postID = req.params.postID;
    let comments = await commentsModel.find({"postID": postID});
    res.status(200).send(comments);
});

app.post("/philomena/posts/deletePost", async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"]; 
    let content = reqBody["content"]; 
    let time = reqBody["time"]; 
    await postsModel.deleteOne({"username": username, "content": content, "time": time});
    await accountModel.updateOne({"username": username}, {$inc: {"posts": -1}});
    res.status(200).send("Post Deleted");
});

//! ========================================
//! INTERACTIONS ROUTES
//! ========================================
app.get("/philomena/interactions/", async (req, res) => {
    res.send("Welcome to the interactions route");
});

app.post("/philomena/interactions/likeDislikePosts", async (req, res) => {
    let likedPostID = req.body["postID"];
    let likedBy = req.body["likedBy"];
    let currentPost = await postsModel.findOne({"_id": likedPostID});

    if(currentPost["likers"].includes(likedBy) == true){
        await postsModel.updateOne({"_id": likedPostID},{$inc: {"likes": -1}}); 
        await postsModel.updateOne({"_id": likedPostID},{$pull: {"likers": likedBy}}); 
        // Remove Notification
        let notificationObject = {
            "source": likedBy,
            "destination": currentPost["username"], 
            "message": "liked your post.",
            "content": likedPostID,
        }
        await notificationModel.deleteOne({}, {notificationObject});
    } else {
        await postsModel.updateOne({"_id": likedPostID},{$inc: {"likes": 1}}); 
        await postsModel.updateOne({"_id": likedPostID},{$push: {"likers": likedBy}}); 
        // Create Notification
        let notificationObject = {
            "source": likedBy,
            "destination": currentPost["username"], 
            "message": "liked your post.",
            "content": likedPostID,
            "isRead": false,
            "time": Date.now(),
        }
        await notificationModel.create(notificationObject);
    }

    res.status(200).send("Post had been interacted with");
});

app.get("/philomena/interactions/followUnfollowUser/:username/:newUsername", async (req, res) => {
    let username = req.params.username;
    let newUsername = req.params.newUsername;
    let allFollowing = await accountModel.findOne({"username": username});
    if (allFollowing["following"].includes(newUsername) == false) {
        await accountModel.updateOne({"username": username}, {$push: {"following": newUsername}});
        await accountModel.updateOne({"username": newUsername}, {$push: {"followers": username}});
        res.status(200).send("Followed User");
        // Create Notification
        let notificationObject = {
            "source": newUsername,
            "destination": username, 
            "message": "followed you.",
            "content": newUsername,
            "isRead": false,
            "time": Date.now(),
        }
        await notificationModel.create(notificationObject);
    } else {
        await accountModel.updateOne({"username": username}, {$pull: {"following": newUsername}});
        await accountModel.updateOne({"username": newUsername}, {$pull: {"followers": username}});    
        res.status(200).send("Unfollowed User");
        // Remove Notification
        let notificationObject = {
            "source": newUsername,
            "destination": username, 
            "message": "followed you.",
            "content": newUsername,
        }
        await notificationModel.create(notificationObject);
    }
});

app.post("/philomena/interactions/commentOnPost", async (req, res) => {
    let reqBody = req.body;
    let newComment = {
        "fullname": reqBody["fullname"],
        "username": reqBody["username"],
        "isByBot": reqBody["isByBot"] || false,
        "postID": reqBody["postID"],
        "content": reqBody["content"],
        "image": "",
        "video": "",
        "likeCount": 1,
        "commentCount": 0,
        "repostCount": 0, 
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

    let comment = await commentsModel.create(newComment);
    await postsModel.updateOne({"_id": reqBody["postID"]}, {$inc: {"commentCount": 1}, $push: {"comments": comment["_id"]}})
    res.status(200).send(comment);
});

app.post("/philomena/interactions/likeUnlikeComments", async (req, res) => {
    let likedCommentID = req.body["commentID"];
    let likedBy = req.body["likedBy"];
    let currentComment = await commentsModel.findOne({"_id": likedCommentID});

    if(currentComment["likers"].includes(likedBy) == true){
        await commentsModel.updateOne({"_id": likedCommentID},{$inc: {"likeCount": -1}, $pull: {"likers": likedBy}}); 
        // Remove Notification
        let notificationObject = {
            "source": likedBy,
            "destination": currentComment["username"], 
            "message": "liked your comment.",
            "content": likedCommentID,
        }
        await notificationModel.deleteOne({}, {notificationObject});
    } else {
        await commentsModel.updateOne({"_id": likedCommentID},{$inc: {"likeCount": 1}, $push: {"likers": likedBy}}); 
        // Create Notification
        let notificationObject = {
            "source": likedBy,
            "destination": currentComment["username"], 
            "message": "liked your comment.",
            "content": likedCommentID,
            "isRead": false,
            "time": Date.now(),
        }
        await notificationModel.create(notificationObject);
    }

    res.status(200).send("Comment has been interacted with");
});

app.get("/philomena/interactions/deleteComment/:postID/:commentID", async (req, res) => {
    let commentID = req.params.commentID;
    let postID = req.params.postID;
    await commentsModel.deleteOne({"_id": commentID});
    await postsModel.updateOne({"_id": postID}, {$inc: {"commentCount": -1}, $pull: {"comments": commentID}})
    res.status(200).send("Comment Deleted");
});

//! ========================================
//! NOTIFICATIONS ROUTES
//! ========================================
app.get("/philomena/notifications/", (req, res) => {
    res.status(200).send("Welcome to the Notifications route");
});

app.post("/philomena/notifications/getNotifications", async (req, res) => {
    let reqBody = req.body;
    let username = reqBody["username"];
    let results = await notificationModel.find({"destination": username});
    res.status(200).send(results);
});

app.post("/philomena/notifications/readNotifications", async (req, res) => {
    let reqBody = req.body;
    let notificationID = reqBody["notificationID"];
    await notificationModel.updateOne({"_id": notificationID},{"isRead": true});
    res.status(200).send("Notification Read");
});

app.get("/philomena/notifications/readAllNotifications/:username", async (req, res) => {
    let username = req.username;
    await notificationModel.updateMany({"destination": username},{"isRead": true});
    res.status(200).send("All Notification Read");
});

app.get("/philomena/notifications/unreadAllNotifications/:username", async (req, res) => {
    let username = req.username;
    await notificationModel.updateMany({"destination": username},{"isRead": false});
    res.status(200).send("All Notification Read");
});

app.get("/philomena/notifications/getNotificationContent/:notificationID", async (req, res) => {
    let notificationID = req.params.notificationID;
    let notification = await notificationModel.findOne({"_id": notificationID});
    let notificationContent = await postsModel.findOne({"_id": notification["content"]});
    res.status(200).send(notificationContent);
});

//! ========================================
//! SEARCH ROUTES
//! ========================================
app.get("/philomena/search/", (req, res) => {
    res.send("Welcome to search route");
});

app.get("/philomena/search/:searchTerm", async (req, res) => {
    let searchTerm = req.params.searchTerm;
    console.log(searchTerm);

    // Search Accounts
    let fullnameRegex = RegExp(searchTerm, 'i'); 
    let usernameRegex = RegExp('^' + searchTerm, 'i'); 
    let accountResults = await accountModel.find(
        {
            $or: [
                {"fullname": {$regex: fullnameRegex}}, 
                {"username": {$regex: usernameRegex}},
            ],
        },
    )

    // Search Posts
    let timeRegex = RegExp('^' + searchTerm, 'i'); 
    let contentRegex = RegExp(searchTerm, 'i'); 
    let postResults = await postsModel.find(
        {
            $or: [
                {"content": {$regex: contentRegex}},
            ],
        },
    )
    
    console.log(accountResults);
    console.log(postResults);
    
    // Result
    let searchResults = {
        "accountResults": accountResults,
        "postResults": postResults,
    }

    // Respond
    res.status(200).send(searchResults);
});

//! ========================================
//! PROFILE ROUTES
//! ========================================
app.get("/philomena/profile/", (req, res) => {
    res.status(200).send("Welcome Profile Route");
});

app.get("/philomena/profile/getProfile/:username", async (req, res) => {
    let username = req.params.username;
    let profile = await accountModel.findOne({"username": username});
    let posts = await postsModel.find({"username": username});
    let result = {
        "profile": profile,
        "posts": posts,
    }
    res.status(200).send(result);
});

app.get("/philomena/profile/getAllProfiles/", async (req, res) => {
    let allAccounts = await accountModel.find({});
    res.status(200).send(allAccounts);
});

app.get("/philomena/profile/getAllFollowing/:username", async (req, res) => {
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

app.get("/philomena/profile/getAllFollowers/:username", async (req, res) => {
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

//! ========================================
//! UPLOAD ROUTES
//! ========================================
app.get("/philomena/upload/", (req, res) => {
    res.status(200).send("Welcome to Upload Route");
});

app.post("/philomena/upload/images", upload.single("image"), async (req, res) => {
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

app.post("/philomena/upload/videos", upload.single("video"), async (req, res) => {
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

//! ========================================
//! PRIVATE CHATS ROUTES
//! ========================================
app.get("/philomena/privateChats/", async (req, res) => {
    res.status(200).send("Welcome to private chats route");
});

app.post("/philomena/privateChats/sendPrivateMessage", async (req, res) => {
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

app.get("/philomena/privateChats/getPrivateChat/:from/:to", async (req, res) => {
    let from = req.params.from.toString().toLowerCase();
    let to = req.params.to.toString().toLowerCase();
    
    let chats = await privateChatsModel.find({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]});

    // Set the seen value
    await privateChatsModel.updateMany({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]}, {$push: {seen: from}});

    res.status(200).send(chats);
});

app.get("/philomena/privateChats/clearPrivateChat/:from/:to", async (req, res) => {
    let from = req.params.from.toString().toLowerCase();
    let to = req.params.to.toString().toLowerCase();
    
    await privateChatsModel.deleteMany({$and: [{from: {$in: [from, to]}}, {to: {$in: [from, to]}}]});

    res.status(200).send("Chat Cleared");
});

app.get("/philomena/privateChats/getChats/:username", async (req, res) => {
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

//! ========================================
//! BOTS ROUTES
//! ========================================
app.get("/philomena/bots/", (req, res) => {
    res.status(200).send("Welcome to Bots route");
});

app.get("/philomena/bots/allBotsPost", (req, res) => {
    let bot;
    res.status(200).send("BOTS POSTED!");
});

//! ========================================
//! COMMUNITY ROUTES
//! ========================================
app.get("/philomena/community/", (req, res) => {
    res.status(200).send("Welcome to Community Route");
});

app.get("/philomena/community/getMyCommunities/:username", async (req, res) => {
    let username = req.params.username.toString().toLowerCase();
    let userAccount = await accountModel.findOne({username: username});
    let userCommunities = userAccount["communities"];
    let communities = await communityModel.find({username: {$in: userCommunities}});
    res.status(200).send(communities);
});

app.post("/philomena/community/createCommunity", async (req, res) => {
    let reqBody = req.body;
    let communityObject = {
        name: reqBody["name"],
        username: reqBody["username"].toString().toLowerCase(),
        members: [reqBody["owner"]],
        profilePic: "https://i.pinimg.com/564x/47/d8/67/47d86708f7999e03b8b2668412da1592.jpg",
        bannerPic: "https://i.pinimg.com/564x/55/76/22/5576227d98fd1f39766045e053607cf5.jpg",
        bio: reqBody["bio"] || "Awesome new community",
        introduction: reqBody["introduction"] || "Welcome to our community!",
        rules: reqBody["rules"] || "Be nice to one another!",
        faq: reqBody["faq"] || "No frequently asked questions",
        private: reqBody["private"] || false,
        owner: reqBody["owner"],
        admins: [reqBody["owner"]],
    }
    let result = await communityModel.findOne({username: reqBody["username"].toString().toLowerCase()});
    if (result == null) {
        let community = await communityModel.create(communityObject);
        await accountModel.updateOne({username: reqBody["owner"]}, {$push: {communities: reqBody["username"].toString().toLowerCase()}});
        res.status(200).send(community);
    } else {
        res.status(200).send("Community username already exists");
    }
});

app.get("/philomena/community/deleteCommunity/:communityUsername/:ownerUsername", async (req, res) => {
    let ownerUsername = req.params.ownerUsername.toString().toLowerCase();
    let communityUsername = req.params.communityUsername.toString().toLowerCase();
    let community = await communityModel.findOne({username: communityUsername});
    let communityMembers = community["members"];
    if(community["owner"].toString().toLowerCase() == ownerUsername) {
        await communityModel.deleteOne({username: communityUsername});
        await communityChatsModel.deleteMany({community: communityUsername});
        await accountModel.updateMany({username: {$in: communityMembers}}, {$pull: {communities: communityUsername}})
        res.status(200).send("Deleted Community");
    } else {
        res.status(200).send("You can't delete the community cause you are not it's owner");
    }
});

app.get("/philomena/community/joinCommunity/:communityUsername/:newMemberUsername", async (req, res) => {
    let communityUsername = req.params.communityUsername.toString().toLowerCase();
    let newMemberUsername = req.params.newMemberUsername.toString().toLowerCase();
    let community = await communityModel.findOne({username: communityUsername});
    if (community["members"].includes(newMemberUsername) == false) {
        await communityModel.updateOne({username: communityUsername}, {$push: {members: newMemberUsername}});
        await accountModel.updateOne({username: newMemberUsername}, {$push: {communities: communityUsername}})
        res.status(200).send(community);
    } else {
        res.status(200).send("You are already part of the community");
    }
});

app.get("/philomena/community/leaveCommunity/:communityUsername/:oldMemberUsername", async (req, res) => {
    let communityUsername = req.params.communityUsername.toString().toLowerCase();
    let oldMemberUsername = req.params.oldMemberUsername.toString().toLowerCase();
    let community = await communityModel.findOne({username: communityUsername});
    if (community["members"].includes(oldMemberUsername) == true) {
        await communityModel.updateOne({username: communityUsername}, {$pull: {members: oldMemberUsername}});
        await accountModel.updateOne({username: oldMemberUsername}, {$pull: {communities: communityUsername}})
            res.status(200).send(community);
    } else {
        res.status(200).send("You are not part of the community");
    }
});

app.post("/philomena/community/sendCommunityChat", async (req, res) => {
    let reqBody = req.body;
    let from = reqBody["from"].toString().toLowerCase();
    let community = reqBody["community"].toString().toLowerCase();
    let forwardedFrom = reqBody["forwardedFrom"].toString().toLowerCase();
    let content = reqBody["content"];

    let newCommunityChat = {
        "from": from,
        "community": community,
        "forwardedFrom": forwardedFrom,
        "content": content,
        "media": "",
        "reactions": [],
        "seen": [from],
        "dateTime": Date.now(),
    };

    let newChat = await communityChatsModel.create(newCommunityChat);

    res.status(200).send(newChat);
});

app.get("/philomena/community/getCommunityChat/:communityUsername", async (req, res) => {
    let community = req.params.communityUsername.toString().toLowerCase();
    let chats = await communityChatsModel.find({community: community});
    res.status(200).send(chats);
});

app.get("/philomena/community/getCommunityMembers/:communityUsername", async (req, res) => {
    let communityUsername = req.params.communityUsername;
    let community = await communityModel.findOne({username: communityUsername});
    let members = community["members"];
    let membersProfile = await accountModel.find({"username": {$in: members}});
    res.status(200).send(membersProfile);
});

app.get("/philomena/community/clearCommunityChat/:communityUsername/:from", async (req, res) => {
    let from = req.params.from.toString().toLowerCase();
    let community = req.params.communityUsername.toString().toLowerCase();
    
    await communityChatsModel.deleteMany({community: community, from: from});
    let chats = await communityChatsModel.find({community: community});

    res.status(200).send(chats);
});

app.get("/philomena/community/clearAllCommunityChat/:communityUsername", async (req, res) => {
    let community = req.params.communityUsername.toString().toLowerCase();
    await communityChatsModel.deleteMany({community: community});

    let chats = await communityChatsModel.find({community: community});
    
    res.status(200).send(chats);
});

app.post("/philomena/community/updateCommunityInfo", async (req, res) => {
    let reqBody = req.body;
    let owner = reqBody["owner"].toString().toLowerCase();
    let username = reqBody["username"];
    let bio = reqBody["bio"].toString();
    let introduction = reqBody["introduction"].toString();
    let rules = reqBody["rules"].toString();
    let faq = reqBody["faq"].toString();

    let community = await communityModel.findOne({username: username});
    if (community["owner"].toString().toLowerCase() == owner) {
        await communityModel.updateOne({username: username}, {bio: bio, introduction: introduction, rules: rules, faq: faq});
        res.status(200).send("Community info updated");
    } else {
        res.status(200).send("Community info can only be changed by the owner or the admins");
    }
});

app.get("/philomena/community/discoverCommunities", async (req, res) => {
    let discoveredCommunities = await communityModel.find({private: false});
    res.status(200).send(discoveredCommunities);
});

//! Connect to Database
connectToDB();
