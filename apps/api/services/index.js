/**
 * Services initialization
 */

const logger = require('../utils/logger');

/**
 * Initialize all services
 */
async function initializeServices() {
  try {
    logger.info('Initializing services...');
    
    // Create necessary directories
    const fs = require('fs').promises;
    const path = require('path');
    
    const tempDir = path.join(process.cwd(), 'temp', 'audio');
    await fs.mkdir(tempDir, { recursive: true });
    
    logger.info('Services initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

module.exports = {
  initializeServices
};
