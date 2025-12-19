const pool = require("../config/db");
const { logActivity } = require("./activityController");

exports.getAll = async (req, res) => {
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
};

exports.getByUser = async (req, res) => {
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
};

exports.create = async (req, res) => {
  try {
    let { userId, userName, categoryId, score, date, feedback } = req.body;

    const cleanUserId = isNaN(userId) ? userId : parseInt(userId);
    const cleanCategoryId = parseInt(categoryId); 
    const cleanScore = parseInt(score);

    const [result] = await pool.query(
      `INSERT INTO scores (userId, userName, categoryId, score, date, feedback) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanUserId, userName, cleanCategoryId, cleanScore, date, feedback || null]
    );

    // FETCH CATEGORY NAME FOR LOGGING
    const [cats] = await pool.query("SELECT name FROM categories WHERE id=?", [cleanCategoryId]);
    const catName = cats[0]?.name || "Metric";

    // LOG THE ACTIVITY
    await logActivity(req, "SCORE_ADDED", `Evaluated ${userName} on ${catName}: ${cleanScore}/100`);

    // NOTIFICATION
    try {
      await pool.query(
        "INSERT INTO notifications (userId, message, type, isRead, createdAt) VALUES (?, ?, ?, 0, NOW())",
        [cleanUserId, `New Evaluation Score: ${cleanScore}/100 in ${catName}`, "info"]
      );
    } catch (notifErr) {
      console.error("Notification failed:", notifErr.message);
    }

    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(" Add Score Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getGlobalTrend = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE_FORMAT(date, "%Y-%m") AS month, ROUND(AVG(score)) AS average
      FROM scores GROUP BY month ORDER BY month ASC LIMIT 12
    `);
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
};