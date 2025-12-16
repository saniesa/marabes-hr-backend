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
    console.error("Notification failed", err);
  }
};

// ... (Keep GET routes here) ...

// GET USER ENROLLMENTS
router.get("/my/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT courseId, status FROM enrollments WHERE userId=?", [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SELF-ENROLL
router.post("/", async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    const [exists] = await pool.query("SELECT * FROM enrollments WHERE userId = ? AND courseId = ?", [userId, courseId]);
    if (exists.length > 0) return res.status(400).json({ msg: "Already enrolled" });

    await pool.query("INSERT INTO enrollments (userId, courseId, dateEnrolled, status) VALUES (?, ?, CURDATE(), 'PENDING')", [userId, courseId]);
    
    // Notify
    const [courses] = await pool.query("SELECT title FROM courses WHERE id=?", [courseId]);
    if (courses.length > 0) createNotification(userId, `Request sent for ${courses[0].title}`, "info");

    res.json({ success: true, status: 'PENDING' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ADMIN ASSIGN (Force Update)
router.post("/assign", async (req, res) => {
  const { userId, courseId } = req.body;
  
  // 1. Validate Inputs
  if (!userId || !courseId) {
    return res.status(400).json({ error: "Missing User ID or Course ID" });
  }

  try {
    console.log(`Force Assigning User ${userId} to Course ${courseId}...`);

    // 2. Clear ANY existing enrollment for this pair (Clean slate)
    await pool.query(
      "DELETE FROM enrollments WHERE userId = ? AND courseId = ?", 
      [userId, courseId]
    );

    // 3. Insert fresh APPROVED record
    // We use CURDATE() for dateEnrolled
    await pool.query(
      "INSERT INTO enrollments (userId, courseId, dateEnrolled, status) VALUES (?, ?, CURDATE(), 'APPROVED')",
      [userId, courseId]
    );

    // 4. Update Course Counter
    // We wrapped this in try/catch in case the course ID is bad, but it won't stop the enrollment
    try {
        await pool.query("UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id=?", [courseId]);
    } catch (countErr) {
        console.error("Could not update count:", countErr.message);
    }

    // 5. Send Notification
    try {
        const [courses] = await pool.query("SELECT title FROM courses WHERE id=?", [courseId]);
        if (courses.length > 0) {
            await createNotification(userId, `You have been assigned to ${courses[0].title} by Admin.`, "success");
        }
    } catch (notifErr) {
        console.error("Notification failed:", notifErr.message);
    }

    res.json({ success: true, message: "User assigned successfully" });

  } catch (err) {
    console.error("ASSIGN ERROR:", err); // Watch your terminal for this!
    res.status(500).json({ error: err.message });
  }
});

// ADMIN REQUESTS LIST
router.get("/admin/requests", async (req, res) => {
  try {
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
    res.status(500).json({ error: err.message });
  }
});

// UPDATE STATUS
router.put("/:id", async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE enrollments SET status = ? WHERE id = ?", [status, req.params.id]);
    
    if (status === 'APPROVED') {
        const [enr] = await pool.query("SELECT courseId, userId FROM enrollments WHERE id=?", [req.params.id]);
        if(enr.length > 0) {
            await pool.query("UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id=?", [enr[0].courseId]);
            
            const [c] = await pool.query("SELECT title FROM courses WHERE id=?", [enr[0].courseId]);
            createNotification(enr[0].userId, `Approved for ${c[0].title}`, "success");
        }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;