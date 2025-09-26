import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import sensible from '@fastify/sensible';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import FormData from 'form-data';
import axios from 'axios';
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
const chordAnalyzerClient = new ChordAnalyzerClient(process.env.CHORD_ANALYZER_URL || 'http://localhost:8001');

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

  // Download YouTube audio for player
  fastify.post('/api/youtube/download', {
    schema: {
      description: 'Download YouTube audio for player',
      tags: ['youtube'],
      body: {
        type: 'object',
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri' }
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
                audioUrl: { type: 'string' },
                duration: { type: 'number' },
                title: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { url } = request.body as any;
    
    if (!url) {
      return reply.code(400).send({
        success: false,
        error: 'YouTube URL is required'
      });
    }

    try {
      // Extract full audio from YouTube
      const audioProcessor = new (await import('./services/AudioProcessor')).AudioProcessor();
      const audioResult = await audioProcessor.extractAudioFromYouTube(url);
      
      // Create a public URL for the audio file
      const audioUrl = `/api/audio/${path.basename(audioResult.audioPath)}`;
      
      return {
        success: true,
        data: {
          audioUrl,
          duration: audioResult.duration,
          title: 'YouTube Audio' // Could be enhanced to get actual title
        }
      };
    } catch (error) {
      fastify.log.error('YouTube download error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to download YouTube audio'
      });
    }
  });

  // Serve audio files
  fastify.get('/api/audio/:filename', async (request, reply) => {
    const { filename } = request.params as any;
    const audioPath = path.join(process.cwd(), 'temp', 'audio', filename);
    
    try {
      await fsPromises.access(audioPath);
      const audioBuffer = await fsPromises.readFile(audioPath);
      reply.type('audio/wav');
      return reply.send(audioBuffer);
    } catch (error) {
      return reply.code(404).send({ error: 'Audio file not found' });
    }
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

  // Audio file upload analysis
  fastify.post('/api/analysis/audio', {
    schema: {
      description: 'Analyze chord in uploaded audio file',
      tags: ['analysis']
    }
  }, async (request, reply) => {
    let tempPath: string | undefined;
    try {
      fastify.log.info('Received audio analysis request');

      const data = await request.file();

      if (!data) {
        fastify.log.warn('No file uploaded in request');
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      fastify.log.info(`Processing file: ${data.filename}, size: ${data.file.bytesRead || 'unknown'}`);

      // Create a temporary file
      tempPath = path.join(process.cwd(), 'temp', 'audio', `${Date.now()}_${data.filename}`);
      const writeStream = fs.createWriteStream(tempPath);

      // Write the file
      await new Promise((resolve, reject) => {
        data.file.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Call Python service directly with file path
      const startTime = (data.fields?.start_time as any)?.value || '0';
      const endTime = (data.fields?.end_time as any)?.value;
      const modelType = (data.fields?.model_type as any)?.value || 'chroma';

      fastify.log.info(`Calling Python service with: startTime=${startTime}, endTime=${endTime}, modelType=${modelType}`);

      // Create form data for the Python service
      const formData = new FormData();
      formData.append('file', fs.createReadStream(tempPath), data.filename);
      formData.append('start_time', startTime);
      if (endTime) {
        formData.append('end_time', endTime);
      }
      formData.append('model_type', modelType);

      fastify.log.info('Sending request to Python service...');

      // Test connection first
      const pythonServiceUrl = process.env.CHORD_ANALYZER_URL || 'http://chord-analyzer:8001';
      try {
        const healthCheck = await axios.get(`${pythonServiceUrl}/api/v1/health`, { timeout: 5000 });
        fastify.log.info(`Python service health check: ${healthCheck.status}`);
      } catch (healthError) {
        fastify.log.error('Python service health check failed:', healthError);
        throw new Error(`Python service not accessible: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
      }

      const pythonResponse = await axios.post(`${pythonServiceUrl}/api/v1/analyze/audio`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      });

      fastify.log.info(`Python service response: ${pythonResponse.status}`);

      const result = pythonResponse.data;

      // Clean up temp file
      fs.unlinkSync(tempPath);

      return result;

    } catch (error) {
      fastify.log.error('Audio analysis error:', error);

      // Clean up temp file if it exists
      if (tempPath && fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          fastify.log.warn('Failed to cleanup temp file:', cleanupError);
        }
      }

      // Return more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = {
        error: 'Analysis failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      };

      fastify.log.error('Audio analysis error details:', errorDetails);
      return reply.code(500).send(errorDetails);
    }
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
                results: {
                  type: 'object',
                  properties: {
                    chords: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          chord: { type: 'string' },
                          confidence: { type: 'number' },
                          start_time: { type: 'number' },
                          end_time: { type: 'number' }
                        }
                      }
                    },
                    key: { type: 'string' },
                    tempo: { type: 'number' },
                    timeSignature: { type: 'string' }
                  }
                }
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
    fastify.log.info(`Starting YouTube analysis for ${url}, analysisId: ${analysisId}`);

    // Update progress
    analysisResults.set(analysisId, {
      ...analysisResults.get(analysisId),
      status: 'processing',
      progress: 0.2,
      updatedAt: new Date().toISOString()
    });

    // Check if chord analyzer service is available
    fastify.log.info('Checking chord analyzer service health...');
    const isHealthy = await chordAnalyzerClient.healthCheck();
    fastify.log.info('Chord analyzer service healthy:', isHealthy);

    if (isHealthy) {
      // Use Python chord analyzer service
      fastify.log.info('Using Python chord analyzer service');

      // Use real chord analyzer service
      fastify.log.info('Calling chordAnalyzerClient.analyzeChords...');
      let analysisResult;
      try {
        const result = await chordAnalyzerClient.analyzeChords({
          url,
          startTime: startTime,
          endTime: endTime,
          analysisId: analysisId
        });
        fastify.log.info('ChordAnalyzerClient.analyzeChords completed');
        analysisResult = result;
        fastify.log.info('Analysis result received:', JSON.stringify(analysisResult, null, 2));
      } catch (error) {
        fastify.log.error('Error in chordAnalyzerClient.analyzeChords:', error);
        fastify.log.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        throw error;
      }

      // Check if analysisResult is valid
      if (!analysisResult || !analysisResult.chords) {
        throw new Error('Invalid analysis result received from chord analyzer service');
      }

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
          timeSignature: analysisResult.timeSignature
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
    fastify.log.error('YouTube analysis error:', error);
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

    const port = parseInt(process.env.PORT || '3002');
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