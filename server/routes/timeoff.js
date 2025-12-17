const express = require("express");
const router = express.Router();
const timeoffController = require("../controllers/timeoffController");

router.get("/stats/:userId", timeoffController.getStats);
router.get("/", timeoffController.list);
router.post("/", timeoffController.create);
router.put("/:id", timeoffController.updateStatus);
router.delete("/:id", timeoffController.deleteRequest);

module.exports = router;