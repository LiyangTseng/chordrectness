/**
 * Type definitions for the ChordRectness API
 */

export interface AudioExtractionOptions {
  url: string;
  startTime?: number;
  endTime?: number;
  quality?: 'highest' | 'high' | 'medium' | 'low';
}

export interface AudioInfo {
  duration: number;
  bitrate: number;
  sampleRate: number;
  channels: number;
  format: string;
}

export interface ChordResult {
  chord: string;
  confidence: number;
  startTime: number;
  endTime: number;
}

export interface AnalysisResult {
  analysisId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  chords: ChordResult[];
  key: string;
  tempo: number;
  timeSignature: string;
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeAnalysisRequest {
  url: string;
  startTime: number;
  endTime?: number;
  analysisId: string;
}

export interface AudioUploadRequest {
  file: File;
  startTime: number;
  endTime?: number;
  modelType: string;
}

export interface ChordSymbol {
  root: string;
  quality: string;
  extensions: string[];
  bass?: string;
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

export interface MLServiceConfig {
  pythonPath: string;
  modelPath: string;
  timeout: number;
  maxRetries: number;
}

export interface SystemHealth {
  overall: boolean;
  system: SystemInfo;
  services: Record<string, ServiceHealth>;
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
