import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import sensible from '@fastify/sensible';
import { v4 as uuidv4 } from 'uuid';
import { ChordDetector } from './services/ChordDetector';
import { AudioProcessor } from './services/AudioProcessor';
import { ChordAnalyzerClient } from './services/ChordAnalyzerClient';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// Initialize services
const chordDetector = new ChordDetector();
const audioProcessor = new AudioProcessor();
const chordAnalyzerClient = new ChordAnalyzerClient(process.env.CHORD_ANALYZER_URL || 'http://chord-analyzer:8001');

// Store analysis results in memory (in production, use Redis or database)
const analysisResults = new Map<string, any>();

// Register plugins
async function registerPlugins() {
  await fastify.register(cors, {
    origin: true,
    credentials: true
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });

  await fastify.register(sensible);

  await fastify.register(swagger, {
    swagger: {
      info: {
        title: 'ChordRectness API',
        description: 'AI-powered chord recognition for YouTube videos',
        version: '1.0.0'
      },
      host: 'localhost:3002',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json']
    }
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    }
  });
}

// Routes
async function registerRoutes() {
  // Health check
  fastify.get('/api/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };
  });

  // Start analysis
  fastify.post('/api/analysis/start', {
    schema: {
      description: 'Start chord analysis for a YouTube video',
      tags: ['analysis'],
      body: {
        type: 'object',
        required: ['url', 'startTime'],
        properties: {
          url: { type: 'string', format: 'uri' },
          startTime: { type: 'number', minimum: 0 },
          endTime: { type: 'number', minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analysisId: { type: 'string' },
                status: { type: 'string' },
                progress: { type: 'number' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { url, startTime, endTime } = request.body as any;
    
    // Generate analysis ID
    const analysisId = uuidv4();
    
    // Store initial analysis state
    analysisResults.set(analysisId, {
      analysisId,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url,
      startTime,
      endTime
    });
    
    // Process audio asynchronously
    processAudioAsync(analysisId, url, startTime, endTime);
    
    return {
      success: true,
      data: {
        analysisId,
        status: 'processing',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  });

  // Get analysis status
  fastify.get('/api/analysis/:id', {
    schema: {
      description: 'Get analysis status and results',
      tags: ['analysis'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                analysisId: { type: 'string' },
                status: { type: 'string' },
                progress: { type: 'number' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
                results: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as any;
    
    const analysis = analysisResults.get(id);
    if (!analysis) {
      return reply.code(404).send({
        success: false,
        error: 'Analysis not found'
      });
    }
    
    return {
      success: true,
      data: analysis
    };
  });
}

// Async audio processing function
async function processAudioAsync(analysisId: string, url: string, startTime: number, endTime?: number) {
  try {
    // Update progress
    analysisResults.set(analysisId, {
      ...analysisResults.get(analysisId),
      status: 'processing',
      progress: 0.2,
      updatedAt: new Date().toISOString()
    });

    // Check if chord analyzer service is available
    const isHealthy = await chordAnalyzerClient.healthCheck();
    
    if (isHealthy) {
      // Use Python chord analyzer service
      fastify.log.info('Using Python chord analyzer service');
      
      const analysisResult = await chordAnalyzerClient.analyzeChords({
        url,
        start_time: startTime,
        end_time: endTime,
        analysis_id: analysisId
      });

      // Update with results
      analysisResults.set(analysisId, {
        ...analysisResults.get(analysisId),
        status: 'completed',
        progress: 1,
        updatedAt: new Date().toISOString(),
        results: {
          chords: analysisResult.chords,
          key: analysisResult.key,
          tempo: analysisResult.tempo,
          timeSignature: analysisResult.time_signature
        }
      });
    } else {
      // Fallback to mock analysis
      fastify.log.warn('Chord analyzer service unavailable, using mock analysis');
      
      // Extract audio from YouTube
      const audioResult = await audioProcessor.extractAudioFromYouTube(url, startTime, endTime);

      // Update progress
      analysisResults.set(analysisId, {
        ...analysisResults.get(analysisId),
        status: 'processing',
        progress: 0.5,
        updatedAt: new Date().toISOString()
      });

      // Read audio file
      const audioBuffer = await audioProcessor.readAudioFile(audioResult.audioPath);

      // Analyze chords using mock detector
      const analysisResult = await chordDetector.analyzeAudio(audioBuffer, startTime, endTime);

      // Update with results
      analysisResults.set(analysisId, {
        ...analysisResults.get(analysisId),
        status: 'completed',
        progress: 1,
        updatedAt: new Date().toISOString(),
        results: analysisResult
      });

      // Clean up audio file
      await audioProcessor.cleanup(audioResult.audioPath);
    }

  } catch (error) {
    // Update with error
    analysisResults.set(analysisId, {
      ...analysisResults.get(analysisId),
      status: 'error',
      progress: 0,
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 ChordRectness API server running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/api/health`);
    console.log(`📚 API docs: http://${host}:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();