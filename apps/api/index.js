/**
 * YouTube Chord Recognition Tool - Express.js Backend
 * Main server application for processing YouTube videos and extracting chord progressions.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const analysisRoutes = require('./routes/analysis');
const healthRoutes = require('./routes/health');
const { initializeServices } = require('./services');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube Chord Recognition API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize services and start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🎵 API docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();
