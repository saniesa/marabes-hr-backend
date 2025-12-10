const express = require("express");
const router = express.Router();
const pool = require("../db");

const createNotification = async (userId, message, type = "info") => {
  await pool.query(
    `INSERT INTO notifications (userId,message,type,isRead,createdAt)
     VALUES (?, ?, ?, 0, NOW())`,
    [userId, message, type]
  );
};

// List or filter time off
router.get("/", async (req, res) => {
  const { userId, status } = req.query;
  let query = "SELECT * FROM time_off_requests";
  const params = [];

  if (userId || status) {
    query += " WHERE";
    if (userId) { query += " userId=?"; params.push(userId); }
    if (status) { query += userId ? " AND status=?" : " status=?"; params.push(status); }
  }

  query += " ORDER BY startDate DESC";
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

// Add request
router.post("/", async (req, res) => {
  const { userId, userName, type, startDate, endDate, reason } = req.body;
  const [result] = await pool.query(
    `INSERT INTO time_off_requests (userId,userName,type,startDate,endDate,reason,status)
     VALUES (?, ?, ?, ?, ?, ?, "PENDING")`,
    [userId, userName, type, startDate, endDate, reason]
  );
  res.json({ id: result.insertId, ...req.body, status: "PENDING" });
});

// Update status
router.put("/:id", async (req, res) => {
  const { status, note } = req.body;
  await pool.query("UPDATE time_off_requests SET status=?, adminNote=? WHERE id=?", [status, note, req.params.id]);

  const [requests] = await pool.query("SELECT userId, userName FROM time_off_requests WHERE id=?", [req.params.id]);
  if (requests.length > 0) {
    const request = requests[0];
    await createNotification(
      request.userId,
      `Your time-off request has been ${status.toLowerCase()}`,
      status === "APPROVED" ? "success" : "error"
    );
  }

  res.json({ success: true });
});

// Delete request
router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM time_off_requests WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// Stats for user
router.get("/stats/:userId", async (req, res) => {
  const [total] = await pool.query(
    `SELECT COUNT(*) as total, SUM(DATEDIFF(endDate, startDate) + 1) as daysTaken 
     FROM time_off_requests WHERE userId=? AND status="APPROVED"`,
    [req.params.userId]
  );
  res.json({ total: total[0].total || 0, daysTaken: total[0].daysTaken || 0 });
});

module.exports = router;
