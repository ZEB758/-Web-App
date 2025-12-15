const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/profile/:id", userController.getProfile); // Note: Original didn't verify token on GET
router.post("/profile/update", verifyToken, userController.updateProfile);

module.exports = router;