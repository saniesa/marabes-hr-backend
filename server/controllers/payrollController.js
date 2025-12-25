const pool = require("../config/db");
const { logActivity } = require("./activityController");

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
       const [settingsRows] = await pool.query("SELECT * FROM system_settings");
      const config = settingsRows.reduce((acc, cur) => ({ ...acc, [cur.setting_key]: cur.setting_value }), {});
      const stdHoursPerDay = Number(config.standard_hours) || 8; // Fallback to 8 if not found
    // ==============================================

    // Pass stdHoursPerDay to the helper
      const { standardHours, paymentDate } = getMonthDetails(month, year, stdHoursPerDay);
    
      const [employees] = await pool.query("SELECT id, name, baseSalary FROM users WHERE role = 'EMPLOYEE'");
   
      for (const emp of employees) {
      // Use both Month Name and Month Number to be safe
      const [attendance] = await pool.query(
        `SELECT SUM(TIMESTAMPDIFF(MINUTE, clockInTime, clockOutTime) / 60) as totalHours 
         FROM attendance 
         WHERE userId = ? AND (MONTHNAME(date) = ? OR MONTH(date) = (SELECT MONTH(STR_TO_DATE(?, '%M')))) AND YEAR(date) = ?`,
        [emp.id, month, month, year]
      );

      const actualHrs = attendance[0].totalHours || 0;
      const contractSalary = parseFloat(emp.baseSalary) || 0;
      const hourlyRate = contractSalary / standardHours;
      const earnedBase = actualHrs * hourlyRate;

      // Default calculation: (Hours / Standard) * Base. 
      // If Hours is 0, this will be 0, but you can edit it manually in the UI.
      const netSalary = earnedBase; 

      await pool.query(
        `INSERT INTO payroll (userId, month, year, baseSalary, totalHours, bonuses, deductions, netSalary, status, paymentDate)
         VALUES (?, ?, ?, ?, ?, 0, 0, ?, 'PENDING', ?)
         ON DUPLICATE KEY UPDATE 
            totalHours=VALUES(totalHours), 
            netSalary=VALUES(netSalary), 
            baseSalary=VALUES(baseSalary),
            paymentDate=VALUES(paymentDate)`,
        [emp.id, month, year, contractSalary, actualHrs, netSalary, paymentDate]
      );
    }

       await logActivity(req, "PAYROLL_GEN", `Processed monthly payroll for ${month} ${year} using ${stdHoursPerDay}h rule`);
    res.json({ success: true, message: "Payroll generated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updatePayrollRecord = async (req, res) => {
  const { id } = req.params;
  const { bonuses, deductions, netSalary, status } = req.body;
  try {
    const [data] = await pool.query("SELECT u.name FROM payroll p JOIN users u ON p.userId = u.id WHERE p.id = ?", [id]);
    const empName = data[0] ? data[0].name : "Unknown";

    await pool.query(
      `UPDATE payroll SET bonuses=?, deductions=?, netSalary=?, status=? WHERE id=?`,
      [bonuses, deductions, netSalary, status, id]
    );

    await logActivity(req, "PAYROLL_MOD", `Manually adjusted payout for ${empName}: Net Salary set to $${netSalary}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPayrollHistory = async (req, res) => {
  try {
    const { id, role } = req.user;
    let query = `SELECT p.*, u.name, u.department FROM payroll p JOIN users u ON p.userId = u.id`;
    let params = [];
    if (role !== 'ADMIN') { query += ` WHERE p.userId = ?`; params.push(id); }
    const [rows] = await pool.query(query + ` ORDER BY p.year DESC, p.month DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};