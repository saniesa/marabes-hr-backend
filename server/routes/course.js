const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

router.get("/", courseController.getAll);
router.post("/", courseController.create);
router.put("/:id/content", courseController.updateContent);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;