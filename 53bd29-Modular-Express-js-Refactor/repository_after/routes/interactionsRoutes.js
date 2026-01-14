const express = require("express");
const router = express.Router();
const interactionsController = require("../controllers/interactionsController");

router.get("/", interactionsController.getInteractionsRoot);
router.post("/likeDislikePosts", interactionsController.likeDislikePosts);
router.get("/followUnfollowUser/:username/:newUsername", interactionsController.followUnfollowUser);
router.post("/commentOnPost", interactionsController.commentOnPost);
router.post("/likeUnlikeComments", interactionsController.likeUnlikeComments);
router.get("/deleteComment/:postID/:commentID", interactionsController.deleteComment);

module.exports = router;
