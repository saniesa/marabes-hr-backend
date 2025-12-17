require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path"); // <--- Import Path
const multer = require("multer"); // <--- Import Multer
const fs = require("fs"); 

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Create folder if missing
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Unique filename: video-123456789.mp4
    cb(null, `video-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const activityRoute = require("./routes/activity"); // Import the whole file

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
app.use("/api/activity", activityRoute); // Register the route


// 2. MAKE UPLOADS FOLDER PUBLIC (So frontend can play videos)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3. UPLOAD ROUTE
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  // Return the URL that the frontend can use
  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// Root Test Route
app.get("/", (req, res) => res.send("Marabes HR Backend is working!"));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);