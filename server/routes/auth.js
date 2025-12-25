const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
// Import middleware
const { authMiddleware } = require("../middleware/auth");

// Public routes (No login needed)
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/change-password", authController.changePassword);

// Protected route (Must be logged in to change theme)
router.patch("/theme", authMiddleware, authController.updateTheme);

module.exports = router;