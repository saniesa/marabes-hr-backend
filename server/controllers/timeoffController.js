const pool = require("../config/db");
const { logActivity } = require("./activityController"); // ✅ Added import

const createNotification = async (userId, message, type = "info") => {
  await pool.query(
    `INSERT INTO notifications (userId, message, type, isRead, createdAt)
     VALUES (?, ?, ?, 0, NOW())`,
    [userId, message, type]
  );
};

exports.getStats = async (req, res) => {
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
};

exports.list = async (req, res) => {
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
};

exports.create = async (req, res) => {
  try {
    const { userId, userName, type, startDate, endDate, reason } = req.body;
    const [result] = await pool.query(
      `INSERT INTO time_off_requests (userId,userName,type,startDate,endDate,reason,status)
       VALUES (?, ?, ?, ?, ?, ?, "PENDING")`,
      [userId, userName, type, startDate, endDate, reason]
    );

    // --- LOG ACTIVITY ---
    await logActivity(req, "TIME_OFF_REQUEST", `${userName} requested ${type} leave (${startDate} to ${endDate})`);

    // --- Notify Admins ---
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN'");
    for (const admin of admins) {
      await createNotification(
        admin.id,
        `New ${type} request from ${userName}`,
        "info"
      );
    }

    res.json({ id: result.insertId, ...req.body, status: "PENDING" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    
    // Get request details before updating for a better log message
    const [requests] = await pool.query(
        "SELECT userId, userName, type FROM time_off_requests WHERE id=?",
        [req.params.id]
      );
    
    if (requests.length === 0) return res.status(404).json({error: "Request not found"});
    const request = requests[0];

    await pool.query(
      "UPDATE time_off_requests SET status=?, adminNote=? WHERE id=?",
      [status, note, req.params.id]
    );

    // --- LOG ACTIVITY ---
    await logActivity(req, "TIME_OFF_UPDATED", `Admin set ${request.userName}'s ${request.type} request to ${status}`);

    // --- Notify Employee ---
    await createNotification(
      request.userId,
      `Your time-off request has been ${status.toLowerCase()}`,
      status === "APPROVED" ? "success" : "error"
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    // Get details for log before deleting
    const [requests] = await pool.query("SELECT userName, type FROM time_off_requests WHERE id=?", [req.params.id]);
    
    await pool.query("DELETE FROM time_off_requests WHERE id=?", [req.params.id]);

    // --- LOG ACTIVITY ---
    if (requests.length > 0) {
        await logActivity(req, "TIME_OFF_DELETED", `Deleted ${requests[0].type} request for ${requests[0].userName}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};