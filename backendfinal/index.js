const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
require('dotenv').config();

// Create HTTP server
const server = http.createServer(app);

// CORS configuration with specific origin and credentials
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Socket.IO configuration
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Configure socket events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// MongoDB connection
require('./Models/db');
app.use('/uploads', express.static('uploads'));

// Routers
const AuthRouter = require('./Routes/AuthRouter');
const studentRoutes = require('./Routes/StudentRoutes');
const teacherRoutes = require('./Routes/TeacherRoutes');

// Middleware
app.use(bodyParser.json());  // or use express.json()
app.use(express.json());     // to parse JSON request body

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Routes
app.use('/api/auth', AuthRouter);         // Login / Register
app.use('/api/student', studentRoutes);   // Student features
app.use('/api/teacher', teacherRoutes);   // Teacher features

// Configure socket events
const configureSocket = require('./socketConfig');
configureSocket(io);

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Socket.IO server is ready for connections');
});
