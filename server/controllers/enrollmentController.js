const pool = require("../config/db");

// Internal Helper
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

exports.getUserEnrollments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT courseId, status FROM enrollments WHERE userId=?", [req.params.userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.selfEnroll = async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    const [exists] = await pool.query("SELECT * FROM enrollments WHERE userId = ? AND courseId = ?", [userId, courseId]);
    if (exists.length > 0) return res.status(400).json({ msg: "Already enrolled" });

    await pool.query("INSERT INTO enrollments (userId, courseId, dateEnrolled, status) VALUES (?, ?, CURDATE(), 'PENDING')", [userId, courseId]);
    
    const [courses] = await pool.query("SELECT title FROM courses WHERE id=?", [courseId]);
    const [user] = await pool.query("SELECT name FROM users WHERE id=?", [userId]);
    
    if (courses.length > 0) {
        // Notify User
        createNotification(userId, `Request sent for ${courses[0].title}`, "info");
        
        // --- NEW: Notify Admins about the enrollment request ---
        const [admins] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
        for (const admin of admins) {
          await createNotification(admin.id, `Enrollment request: ${user[0].name} for ${courses[0].title}`, "info");
        }
    }

    res.json({ success: true, status: 'PENDING' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminAssign = async (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ error: "Missing User ID or Course ID" });
  }
  try {
    console.log(`Force Assigning User ${userId} to Course ${courseId}...`);
    await pool.query("DELETE FROM enrollments WHERE userId = ? AND courseId = ?", [userId, courseId]);
    await pool.query(
      "INSERT INTO enrollments (userId, courseId, dateEnrolled, status) VALUES (?, ?, CURDATE(), 'APPROVED')",
      [userId, courseId]
    );

    try {
        await pool.query("UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id=?", [courseId]);
    } catch (countErr) {
        console.error("Could not update count:", countErr.message);
    }

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
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminRequests = async (req, res) => {
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
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query("UPDATE enrollments SET status = ? WHERE id = ?", [status, req.params.id]);
    
    const [enr] = await pool.query("SELECT courseId, userId FROM enrollments WHERE id=?", [req.params.id]);
    
    if (enr.length > 0) {
        const [c] = await pool.query("SELECT title FROM courses WHERE id=?", [enr[0].courseId]);
        
        if (status === 'APPROVED') {
            await pool.query("UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id=?", [enr[0].courseId]);
            createNotification(enr[0].userId, `Approved for ${c[0].title}`, "success");
        } 
        // --- NEW: Notify if Rejected ---
        else if (status === 'REJECTED') {
            createNotification(enr[0].userId, `Enrollment request for ${c[0].title} was declined.`, "error");
        }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};