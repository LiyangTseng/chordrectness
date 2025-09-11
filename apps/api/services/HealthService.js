/**
 * Health Service - System health monitoring
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Get detailed system health information
 */
async function getSystemHealth() {
  const health = {
    overall: true,
    services: {},
    system: {}
  };

  try {
    // Check audio extraction service
    health.services.audioExtraction = await checkAudioExtractionHealth();
    
    // Check chord analysis service
    health.services.chordAnalysis = await checkChordAnalysisHealth();
    
    // Check file system
    health.services.fileSystem = await checkFileSystemHealth();
    
    // Check system resources
    health.system = await getSystemResources();
    
    // Determine overall health
    health.overall = Object.values(health.services).every(service => service.status === 'healthy');
    
  } catch (error) {
    logger.error('Health check failed:', error);
    health.overall = false;
    health.error = error.message;
  }

  return health;
}

/**
 * Check audio extraction service health
 */
async function checkAudioExtractionHealth() {
  try {
    // Check if temp directory is writable
    const tempDir = path.join(process.cwd(), 'temp', 'audio');
    await fs.access(tempDir, fs.constants.W_OK);
    
    return {
      status: 'healthy',
      message: 'Audio extraction service is operational',
      tempDirectory: tempDir
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Audio extraction service has issues',
      error: error.message
    };
  }
}

/**
 * Check chord analysis service health
 */
async function checkChordAnalysisHealth() {
  try {
    // For now, just check if the service can be instantiated
    const ChordAnalyzer = require('./ChordAnalyzer');
    const analyzer = new ChordAnalyzer();
    
    return {
      status: 'healthy',
      message: 'Chord analysis service is operational',
      sampleRate: analyzer.sampleRate
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Chord analysis service has issues',
      error: error.message
    };
  }
}

/**
 * Check file system health
 */
async function checkFileSystemHealth() {
  try {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Test write access
    const testFile = path.join(tempDir, 'health_check.tmp');
    await fs.writeFile(testFile, 'health check');
    await fs.unlink(testFile);
    
    return {
      status: 'healthy',
      message: 'File system is accessible',
      tempDirectory: tempDir
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'File system has issues',
      error: error.message
    };
  }
}

/**
 * Get system resource information
 */
async function getSystemResources() {
  const usage = process.memoryUsage();
  
  return {
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    },
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

module.exports = {
  getSystemHealth
};
