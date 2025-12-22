const pool = require("../config/db");

exports.generateMonthlyPayroll = async (req, res) => {
  const { month, year } = req.body; // e.g., month="December", year=2025
  
  try {
    // 1. Get all employees and their base salaries
    const [employees] = await pool.query("SELECT id, name, baseSalary FROM users WHERE role = 'EMPLOYEE'");

    const payrollResults = [];

    for (const emp of employees) {
      // 2. Calculate Total Hours Worked from your Attendance table
      // Logic: (ClockOut - ClockIn) - (BreakEnd - BreakStart)
      const [attendance] = await pool.query(
        `SELECT SUM(
          TIMESTAMPDIFF(HOUR, clockInTime, clockOutTime) - 
          TIMESTAMPDIFF(HOUR, breakStartTime, breakEndTime)
        ) as totalHours 
        FROM attendance 
        WHERE userId = ? AND MONTHNAME(date) = ? AND YEAR(date) = ?`,
        [emp.id, month, year]
      );

      const hoursWorked = attendance[0].totalHours || 0;
      const hourlyRate = emp.baseSalary / 160; // Assuming 160h is a full month

      // 3. Deduction Logic: If they worked less than 160h
      let deductions = 0;
      if (hoursWorked < 160) {
        deductions = (160 - hoursWorked) * hourlyRate;
      }

      // 4. Bonus Logic: Check for High Performance Scores (>80)
      const [scores] = await pool.query(
        "SELECT AVG(score) as avgScore FROM scores WHERE userId = ? AND MONTHNAME(date) = ?",
        [emp.id, month]
      );
      
      let bonuses = 0;
      if (scores[0].avgScore > 80) {
        bonuses = emp.baseSalary * 0.05; // 5% Performance Bonus
      }

      const netSalary = parseFloat(emp.baseSalary) + bonuses - deductions;

      // 5. Save to Payroll Table
      await pool.query(
        `INSERT INTO payroll (userId, month, year, baseSalary, totalHours, bonuses, deductions, netSalary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [emp.id, month, year, emp.baseSalary, hoursWorked, bonuses, deductions, netSalary]
      );

      payrollResults.push({ name: emp.name, netSalary });
    }

    res.json({ message: `Payroll generated for ${month} ${year}`, results: payrollResults });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payroll calculation failed" });
  }
};

exports.getPayrollHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name, u.department 
       FROM payroll p 
       JOIN users u ON p.userId = u.id 
       ORDER BY p.year DESC, p.month DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};