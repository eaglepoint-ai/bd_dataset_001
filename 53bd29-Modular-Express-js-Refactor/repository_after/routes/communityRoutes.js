const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");

router.get("/", communityController.getCommunityRoot);
router.get("/getMyCommunities/:username", communityController.getMyCommunities);
router.post("/createCommunity", communityController.createCommunity);
router.get("/deleteCommunity/:communityUsername/:ownerUsername", communityController.deleteCommunity);
router.get("/joinCommunity/:communityUsername/:newMemberUsername", communityController.joinCommunity);
router.get("/leaveCommunity/:communityUsername/:oldMemberUsername", communityController.leaveCommunity);
router.post("/sendCommunityChat", communityController.sendCommunityChat);
router.get("/getCommunityChat/:communityUsername", communityController.getCommunityChat);
router.get("/getCommunityMembers/:communityUsername", communityController.getCommunityMembers);
router.get("/clearCommunityChat/:communityUsername/:from", communityController.clearCommunityChat);
router.get("/clearAllCommunityChat/:communityUsername", communityController.clearAllCommunityChat);
router.post("/updateCommunityInfo", communityController.updateCommunityInfo);
router.get("/discoverCommunities", communityController.discoverCommunities);

module.exports = router;
