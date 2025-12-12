const express = require("express");
const router = express.Router();
const pool = require("../db");

// 1. GET ALL SCORES
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT s.*, u.name as userName, c.name as categoryName 
      FROM scores s 
      LEFT JOIN users u ON s.userId = u.id 
      LEFT JOIN categories c ON s.categoryId = c.id 
      ORDER BY s.date DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching scores:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET SCORES BY USER
router.get("/user/:userId", async (req, res) => {
  try {
    const query = `
      SELECT s.*, c.name as categoryName 
      FROM scores s 
      LEFT JOIN categories c ON s.categoryId = c.id 
      WHERE s.userId = ? 
      ORDER BY s.date DESC
    `;
    const [rows] = await pool.query(query, [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ADD SCORE (FIXED)
router.post("/", async (req, res) => {
  try {
    console.log("Receiving Add Score Request:", req.body); // DEBUG LOG

    let { userId, userName, categoryId, score, date, feedback } = req.body;

    // --- CRITICAL FIX: Ensure types match database ---
    // If your DB uses INT for IDs, we parse them. If String/UUID, we keep them.
    // We check if it looks like a number first.
    const cleanUserId = isNaN(userId) ? userId : parseInt(userId);
    const cleanCategoryId = parseInt(categoryId); 
    const cleanScore = parseInt(score);

    if (!cleanUserId || !cleanCategoryId || isNaN(cleanScore)) {
      console.error("Missing Fields:", { cleanUserId, cleanCategoryId, cleanScore });
      return res.status(400).json({ error: "Missing required fields (User, Category, or Score)" });
    }

    // Insert Query
    const [result] = await pool.query(
      `INSERT INTO scores (userId, userName, categoryId, score, date, feedback) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanUserId, userName, cleanCategoryId, cleanScore, date, feedback || null]
    );

    console.log("✅ Score Added! ID:", result.insertId);

    // Notification (Optional - inside try/catch so it doesn't break the flow)
    try {
      await pool.query(
        "INSERT INTO notifications (userId, message, type, isRead, createdAt) VALUES (?, ?, ?, 0, NOW())",
        [cleanUserId, `New Evaluation Score: ${cleanScore}/100`, "info"]
      );
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(" Add Score Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Global Trend
router.get("/global-trend", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(date, "%Y-%m") AS month, ROUND(AVG(score)) AS average
      FROM scores GROUP BY month ORDER BY month ASC LIMIT 12
    `);
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;