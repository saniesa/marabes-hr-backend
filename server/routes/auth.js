const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// --- LOGIN ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // For demo: accept any password OR uncomment for real hash check
    // const validPassword = await bcrypt.compare(password, user.password);
    // if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REGISTER ---
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      jobPosition,
      birthday,
      dateHired,
      phone,
      address,
      department,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
      (name, email, password, role, avatarUrl, jobPosition, birthday, dateHired, phone, address, department, theme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        role || "EMPLOYEE",
        `https://picsum.photos/200?random=${Date.now()}`,
        jobPosition,
        birthday,
        dateHired,
        phone,
        address,
        department,
        "light", // default theme
      ]
    );

    res.json({ id: result.insertId, message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE THEME ---
router.patch("/theme", async (req, res) => {
  try {
    const { userId, theme } = req.body;

    if (!["light", "dark", "auto"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }

    await pool.query("UPDATE users SET theme = ? WHERE id = ?", [theme, userId]);

    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = users[0];
    delete user.password;

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
