const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

router.get("/", authMiddleware, activityController.getAll);
//Added Delete Route
router.delete("/:id", authMiddleware, adminOnly, activityController.deleteActivity);

module.exports = router;