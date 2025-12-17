const pool = require("../config/db");

// Helper Function exported for other controllers
exports.logActivity = async (req, action, details, userId = null, userName = "System") => {
  try {
    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "127.0.0.1";

    await pool.query(
      `INSERT INTO activity_logs 
       (userId, userName, action, details, ipAddress, timestamp)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, userName, action, details, ipAddress]
    );

    console.log(`📝 Activity logged: ${action}`);
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

exports.getLogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};