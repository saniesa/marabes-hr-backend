const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");

router.get("/:userId", notificationsController.getByUser);
router.post("/", notificationsController.create);
router.put("/:id/read", notificationsController.markRead);

module.exports = router;