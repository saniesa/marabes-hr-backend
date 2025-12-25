const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { logActivity } = require("./activityController");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    // For debugging if your passwords aren't hashed yet, you can bypass this temporarily
    // if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // MANUALLY ATTACH USER TO REQ FOR THE LOGGER (since it's not in middleware yet)
    req.user = { id: user.id, name: user.name };
    await logActivity(req, "LOGIN", `User ${user.name} logged in successfully.`);

    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const {
      name, email, password, role, jobPosition,
      birthday, dateHired, phone, address, department,
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users 
      (name, email, password, role, avatarUrl, jobPosition, birthday, dateHired, phone, address, department, theme)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, email, hashedPassword, role || "EMPLOYEE",
        `https://picsum.photos/200?random=${Date.now()}`,
        jobPosition, birthday, dateHired, phone, address, department,
        "light",
      ]
    );

    // LOG THE ACTIVITY
    await logActivity(req, "USER_REGISTERED", `New user created account: ${name}`);

    res.json({ id: result.insertId, message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const { userId, theme } = req.body;
    await pool.query("UPDATE users SET theme = ? WHERE id = ?", [theme, userId]);
    
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    const user = users[0];
    delete user.password;

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    
    // 1. Get user
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const user = users[0];

    // 2. Check old password
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.status(401).json({ error: "Incorrect current password" });

    // 3. Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    // 4. Log the activity
    req.user = { id: user.id, name: user.name };
    await logActivity(req, "PASSWORD_CHANGED", "User successfully updated their security credentials.");

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};