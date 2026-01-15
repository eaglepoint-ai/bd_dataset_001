const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");

router.get("/", postsController.getPostsRoot);
router.post("/newPost", postsController.createNewPost);
router.get("/getAllPosts", postsController.getAllPosts);
router.get("/getFeed/:username", postsController.getFeed);
router.post("/getUserPosts", postsController.getUserPosts);
router.get("/getPostComments/:postID", postsController.getPostComments);
router.post("/deletePost", postsController.deletePost);

module.exports = router;
