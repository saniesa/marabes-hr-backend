const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helper: create notification
const createNotification = async (userId, message, type = "info") => {
  await pool.query(
    `INSERT INTO notifications (userId, message, type, isRead, createdAt)
     VALUES (?, ?, ?, 0, NOW())`,
    [userId, message, type]
  );
};

// ------------------------
// 1️⃣ Stats for user
// Must be BEFORE /:id routes
router.get("/stats/:userId", async (req, res) => {
  try {
    const [total] = await pool.query(
      `SELECT COUNT(*) AS total, 
              SUM(DATEDIFF(endDate, startDate) + 1) AS daysTaken
       FROM time_off_requests 
       WHERE userId=? AND status="APPROVED"`,
      [req.params.userId]
    );
    res.json({
      total: total[0].total || 0,
      daysTaken: total[0].daysTaken || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// 2️⃣ List / filter requests
router.get("/", async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// 3️⃣ Add request
router.post("/", async (req, res) => {
  try {
    const { userId, userName, type, startDate, endDate, reason } = req.body;
    const [result] = await pool.query(
      `INSERT INTO time_off_requests (userId,userName,type,startDate,endDate,reason,status)
       VALUES (?, ?, ?, ?, ?, ?, "PENDING")`,
      [userId, userName, type, startDate, endDate, reason]
    );
    res.json({ id: result.insertId, ...req.body, status: "PENDING" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// 4️⃣ Update status
router.put("/:id", async (req, res) => {
  try {
    const { status, note } = req.body;
    await pool.query(
      "UPDATE time_off_requests SET status=?, adminNote=? WHERE id=?",
      [status, note, req.params.id]
    );

    // Send notification to user
    const [requests] = await pool.query(
      "SELECT userId, userName FROM time_off_requests WHERE id=?",
      [req.params.id]
    );
    if (requests.length > 0) {
      const request = requests[0];
      await createNotification(
        request.userId,
        `Your time-off request has been ${status.toLowerCase()}`,
        status === "APPROVED" ? "success" : "error"
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// 5️⃣ Delete request
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM time_off_requests WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
