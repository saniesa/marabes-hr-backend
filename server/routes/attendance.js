const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.get("/:userId/today", attendanceController.getToday);
router.get("/:userId/history", attendanceController.getHistory);
router.post("/:userId/clockin", attendanceController.clockIn);
router.post("/:userId/clockout", attendanceController.clockOut);

module.exports = router;