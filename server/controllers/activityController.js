const pool = require("../config/db");

exports.logActivity = async (req, action, details) => {
  try {
    const userId = req.user ? req.user.id : null;
    let userName = "System";

    if (userId) {
      const [userRows] = await pool.query("SELECT name FROM users WHERE id = ?", [userId]);
      if (userRows.length > 0) {
        userName = userRows[0].name;
      }
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || "::1";

    await pool.query(
      "INSERT INTO activity_logs (userId, userName, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      [userId, userName, action, details, ipAddress]
    );

    console.log(`[LOG]: ${userName} performed ${action}`);
  } catch (err) {
    console.error("Error saving activity log:", err.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM activity_logs ORDER BY timestamp DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    await pool.query("DELETE FROM activity_logs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};