const pool = require("../config/db");

// Helper: Calculate Mon-Fri workdays and the Last Day of the month
const getMonthDetails = (monthName, year) => {
  const monthMap = { 
    'january':0,'february':1,'march':2,'april':3,'may':4,'june':5,'july':6,'august':7,'september':8,'october':9,'november':10,'december':11,
    'janvier':0,'février':1,'mars':2,'avril':3,'mai':4,'juin':5,'juillet':6,'août':7,'septembre':8,'octobre':9,'novembre':10,'décembre':11
  };
  const mIndex = monthMap[monthName.toLowerCase()];
  const lastDayDate = new Date(year, mIndex + 1, 0); 
  const paymentDate = lastDayDate.toISOString().split('T')[0];

  let workDays = 0;
  const date = new Date(year, mIndex, 1);
  while (date.getMonth() === mIndex) {
    if (date.getDay() !== 0 && date.getDay() !== 6) workDays++;
    date.setDate(date.getDate() + 1);
  }
  return { standardHours: workDays * 8, paymentDate };
};

exports.generateMonthlyPayroll = async (req, res) => {
  const { month, year } = req.body;
  try {
    const { standardHours, paymentDate } = getMonthDetails(month, year);
    const [employees] = await pool.query("SELECT id, name, baseSalary FROM users WHERE role = 'EMPLOYEE'");

    for (const emp of employees) {
      // Calculate hours: 8h shift including break (ClockIn to ClockOut)
      const [attendance] = await pool.query(
        `SELECT SUM(TIMESTAMPDIFF(MINUTE, clockInTime, clockOutTime) / 60) as totalHours 
         FROM attendance WHERE userId = ? AND MONTHNAME(date) = ? AND YEAR(date) = ?`,
        [emp.id, month, year]
      );

      const actualHrs = attendance[0].totalHours || 0;
      const hourlyRate = (emp.baseSalary || 0) / standardHours;
      const earnedBase = actualHrs * hourlyRate;

      // 5% Performance Bonus if score > 80
      const [scores] = await pool.query(
        "SELECT AVG(score) as avgScore FROM scores WHERE userId = ? AND MONTHNAME(date) = ?",
        [emp.id, month]
      );
      let bonuses = (scores[0]?.avgScore > 80) ? (emp.baseSalary * 0.05) : 0;
      const netSalary = earnedBase + bonuses;

      await pool.query(
        `INSERT INTO payroll (userId, month, year, baseSalary, totalHours, bonuses, deductions, netSalary, status, paymentDate)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'PENDING', ?)
         ON DUPLICATE KEY UPDATE 
            totalHours=VALUES(totalHours), 
            netSalary=VALUES(netSalary), 
            baseSalary=VALUES(baseSalary),
            paymentDate=VALUES(paymentDate)`,
        [emp.id, month, year, emp.baseSalary, actualHrs, bonuses, netSalary, paymentDate]
      );
    }
    res.json({ success: true, message: `Payroll generated for ${paymentDate}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// NEW: This allows you to modify the record from the dashboard
exports.updatePayrollRecord = async (req, res) => {
  const { id } = req.params;
  const { bonuses, deductions, netSalary, status } = req.body;
  try {
    await pool.query(
      `UPDATE payroll SET bonuses=?, deductions=?, netSalary=?, status=? WHERE id=?`,
      [bonuses, deductions, netSalary, status, id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPayrollHistory = async (req, res) => {
  try {
    const { id, role } = req.user; // Get from Auth Middleware
    let query = `SELECT p.*, u.name, u.department FROM payroll p JOIN users u ON p.userId = u.id`;
    let params = [];
    
    // Privacy: Employees only see themselves
    if (role !== 'ADMIN') { 
        query += ` WHERE p.userId = ?`; 
        params.push(id); 
    }
    
    const [rows] = await pool.query(query + ` ORDER BY p.year DESC, p.month DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};