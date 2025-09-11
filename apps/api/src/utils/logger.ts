/**
 * Logger utility using Pino (Fastify's default logger)
 */

import pino from 'pino';
import { FastifyLoggerInstance } from 'fastify';

// Create logger instance
const logger: FastifyLoggerInstance = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      messageFormat: '[{time}] {level}: {msg}',
      customPrettifiers: {
        time: (timestamp: string) => `🕐 ${timestamp}`,
        level: (level: string) => {
          const levels: Record<string, string> = {
            '10': '🔍 TRACE',
            '20': '🐛 DEBUG',
            '30': 'ℹ️  INFO',
            '40': '⚠️  WARN',
            '50': '❌ ERROR',
            '60': '💀 FATAL'
          };
          return levels[level] || `📊 ${level}`;
        }
      }
    }
  } : undefined,
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      },
      remoteAddress: req.ip,
      remotePort: req.connection?.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length')
      }
    }),
    err: pino.stdSerializers.err
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
    log: (object) => {
      return {
        ...object,
        timestamp: new Date().toISOString(),
        service: 'chordrectness-api'
      };
    }
  }
});

// Add custom logging methods
const customLogger = {
  ...logger,
  
  // Request logging
  request: (req: any, res: any, responseTime: number) => {
    logger.info({
      type: 'request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }, `${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`);
  },

  // Analysis logging
  analysis: {
    started: (analysisId: string, url: string, startTime: number, endTime?: number) => {
      logger.info({
        type: 'analysis',
        action: 'started',
        analysisId,
        url,
        startTime,
        endTime
      }, `🎵 Analysis started: ${analysisId}`);
    },

    completed: (analysisId: string, chordCount: number, processingTime: number) => {
      logger.info({
        type: 'analysis',
        action: 'completed',
        analysisId,
        chordCount,
        processingTime
      }, `✅ Analysis completed: ${analysisId} (${chordCount} chords in ${processingTime}ms)`);
    },

    failed: (analysisId: string, error: string) => {
      logger.error({
        type: 'analysis',
        action: 'failed',
        analysisId,
        error
      }, `❌ Analysis failed: ${analysisId} - ${error}`);
    }
  },

  // Audio processing logging
  audio: {
    downloadStarted: (url: string, videoId: string) => {
      logger.info({
        type: 'audio',
        action: 'download_started',
        url,
        videoId
      }, `📥 Audio download started: ${videoId}`);
    },

    downloadCompleted: (videoId: string, duration: number, fileSize: number) => {
      logger.info({
        type: 'audio',
        action: 'download_completed',
        videoId,
        duration,
        fileSize
      }, `📥 Audio download completed: ${videoId} (${duration}s, ${fileSize} bytes)`);
    },

    extractionStarted: (videoId: string, startTime: number, endTime?: number) => {
      logger.info({
        type: 'audio',
        action: 'extraction_started',
        videoId,
        startTime,
        endTime
      }, `✂️  Audio extraction started: ${videoId} (${startTime}s - ${endTime || 'end'}s)`);
    },

    extractionCompleted: (videoId: string, outputPath: string) => {
      logger.info({
        type: 'audio',
        action: 'extraction_completed',
        videoId,
        outputPath
      }, `✂️  Audio extraction completed: ${videoId}`);
    }
  },

  // ML service logging
  ml: {
    requestSent: (audioPath: string, modelType: string) => {
      logger.info({
        type: 'ml',
        action: 'request_sent',
        audioPath,
        modelType
      }, `🤖 ML request sent: ${modelType}`);
    },

    responseReceived: (modelType: string, chordCount: number, processingTime: number) => {
      logger.info({
        type: 'ml',
        action: 'response_received',
        modelType,
        chordCount,
        processingTime
      }, `🤖 ML response received: ${chordCount} chords (${processingTime}ms)`);
    },

    error: (modelType: string, error: string) => {
      logger.error({
        type: 'ml',
        action: 'error',
        modelType,
        error
      }, `🤖 ML error: ${modelType} - ${error}`);
    }
  },

  // Performance logging
  performance: {
    slowRequest: (method: string, url: string, duration: number, threshold: number = 1000) => {
      logger.warn({
        type: 'performance',
        action: 'slow_request',
        method,
        url,
        duration,
        threshold
      }, `🐌 Slow request: ${method} ${url} (${duration}ms > ${threshold}ms)`);
    },

    highMemoryUsage: (usage: NodeJS.MemoryUsage, threshold: number = 100 * 1024 * 1024) => {
      logger.warn({
        type: 'performance',
        action: 'high_memory_usage',
        usage,
        threshold
      }, `🧠 High memory usage: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    }
  }
};

export { customLogger as logger };
export default logger;
