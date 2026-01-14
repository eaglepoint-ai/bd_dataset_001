const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");

router.get("/", profileController.getProfileRoot);
router.get("/getProfile/:username", profileController.getProfile);
router.get("/getAllProfiles/", profileController.getAllProfiles);
router.get("/getAllFollowing/:username", profileController.getAllFollowing);
router.get("/getAllFollowers/:username", profileController.getAllFollowers);

module.exports = router;
