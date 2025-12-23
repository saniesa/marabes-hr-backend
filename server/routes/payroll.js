const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const { authMiddleware, adminOnly } = require("../middleware/auth");

// Protect all payroll routes
router.use(authMiddleware);

// Only Admins can generate payroll
router.post("/generate", adminOnly, payrollController.generateMonthlyPayroll);

// Everyone can see history, but the Controller logic we wrote 
// will filter it so Employees only see their own rows.
router.get("/history", payrollController.getPayrollHistory);

// Add the update route for the "Modify" buttons to work
router.put("/update/:id", adminOnly, payrollController.updatePayrollRecord);

module.exports = router;