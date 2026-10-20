require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const fileUpload = require('express-fileupload');
const path = require('path');
const errorHandler = require('./middleware/error');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Store io in app so it can be accessed in route controllers (req.app.get('io'))
app.set('io', io);

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Clients will emit 'join_project' when they open a project
  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`Socket ${socket.id} joined project room: ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// connectDB() will be called via middleware for serverless compatibility

// Only setup cron jobs when running locally (not in serverless)
if (!process.env.VERCEL) {
  const setupCronJobs = require('./utils/cron-jobs');
  setupCronJobs();
}

// Middleware
app.use(express.json());

// File Upload Middleware
app.use(fileUpload());

// Serve static files (HTML, CSS, JS) without blocking on DB connection
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection Middleware (scoped to /api routes)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/files', require('./routes/files'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reminders', require('./routes/reminders'));

// Basic Route
app.get('/', (req, res) => {
  res.send('Acad AI ProjectHub API is running!');
});

// Error handling middleware
app.use(errorHandler);

// Only listen when running locally (not in Vercel serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless
module.exports = app;
