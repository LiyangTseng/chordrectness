/**
 * TypeScript type definitions for the chord recognition system
 */

// Analysis related types
export interface AnalysisRequest {
  url: string;
  startTime: number;
  endTime?: number;
  analysisId?: string;
}

export interface AnalysisStatus {
  analysisId: string;
  status: 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface ChordSymbol {
  symbol: string;
  startTime: number;
  endTime: number;
  confidence: number;
  root: string;
  quality: string;
  extensions: string[];
}

export interface AnalysisResult {
  videoUrl: string;
  startTime: number;
  endTime?: number;
  chordProgression: ChordSymbol[];
  analysisDuration?: number;
  confidenceScores: number[];
  averageConfidence: number;
  keySignature?: string;
  tempo?: number;
  createdAt: Date;
}

// ML Service types
export interface MLServiceConfig {
  pythonPath: string;
  modelPath: string;
  timeout: number;
  maxRetries: number;
}

export interface MLAnalysisRequest {
  audioPath: string;
  startTime: number;
  endTime?: number;
  modelType: 'chord_recognition' | 'key_detection' | 'tempo_analysis';
}

export interface MLAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

// Audio processing types
export interface AudioInfo {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate: number;
}

export interface AudioExtractionOptions {
  startTime: number;
  endTime?: number;
  sampleRate?: number;
  channels?: number;
  format?: 'wav' | 'mp3' | 'flac';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Health check types
export interface HealthStatus {
  overall: boolean;
  services: Record<string, ServiceHealth>;
  system: SystemInfo;
  timestamp: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message: string;
  error?: string;
  lastChecked: Date;
}

export interface SystemInfo {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
  arch: string;
}

// Error types
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Configuration types
export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  clientUrl: string;
  logLevel: string;
  redisUrl?: string;
  tempDir: string;
  maxFileSize: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  youtubeApiKey?: string;
  audioSampleRate: number;
  audioChannels: number;
  audioBitrate: string;
}

// Fastify types extensions
declare global {
  namespace Fastify {
    interface FastifyRequest {
      user?: any;
      analysisId?: string;
    }
  }
}
