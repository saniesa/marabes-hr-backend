const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

// Admin generates payroll for everyone
router.post("/generate", payrollController.generateMonthlyPayroll);

// Get the history for the Reports page
router.get("/history", payrollController.getPayrollHistory);

module.exports = router;