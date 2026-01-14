const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const upload = require("../config/upload");

router.get("/", uploadController.getUploadRoot);
router.post("/images", upload.single("image"), uploadController.uploadImages);
router.post("/videos", upload.single("video"), uploadController.uploadVideos);

module.exports = router;
