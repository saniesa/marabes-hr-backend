const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helper for notifications
const createNotification = async (userId, message, type = "info") => {
  try {
    await pool.query(
      "INSERT INTO notifications (userId, message, type, isRead, createdAt) VALUES (?, ?, ?, 0, NOW())",
      [userId, message, type]
    );
  } catch (err) {
    console.error("Notification failed", err.message);
  }
};

// 1. GET USER ENROLLMENTS
router.get("/my/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT courseId, status FROM enrollments WHERE userId=?", 
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET MY ENROLLMENTS ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. REQUEST ENROLLMENT
router.post("/", async (req, res) => {
  const { userId, courseId } = req.body;
  
  try {
    const [exists] = await pool.query(
      "SELECT * FROM enrollments WHERE userId = ? AND courseId = ?", 
      [userId, courseId]
    );
    if (exists.length > 0) {
      return res.status(400).json({ msg: "Enrollment already requested or active" });
    }

    // FIX: Using 'dateEnrolled' (your original column) and CURDATE()
    await pool.query(
      "INSERT INTO enrollments (userId, courseId, dateEnrolled, status) VALUES (?, ?, CURDATE(), 'PENDING')",
      [userId, courseId]
    );

    const [courses] = await pool.query("SELECT title FROM courses WHERE id=?", [courseId]);
    if (courses.length > 0) {
      await createNotification(
        userId,
        `Enrollment requested for ${courses[0].title}. Waiting for Admin approval.`,
        "info"
      );
    }

    res.json({ success: true, status: 'PENDING' });
  } catch (err) {
    console.error("POST ENROLLMENT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. ADMIN: GET ALL REQUESTS (The Error was here)
router.get("/admin/requests", async (req, res) => {
  try {
    // FIX: Sorting by e.id DESC instead of e.enrolledAt to avoid column error
    const query = `
      SELECT e.id, e.status, u.name as userName, c.title as courseTitle 
      FROM enrollments e
      JOIN users u ON e.userId = u.id
      JOIN courses c ON e.courseId = c.id
      ORDER BY e.id DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("ADMIN REQUESTS ERROR:", err.message); // Check terminal if this fails
    res.status(500).json({ error: err.message });
  }
});

// 4. ADMIN: APPROVE OR REJECT
router.put("/:id", async (req, res) => {
  const { status } = req.body;
  
  try {
    await pool.query("UPDATE enrollments SET status = ? WHERE id = ?", [status, req.params.id]);

    if (status === 'APPROVED') {
      const [enrollment] = await pool.query("SELECT courseId, userId FROM enrollments WHERE id = ?", [req.params.id]);
      
      if (enrollment.length > 0) {
        const { courseId, userId } = enrollment[0];
        
        // Update Count (Check if column exists first or try/catch)
        try {
            await pool.query("UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id=?", [courseId]);
        } catch (e) {
            console.log("Skipping enrolledCount update (column might be missing)");
        }

        const [course] = await pool.query("SELECT title FROM courses WHERE id=?", [courseId]);
        await createNotification(
          userId,
          `You have been APPROVED for ${course[0].title}. Start learning now!`,
          "success"
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("APPROVE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;