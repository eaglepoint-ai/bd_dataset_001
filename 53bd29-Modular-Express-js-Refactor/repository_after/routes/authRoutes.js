const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/", authController.getAuthRoot);
router.post("/signup", authController.signup);
router.post("/signupAnonymous", authController.signupAnonymous);
router.post("/login", authController.login);

module.exports = router;
