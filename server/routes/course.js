const express = require("express");
const router = express.Router();
const pool = require("../db");

// 1. GET ALL COURSES
router.get("/", async (req, res) => {
  try {
    // We try to count real enrollments dynamically
    // If enrollments table doesn't exist, this might fail, so we fallback to the column
    const query = `
      SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) as realEnrolledCount 
      FROM courses c
      ORDER BY c.createdAt DESC
    `;
    
    const [rows] = await pool.query(query);
    
    // Normalize data: use dynamic count if available, otherwise use the column
    const courses = rows.map(r => ({
        ...r,
        enrolledCount: r.realEnrolledCount || r.enrolledCount || 0
    }));

    res.json(courses);
  } catch (err) {
    // Fallback: If enrollments table is missing, just select raw table
    try {
        const [fallbackRows] = await pool.query("SELECT * FROM courses ORDER BY createdAt DESC");
        res.json(fallbackRows);
    } catch (fallbackErr) {
        console.error("GET COURSES ERROR:", fallbackErr.message);
        res.status(500).json({ error: fallbackErr.message });
    }
  }
});

// 2. ADD COURSE (Fixed for your table structure)
router.post("/", async (req, res) => {
  try {
    const { title, description, imageUrl, duration, instructor } = req.body;
    
    console.log("📝 Adding Course:", req.body);

    const [result] = await pool.query(
      `INSERT INTO courses 
      (title, description, imageUrl, duration, instructor, enrolledCount, createdAt) 
       VALUES (?, ?, ?, ?, ?, 0, NOW())`, // <--- Added '0' for enrolledCount
      [
        title, 
        description, 
        imageUrl, 
        duration || '2h 30m', 
        instructor || 'Marabes Expert'
      ]
    );

    res.json({ id: result.insertId, ...req.body, enrolledCount: 0 });
  } catch (err) {
    console.error("ADD COURSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE COURSE
router.delete("/:id", async (req, res) => {
  try {
  
    try {
        await pool.query("DELETE FROM enrollments WHERE courseId = ?", [req.params.id]);
    } catch (e) {
       
    }
    
    await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(" DELETE COURSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;