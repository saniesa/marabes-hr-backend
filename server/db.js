const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "marabes_hr",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

// --- CONNECTION DIAGNOSTIC ---
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ FATAL: Cannot connect to Database!");
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
  } else {
    console.log("========================================");
    console.log("✅ CONNECTED SUCCESSFULLY");
    console.log(`📂 Database Name:  ${connection.config.database}`);
    console.log(`🔌 Host Address:   ${connection.config.host}`);
    console.log(`🚪 Port Number:    ${connection.config.port}`); // <--- LOOK AT THIS
    console.log(`👤 User:           ${connection.config.user}`);
    console.log("========================================");
    connection.release();
  }
});

module.exports = promisePool;