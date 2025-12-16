const express = require("express");
const router = express.Router();
const pool = require("../db");

// 1. HELPER FUNCTION: Save an activity log
// We export this so other routes (Auth, Courses) can use it!
const logActivity = async (req, action, details) => {
  try {
    // Try to get user info from request body or defaults
    const userId = req.body.userId || (req.user ? req.user.id : null);
    const userName = req.body.userName || (req.user ? req.user.name : "System");
    
    // Get IP Address
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    await pool.query(
      "INSERT INTO activity_logs (userId, userName, action, details, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?, NOW())",
      [userId, userName, action, details, ipAddress]
    );
    console.log(`📝 Logged: ${action} - ${details}`);
  } catch (err) {
    console.error("Failed to log activity:", err.message);
  }
};

// 2. ROUTE: GET ALL LOGS (For the Frontend Page)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 100");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// Export the helper function to be used elsewhere
module.exports.logActivity = logActivity;