const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// MongoDB connection
require('./Models/db');
app.use('/uploads', express.static('uploads'));

// Routers
const AuthRouter = require('./Routes/AuthRouter');
const studentRoutes = require('./Routes/StudentRoutes');
const teacherRoutes = require('./Routes/TeacherRoutes');

// Middleware
app.use(cors());
app.use(bodyParser.json());  // or use express.json()
app.use(express.json());     // to parse JSON request body

// Routes
app.use('/api/auth', AuthRouter);         // Login / Register
app.use('/api/student', studentRoutes);   // Student features
app.use('/api/teacher', teacherRoutes);   // Teacher features

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
