const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/api/check-bookings", verifyToken, bookingController.checkBookings);
router.post("/api/book/equipment", verifyToken, bookingController.bookEquipment);
router.post("/api/book/trainer", verifyToken, bookingController.bookTrainer);
router.post("/api/book/delete", verifyToken, bookingController.deleteBooking);
router.get("/api/my-schedule/:id", verifyToken, bookingController.getMySchedule);

module.exports = router;