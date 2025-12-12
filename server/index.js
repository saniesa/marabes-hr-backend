require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// --- ROUTES ---

// Auth (Public)
app.use("/auth", require("./routes/auth")); 

// API Routes (Protected)
app.use("/api/users", require("./routes/users"));
app.use("/api/scores", require("./routes/score")); // Fixes Evaluation/Score Reports
app.use("/api/notifications", require("./routes/notifications")); // Fixes Notification Bell
app.use("/api/timeoff", require("./routes/timeoff"));
app.use("/api/categories", require("./routes/category"));
 app.use("/api/enrollments", require("./routes/enrollment"));
 app.use("/api/courses", require("./routes/course"));         
app.use("/api/attendance", require("./routes/attendance")); 

// Root Test Route
app.get("/", (req, res) => res.send("Marabes HR Backend is working!"));




// === TEMPORARY DATABASE FIXER ROUTE ===
app.get("/fix-cloud-db", async (req, res) => {
  const pool = require("./db");
  try {
    const queries = [
      // 1. Add Department to Users
      "ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT 'General'",
      
      // 2. Create Courses Table
      `CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        imageUrl VARCHAR(255),
        duration VARCHAR(50) DEFAULT '2h 30m',
        instructor VARCHAR(100) DEFAULT 'Marabes Expert',
        enrolledCount INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // 3. Add Columns to Courses (in case table existed but cols didn't)
      "ALTER TABLE courses ADD COLUMN duration VARCHAR(50) DEFAULT '2h 30m'",
      "ALTER TABLE courses ADD COLUMN instructor VARCHAR(100) DEFAULT 'Marabes Expert'",
      "ALTER TABLE courses ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      "ALTER TABLE courses ADD COLUMN enrolledCount INT DEFAULT 0",

      // 4. Create Enrollments
      `CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        courseId INT NOT NULL,
        enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 5. Create Categories
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )`,
      "INSERT IGNORE INTO categories (id, name) VALUES (1, 'Technical'), (2, 'Soft Skills')",

      // 6. Create Scores
      `CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        userName VARCHAR(255),
        categoryId INT NOT NULL,
        score INT NOT NULL,
        feedback TEXT,
        date DATE
      )`,

      // 7. Create Notifications
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        isRead BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let log = "Database Update Log:\n";

    for (const sql of queries) {
      try {
        await pool.query(sql);
        log += ` Success: ${sql.substring(0, 30)}...\n`;
      } catch (err) {
        // Ignore "Duplicate column" errors, that means it's already fixed
        if (err.code === 'ER_DUP_FIELDNAME') {
           log += `Skipped (Already exists): ${sql.substring(0, 30)}...\n`;
        } else {
           log += ` Error: ${err.message}\n`;
        }
      }
    }

    res.send(`<pre>${log}</pre>`);
  } catch (err) {
    res.status(500).send("Fatal Error: " + err.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);