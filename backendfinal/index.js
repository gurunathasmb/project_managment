const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');

// Create HTTP server
const server = http.createServer(app);

// Allowed origins (LOCAL + PRODUCTION)
const allowedOrigins = [
  'http://localhost:3000',
  'https://planova-pms.netlify.app'
];

// CORS middleware (BEFORE routes)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ❌ DO NOT add app.options() in Express 5

// Body parsers
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
require('./Models/db');

// Static uploads
app.use('/uploads', express.static('uploads'));

// Routers
const AuthRouter = require('./Routes/AuthRouter');
const studentRoutes = require('./Routes/StudentRoutes');
const teacherRoutes = require('./Routes/TeacherRoutes');

// Routes
app.use('/api/auth', AuthRouter);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const configureSocket = require('./socketConfig');
configureSocket(io);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.IO server is ready for connections');
});
