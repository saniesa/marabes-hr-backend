const pool = require("../config/db");
const { logActivity } = require("./activityController");

exports.getToday = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE userId=? AND date=CURDATE()",
      [req.params.userId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM attendance WHERE userId=? ORDER BY date DESC LIMIT 30",
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// This function now handles: Morning Clock In AND Returning from Break
exports.clockIn = async (req, res) => {
  try {
    const userId = req.params.userId;
    // We attach the userId to req.user so the logActivity function can find it
    req.user = { id: userId };

    const [today] = await pool.query("SELECT * FROM attendance WHERE userId=? AND date=CURDATE()", [userId]);

    if (today.length === 0) {
      // STEP 1: Morning Clock In
      const [result] = await pool.query(
        'INSERT INTO attendance (userId, date, clockInTime, status) VALUES (?, CURDATE(), NOW(), "CLOCKED_IN")',
        [userId]
      );
      
      // LOG TO ACTIVITY DASHBOARD
      await logActivity(req, "CLOCK_IN", "User clocked in for the start of the shift.");
      
      return res.json({ id: result.insertId, status: "CLOCKED_IN" });
    } else if (today[0].status === "ON_BREAK") {
      // STEP 3: Return from Break (Manual Clock In)
      await pool.query(
        'UPDATE attendance SET breakEndTime=NOW(), status="BACK_FROM_BREAK" WHERE userId=? AND date=CURDATE()',
        [userId]
      );

      // LOG TO ACTIVITY DASHBOARD
      await logActivity(req, "BREAK_END", "User returned from their break.");
    }
    const [updated] = await pool.query("SELECT * FROM attendance WHERE userId=? AND date=CURDATE()", [userId]);
    res.json(updated[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};


// This function now handles: Going to Break AND Final Clock Out
exports.clockOut = async (req, res) => {
  try {
    const userId = req.params.userId;
    // We attach the userId to req.user so the logActivity function can find it
    req.user = { id: userId };

    const [today] = await pool.query("SELECT * FROM attendance WHERE userId=? AND date=CURDATE()", [userId]);

    if (today[0].status === "CLOCKED_IN") {
      // STEP 2: Start Break (Manual Clock Out)
      await pool.query(
        'UPDATE attendance SET breakStartTime=NOW(), status="ON_BREAK" WHERE userId=? AND date=CURDATE()',
        [userId]
      );

      // LOG TO ACTIVITY DASHBOARD
      await logActivity(req, "BREAK_START", "User went on break.");

    } else if (today[0].status === "BACK_FROM_BREAK") {
      // STEP 4: Final Clock Out
      await pool.query(
        'UPDATE attendance SET clockOutTime=NOW(), status="CLOCKED_OUT" WHERE userId=? AND date=CURDATE()',
        [userId]
      );

      // LOG TO ACTIVITY DASHBOARD
      await logActivity(req, "CLOCK_OUT", "User clocked out and finished their shift.");
    }
    const [updated] = await pool.query("SELECT * FROM attendance WHERE userId=? AND date=CURDATE()", [userId]);
    res.json(updated[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};