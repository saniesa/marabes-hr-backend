const pool = require("../config/db");
// We import logActivity from the other controller
const { logActivity } = require("./activityController"); 

exports.getAll = async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
      (SELECT COUNT(*) FROM enrollments e WHERE e.courseId = c.id) as realEnrolledCount 
      FROM courses c
      ORDER BY c.createdAt DESC
    `;
    const [rows] = await pool.query(query);
    const courses = rows.map(r => ({
        ...r,
        enrolledCount: r.realEnrolledCount || r.enrolledCount || 0
    }));

    res.json(courses);
  } catch (err) {
    try {
        const [fallbackRows] = await pool.query("SELECT * FROM courses ORDER BY createdAt DESC");
        res.json(fallbackRows);
    } catch (fallbackErr) {
        console.error("GET COURSES ERROR:", fallbackErr.message);
        res.status(500).json({ error: fallbackErr.message });
    }
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, imageUrl, duration, instructor } = req.body;
    console.log("📝 Adding Course:", req.body);

    const [result] = await pool.query(
      `INSERT INTO courses 
      (title, description, imageUrl, duration, instructor, enrolledCount, createdAt) 
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [title, description, imageUrl, duration || '2h 30m', instructor || 'Marabes Expert']
    );
    
    await logActivity(req, "COURSE_CREATED", `Created course: ${req.body.title}`);
    res.json({ id: result.insertId, ...req.body, enrolledCount: 0 });
  } catch (err) {
    console.error("ADD COURSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.updateContent = async (req, res) => {
  const { content } = req.body; 
  try {
    const jsonContent = JSON.stringify(content);
    await pool.query(
      "UPDATE courses SET content = ? WHERE id = ?", 
      [jsonContent, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update Content Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    try {
        await pool.query("DELETE FROM enrollments WHERE courseId = ?", [req.params.id]);
    } catch (e) {}
    
    await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(" DELETE COURSE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};