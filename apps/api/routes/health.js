/**
 * Health check routes
 */

const express = require('express');
const router = express.Router();

const { getSystemHealth } = require('../services/HealthService');
const logger = require('../utils/logger');

/**
 * @route   GET /api/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check with system status
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = await getSystemHealth();
    
    res.json({
      status: health.overall ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      services: health.services,
      system: health.system
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
