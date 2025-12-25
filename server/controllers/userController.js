const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { logActivity } = require("./activityController");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      name, email, password, role, avatarUrl, jobPosition,
      birthday, dateHired, phone, address, department,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, avatarUrl, jobPosition, birthday, dateHired, phone, address, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name, email, hashedPassword, role, avatarUrl, jobPosition,
        birthday, dateHired, phone, address, department,
      ]
    );

    await logActivity(req, "USER_CREATED", `Added new employee: ${name} (${role})`);

    res.json({ id: result.insertId, ...req.body, password: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      name, email, role, avatarUrl, jobPosition,
      birthday, dateHired, phone, address, department,
    } = req.body;

    await pool.query(
      "UPDATE users SET name=?, email=?, role=?, avatarUrl=?, jobPosition=?, birthday=?, dateHired=?, phone=?, address=?, department=? WHERE id=?",
      [
        name, email, role, avatarUrl, jobPosition,
        birthday, dateHired, phone, address, department,
        req.params.id,
      ]
    );

    await logActivity(req, "USER_UPDATED", `Updated profile details for employee: ${name}`);

    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT name FROM users WHERE id=?", [req.params.id]);
    const userName = users[0]?.name || "Unknown";

    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);

    await logActivity(req, "USER_DELETED", `Removed employee account: ${userName}`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBaseSalary = async (req, res) => {
  const { id } = req.params;
  const { baseSalary } = req.body;
  try {
    // Fetch name for the log
    const [user] = await pool.query("SELECT name FROM users WHERE id = ?", [id]);
    const name = user[0] ? user[0].name : "Unknown";

    await pool.query("UPDATE users SET baseSalary = ? WHERE id = ?", [baseSalary, id]);

    // LOG THE AUDIT
    await logActivity(req, "SALARY_UPDATE", `Changed base salary for ${name} to $${baseSalary}`);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
};