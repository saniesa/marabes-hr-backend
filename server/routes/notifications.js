const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const { authMiddleware } = require("../middleware/auth");

router.get("/:userId", notificationsController.getByUser);
router.post("/", notificationsController.create);
router.put("/:id/read", notificationsController.markRead);
router.delete("/:id", authMiddleware, notificationsController.deleteNotification);
router.delete("/all/:userId", authMiddleware, notificationsController.deleteAllByUser);

module.exports = router;