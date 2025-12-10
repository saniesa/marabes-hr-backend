const express = require("express");
const router = express.Router();
const pool = require("../db");

// Today
router.get("/:userId/today", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM attendance WHERE userId=? AND date=CURDATE()",
    [req.params.userId]
  );
  res.json(rows[0] || null);
});

// Last 30 days
router.get("/:userId/history", async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM attendance WHERE userId=? ORDER BY date DESC LIMIT 30",
    [req.params.userId]
  );
  res.json(rows);
});

// Clock In
router.post("/:userId/clockin", async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO attendance (userId, date, clockInTime, status) VALUES (?, CURDATE(), NOW(), "CLOCKED_IN")',
    [req.params.userId]
  );
  const [newRecord] = await pool.query("SELECT * FROM attendance WHERE id=?", [result.insertId]);
  res.json(newRecord[0]);
});

// Clock Out
router.post("/:userId/clockout", async (req, res) => {
  await pool.query(
    'UPDATE attendance SET clockOutTime=NOW(), status="CLOCKED_OUT" WHERE userId=? AND date=CURDATE()',
    [req.params.userId]
  );
  const [updated] = await pool.query(
    "SELECT * FROM attendance WHERE userId=? AND date=CURDATE()",
    [req.params.userId]
  );
  res.json(updated[0]);
});

module.exports = router;
