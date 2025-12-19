require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

// 1. IMPORT YOUR ROUTES & MIDDLEWARE
const { authMiddleware } = require("./middleware/auth"); // <--- Import your security guard
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users"); // Ensure this matches your filename
const activityRoute = require("./routes/activity");
const scoreRoutes = require("./routes/score");
const notificationRoutes = require("./routes/notifications");
const timeoffRoutes = require("./routes/timeoff");
const categoryRoutes = require("./routes/category");
const enrollmentRoutes = require("./routes/enrollment");
const courseRoutes = require("./routes/course");
const attendanceRoutes = require("./routes/attendance");

const app = express();

// 2. BASIC MIDDLEWARE
app.use(cors());
app.use(express.json());

// 3. STORAGE CONFIG (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// ==========================================
// 4. ROUTE HIERARCHY (The Security Part)
// ==========================================

// AUTH (Public - No login needed to reach these)
app.use("/auth", authRoutes); 

// --- THE SECURITY GATEKEEPER ---
// Everything below this line starting with "/api" will now REQUIRE a login token
app.use("/api", authMiddleware); 

// PROTECTED API ROUTES
// (The blurry colors will go away because we are using the variables here)
app.use("/api/users", userRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/timeoff", timeoffRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/courses", courseRoutes);         
app.use("/api/attendance", attendanceRoutes); 
app.use("/api/activity", activityRoute);

// PROTECTED UPLOAD ROUTE
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 5. STATIC FILES & TEST ROUTES
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", (req, res) => res.send("Marabes HR Backend is secured and working!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);