const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/", async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    avatarUrl,
    jobPosition,
    birthday,
    dateHired,
    phone,
    address,
    department,
  } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    "INSERT INTO users (name, email, password, role, avatarUrl, jobPosition, birthday, dateHired, phone, address, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      email,
      hashedPassword,
      role,
      avatarUrl,
      jobPosition,
      birthday,
      dateHired,
      phone,
      address,
      department,
    ]
  );

  res.json({ id: result.insertId, ...req.body, password: undefined });
});

router.put("/:id", async (req, res) => {
  const {
    name,
    email,
    role,
    avatarUrl,
    jobPosition,
    birthday,
    dateHired,
    phone,
    address,
    department,
  } = req.body;
  await pool.query(
    "UPDATE users SET name=?, email=?, role=?, avatarUrl=?, jobPosition=?, birthday=?, dateHired=?, phone=?, address=?, department=? WHERE id=?",
    [
      name,
      email,
      role,
      avatarUrl,
      jobPosition,
      birthday,
      dateHired,
      phone,
      address,
      department,
      req.params.id,
    ]
  );
  res.json({ id: req.params.id, ...req.body });
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
