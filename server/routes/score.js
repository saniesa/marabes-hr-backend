const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/scoreController");

router.get("/", scoreController.getAll);
router.get("/user/:userId", scoreController.getByUser);
router.post("/", scoreController.create);
router.get("/global-trend", scoreController.getGlobalTrend);

module.exports = router;