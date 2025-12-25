const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

// Everyone logged in can view settings, but only Admin can change them
router.get("/", authMiddleware, settingsController.getSettings);
router.post("/", authMiddleware, adminOnly, settingsController.updateSettings);

module.exports = router;