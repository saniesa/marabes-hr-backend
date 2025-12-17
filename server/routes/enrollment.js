const express = require("express");
const router = express.Router();
const enrollmentController = require("../controllers/enrollmentController");

router.get("/my/:userId", enrollmentController.getUserEnrollments);
router.post("/", enrollmentController.selfEnroll);
router.post("/assign", enrollmentController.adminAssign);
router.get("/admin/requests", enrollmentController.getAdminRequests);
router.put("/:id", enrollmentController.updateStatus);

module.exports = router;