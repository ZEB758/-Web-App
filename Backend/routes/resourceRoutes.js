const express = require("express");
const router = express.Router();
const resourceController = require("../controllers/resourceController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/api/equipment", verifyToken, resourceController.getEquipment);
router.get("/api/trainers", verifyToken, resourceController.getTrainers);

module.exports = router;