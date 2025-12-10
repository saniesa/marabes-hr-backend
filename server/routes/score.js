const express = require('express');
const router = express.Router();
const pool = require('../db');
 
// Get all scores or filter by userId/categoryId
router.get('/', async (req, res) => {
  try {
    const { userId, categoryId } = req.query;
    let query = 'SELECT s.*, u.name as userName FROM scores s LEFT JOIN users u ON s.userId = u.id';
    const params = [];
    if (userId || categoryId) {
      query += ' WHERE';
      if (userId) {
        query += ' s.userId=?';
        params.push(userId);
      }
      if (categoryId) {
        query += userId ? ' AND s.categoryId=?' : ' s.categoryId=?';
        params.push(categoryId);
      }
    }
    query += ' ORDER BY s.date DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Add new score
router.post('/', async (req, res) => {
  try {
    const { userId, userName, categoryId, score, date, feedback } = req.body;
    const [result] = await pool.query(
      'INSERT INTO scores (userId, userName, categoryId, score, date, feedback) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, userName, categoryId, score, date, feedback || null]
    );
    // Create notification
    await pool.query(
      'INSERT INTO notifications (userId, message, type, isRead, createdAt) VALUES (?, ?, ?, 0, NOW())',
      [userId, `New evaluation score added: ${score}/100`, 'info']
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Get average score for a user
router.get('/average/:userId', async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT AVG(score) as average FROM scores WHERE userId=?',
      [req.params.userId]
    );
    res.json({ average: Math.round(result[0].average || 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Get category statistics
router.get('/category-stats', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, 
        COUNT(s.id) as count,
        ROUND(AVG(s.score)) as average,
        MIN(s.score) as min,
        MAX(s.score) as max
      FROM categories c
      LEFT JOIN scores s ON c.id = s.categoryId
      GROUP BY c.id, c.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Update score
router.put('/:id', async (req, res) => {
  try {
    const { score, feedback } = req.body;
    await pool.query(
      'UPDATE scores SET score=?, feedback=? WHERE id=?',
      [score, feedback, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
// Delete score
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM scores WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
module.exports = router;