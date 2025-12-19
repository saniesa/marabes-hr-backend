const pool = require("../config/db");

exports.getByUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE userId=? OR userId IS NULL ORDER BY createdAt DESC LIMIT 20",
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const [result] = await pool.query(
      "INSERT INTO notifications (userId, message, type, isRead, createdAt) VALUES (?, ?, ?, 0, NOW())",
      [userId, message, type || 'info']
    );
    res.json({ id: result.insertId, userId, message, type });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET isRead=1 WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).json({ error: err.message });
  }
};
//Delete function
exports.deleteNotification = async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteAllByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query("DELETE FROM notifications WHERE userId = ?", [userId]);
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};