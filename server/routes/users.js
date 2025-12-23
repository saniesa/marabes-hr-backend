const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, adminOnly } = require("../middleware/auth"); 

// Protect everything
router.use(authMiddleware);

router.get("/", userController.getAll); 

// Use adminOnly here to match your import at the top
router.post("/", adminOnly, userController.create); 
router.put("/:id", adminOnly, userController.update);
router.delete("/:id", adminOnly, userController.deleteUser);

// FIXED LINE: Changed verifyToken -> authMiddleware and isAdmin -> adminOnly
router.put("/:id/salary", adminOnly, userController.updateBaseSalary);

module.exports = router;