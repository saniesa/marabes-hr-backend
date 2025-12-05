require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


app.use(cors());
app.use(express.json());

// --- ROUTES ---
// app.use('/auth', require('./routes/auth'));
app.use('/timeoff', require('./routes/timeoff'));
app.use('/categories', require('./routes/category'));
// app.use('/scores', require('./routes/score'));  // FIXED
app.use('/enrollments', require('./routes/enrollment'));
app.use('/courses', require('./routes/course'));
app.use('/attendance', require('./routes/attendance'));
app.use('/users', require('./routes/users'));

app.get('/', (req, res) => res.send('Backend is working!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
