const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authMiddleware, adminOnly } = require("../middleware/auth"); 

router.use(authMiddleware);

router.get("/", userController.getAll); 

router.post("/", adminOnly, userController.create); 
router.put("/:id", (req, res, next) => (req.user.role === 'ADMIN' || req.user.id == req.params.id) ? next() : res.status(403).json({ error: "Unauthorized" }), userController.update);
router.delete("/:id", adminOnly, userController.deleteUser);

router.put("/:id/salary", adminOnly, userController.updateBaseSalary);
router.put("/:id/profile", (req, res, next) => {
  if (req.user.id == req.params.id || req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: "Unauthorized" });
  }
}, userController.updateProfile);
router.get("/me", authMiddleware, userController.getMe);

module.exports = router;