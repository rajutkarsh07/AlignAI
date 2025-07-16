const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const taskRoutes = require('./routes/taskRoutes');
const chatRoutes = require('./routes/chatRoutes');
const roadmapRoutes = require('./routes/roadmapRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20, // limit each IP to 20 requests per minute
});
app.use('/api/', limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json());

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/roadmap-assistant',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Socket.io setup for real-time communication
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join-room', (projectId) => {
    socket.join(projectId);
    console.log(`📝 User ${socket.id} joined project room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/roadmap', roadmapRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 MongoDB: ${process.env.MONGODB_URI}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, io };
