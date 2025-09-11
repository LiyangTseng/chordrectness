/**
 * Analysis routes for chord recognition - Fastify implementation
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import AnalysisService from '../services/AnalysisService';
import { validateYouTubeUrl } from '../utils/validators';
import { logger } from '../utils/logger';

// Request/Response schemas
const AnalysisRequestSchema = Type.Object({
  url: Type.String({ 
    format: 'uri',
    description: 'YouTube video URL',
    examples: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ']
  }),
  startTime: Type.Number({ 
    minimum: 0,
    description: 'Start time in seconds',
    examples: [0, 30, 120]
  }),
  endTime: Type.Optional(Type.Number({ 
    minimum: 0,
    description: 'End time in seconds',
    examples: [60, 180, 300]
  })),
  analysisId: Type.Optional(Type.String({ 
    format: 'uuid',
    description: 'Optional analysis ID for tracking'
  }))
});

const AnalysisStatusSchema = Type.Object({
  analysisId: Type.String({ format: 'uuid' }),
  status: Type.Union([
    Type.Literal('processing'),
    Type.Literal('completed'),
    Type.Literal('error'),
    Type.Literal('cancelled')
  ]),
  progress: Type.Number({ minimum: 0, maximum: 1 }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  error: Type.Optional(Type.String())
});

const ChordSymbolSchema = Type.Object({
  symbol: Type.String({ examples: ['Cmaj7', 'Am7', 'Dm7', 'G7'] }),
  startTime: Type.Number({ examples: [0, 2.5, 5.0] }),
  endTime: Type.Number({ examples: [2.0, 4.5, 7.0] }),
  confidence: Type.Number({ minimum: 0, maximum: 1, examples: [0.85, 0.92, 0.78] }),
  root: Type.String({ examples: ['C', 'A', 'D', 'G'] }),
  quality: Type.String({ examples: ['major7', 'minor7', 'dominant7'] }),
  extensions: Type.Array(Type.String(), { examples: [['7'], ['9'], ['11', '13']] })
});

const AnalysisResultSchema = Type.Object({
  videoUrl: Type.String({ format: 'uri' }),
  startTime: Type.Number(),
  endTime: Type.Optional(Type.Number()),
  chordProgression: Type.Array(ChordSymbolSchema),
  analysisDuration: Type.Optional(Type.Number()),
  confidenceScores: Type.Array(Type.Number()),
  averageConfidence: Type.Number(),
  keySignature: Type.Optional(Type.String()),
  tempo: Type.Optional(Type.Number()),
  createdAt: Type.String({ format: 'date-time' })
});

const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number()
});

// Initialize analysis service
const analysisService = new AnalysisService();

export default async function analysisRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Add TypeBox type provider
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  /**
   * Start chord analysis for a YouTube video segment
   */
  typedFastify.post('/start', {
    schema: {
      description: 'Start chord analysis for a YouTube video segment',
      tags: ['Analysis'],
      body: AnalysisRequestSchema,
      response: {
        202: Type.Object({
          success: Type.Boolean(),
          data: AnalysisStatusSchema
        }),
        400: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { url, startTime, endTime, analysisId } = request.body;

      // Validate YouTube URL
      if (!validateYouTubeUrl(url)) {
        return reply.code(400).send({
          error: 'Invalid URL',
          message: 'Please provide a valid YouTube URL',
          statusCode: 400
        });
      }

      logger.info(`Starting analysis for ${url} (${startTime}s - ${endTime || 'end'}s)`);

      // Start analysis
      const result = await analysisService.startAnalysis({
        url,
        startTime,
        endTime,
        analysisId
      });

      return reply.code(202).send({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error starting analysis:', error);
      return reply.code(500).send({
        error: 'Failed to start analysis',
        message: error.message,
        statusCode: 500
      });
    }
  });

  /**
   * Get analysis status and results
   */
  typedFastify.get('/:analysisId', {
    schema: {
      description: 'Get analysis status and results',
      tags: ['Analysis'],
      params: Type.Object({
        analysisId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: AnalysisStatusSchema
        }),
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { analysisId } = request.params;

      const result = await analysisService.getAnalysisStatus(analysisId);

      if (!result) {
        return reply.code(404).send({
          error: 'Analysis not found',
          message: `Analysis with ID ${analysisId} not found`,
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error getting analysis status:', error);
      return reply.code(500).send({
        error: 'Failed to get analysis status',
        message: error.message,
        statusCode: 500
      });
    }
  });

  /**
   * Get analysis results (chord progression)
   */
  typedFastify.get('/:analysisId/result', {
    schema: {
      description: 'Get analysis results (chord progression)',
      tags: ['Analysis'],
      params: Type.Object({
        analysisId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: AnalysisResultSchema
        }),
        404: ErrorResponseSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { analysisId } = request.params;

      const result = await analysisService.getAnalysisResult(analysisId);

      if (!result) {
        return reply.code(404).send({
          error: 'Analysis result not found',
          message: `Analysis result with ID ${analysisId} not found`,
          statusCode: 404
        });
      }

      return reply.send({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error getting analysis result:', error);
      return reply.code(500).send({
        error: 'Failed to get analysis result',
        message: error.message,
        statusCode: 500
      });
    }
  });

  /**
   * Cancel/delete an analysis
   */
  typedFastify.delete('/:analysisId', {
    schema: {
      description: 'Cancel/delete an analysis',
      tags: ['Analysis'],
      params: Type.Object({
        analysisId: Type.String({ format: 'uuid' })
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          message: Type.String(),
          data: AnalysisStatusSchema
        }),
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { analysisId } = request.params;

      const result = await analysisService.cancelAnalysis(analysisId);

      return reply.send({
        success: true,
        message: 'Analysis cancelled successfully',
        data: result
      });

    } catch (error: any) {
      logger.error('Error cancelling analysis:', error);
      return reply.code(500).send({
        error: 'Failed to cancel analysis',
        message: error.message,
        statusCode: 500
      });
    }
  });

  /**
   * Get list of recent analyses
   */
  typedFastify.get('/', {
    schema: {
      description: 'Get list of recent analyses',
      tags: ['Analysis'],
      querystring: Type.Object({
        limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 10 })),
        offset: Type.Optional(Type.Number({ minimum: 0, default: 0 }))
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(AnalysisStatusSchema)
        }),
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { limit = 10, offset = 0 } = request.query;

      const analyses = await analysisService.getRecentAnalyses({
        limit,
        offset
      });

      return reply.send({
        success: true,
        data: analyses
      });

    } catch (error: any) {
      logger.error('Error getting recent analyses:', error);
      return reply.code(500).send({
        error: 'Failed to get recent analyses',
        message: error.message,
        statusCode: 500
      });
    }
  });
}
