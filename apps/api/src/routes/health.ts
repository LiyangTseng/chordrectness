/**
 * Health check routes - Fastify implementation
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

import { getSystemHealth } from '../services/HealthService';
import { logger } from '../utils/logger';

// Response schemas
const BasicHealthSchema = Type.Object({
  status: Type.Literal('healthy'),
  timestamp: Type.String({ format: 'date-time' }),
  uptime: Type.Number(),
  version: Type.String()
});

const ServiceHealthSchema = Type.Object({
  status: Type.Union([
    Type.Literal('healthy'),
    Type.Literal('unhealthy'),
    Type.Literal('degraded')
  ]),
  message: Type.String(),
  error: Type.Optional(Type.String()),
  lastChecked: Type.String({ format: 'date-time' })
});

const SystemInfoSchema = Type.Object({
  memory: Type.Object({
    rss: Type.Number(),
    heapTotal: Type.Number(),
    heapUsed: Type.Number(),
    external: Type.Number()
  }),
  uptime: Type.Number(),
  nodeVersion: Type.String(),
  platform: Type.String(),
  arch: Type.String()
});

const DetailedHealthSchema = Type.Object({
  status: Type.Union([
    Type.Literal('healthy'),
    Type.Literal('unhealthy')
  ]),
  timestamp: Type.String({ format: 'date-time' }),
  uptime: Type.Number(),
  version: Type.String(),
  services: Type.Record(Type.String(), ServiceHealthSchema),
  system: SystemInfoSchema
});

const ErrorResponseSchema = Type.Object({
  status: Type.Literal('unhealthy'),
  timestamp: Type.String({ format: 'date-time' }),
  error: Type.String()
});

export default async function healthRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Add TypeBox type provider
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  /**
   * Basic health check
   */
  typedFastify.get('/', {
    schema: {
      description: 'Basic health check endpoint',
      tags: ['Health'],
      response: {
        200: BasicHealthSchema
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

  /**
   * Detailed health check with system status
   */
  typedFastify.get('/detailed', {
    schema: {
      description: 'Detailed health check with system status and service health',
      tags: ['Health'],
      response: {
        200: DetailedHealthSchema,
        500: ErrorResponseSchema
      }
    }
  }, async (request, reply) => {
    try {
      const health = await getSystemHealth();
      
      return {
        status: (health as any).overall ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        services: (health as any).services,
        system: (health as any).system
      };
    } catch (error: any) {
      logger.error('Health check failed:', error);
      return reply.code(500).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  /**
   * Readiness probe for Kubernetes
   */
  typedFastify.get('/ready', {
    schema: {
      description: 'Readiness probe for container orchestration',
      tags: ['Health'],
      response: {
        200: Type.Object({
          status: Type.Literal('ready'),
          timestamp: Type.String({ format: 'date-time' })
        }),
        503: Type.Object({
          status: Type.Literal('not ready'),
          timestamp: Type.String({ format: 'date-time' }),
          reason: Type.String()
        })
      }
    }
  }, async (request, reply) => {
    try {
      // Check if all critical services are ready
      const health = await getSystemHealth();
      
      if ((health as any).overall) {
        return {
          status: 'ready',
          timestamp: new Date().toISOString()
        };
      } else {
        return reply.code(503).send({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'One or more services are unhealthy'
        });
      }
    } catch (error: any) {
      return reply.code(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: error.message
      });
    }
  });

  /**
   * Liveness probe for Kubernetes
   */
  typedFastify.get('/live', {
    schema: {
      description: 'Liveness probe for container orchestration',
      tags: ['Health'],
      response: {
        200: Type.Object({
          status: Type.Literal('alive'),
          timestamp: Type.String({ format: 'date-time' }),
          uptime: Type.Number()
        })
      }
    }
  }, async (request, reply) => {
    // Simple liveness check - if we can respond, we're alive
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });
}
