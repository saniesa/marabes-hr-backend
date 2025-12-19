const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
// 1. Import your middleware
const { authMiddleware, adminOnly } = require("../middleware/auth"); 

// 2. PROTECT EVERYTHING: Every route below this line now requires a login
router.use(authMiddleware);

// Now define the routes
router.get("/", userController.getAll); // Logged in users can see the list

// 3. ADMIN ONLY: Only Admins can create, update, or delete
router.post("/", adminOnly, userController.create); 
router.put("/:id", adminOnly, userController.update);
router.delete("/:id", adminOnly, userController.deleteUser);

module.exports = router;