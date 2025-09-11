/**
 * ML Service - Integration with Python-based ML models
 * This service demonstrates different approaches to integrate TypeScript/Node.js
 * with Python ML models for chord recognition.
 */

import { spawn, ChildProcess } from 'child_process';
import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';
import { 
  MLServiceConfig, 
  MLAnalysisRequest, 
  MLAnalysisResponse, 
  ChordSymbol 
} from '../types';

export class MLService {
  private config: MLServiceConfig;
  private pythonServiceUrl?: string;

  constructor(config: MLServiceConfig) {
    this.config = config;
  }

  /**
   * Method 1: HTTP API Integration
   * Best for: Production, microservices, scalable deployments
   * 
   * Your Python ML service runs as a separate HTTP API (FastAPI/Flask)
   * and this service makes HTTP requests to it.
   */
  async analyzeViaHTTP(request: MLAnalysisRequest): Promise<MLAnalysisResponse> {
    try {
      const startTime = Date.now();
      
      // Make HTTP request to Python ML service
      const response: AxiosResponse = await axios.post(
        `${this.pythonServiceUrl}/analyze`,
        {
          audio_path: request.audioPath,
          start_time: request.startTime,
          end_time: request.endTime,
          model_type: request.modelType
        },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        processingTime
      };

    } catch (error: any) {
      logger.error('HTTP ML analysis failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Method 2: Child Process Integration
   * Best for: Simple deployments, development, single-server setups
   * 
   * Spawns Python processes directly from Node.js
   */
  async analyzeViaChildProcess(request: MLAnalysisRequest): Promise<MLAnalysisResponse> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Spawn Python process
      const pythonProcess: ChildProcess = spawn(
        this.config.pythonPath,
        [
          path.join(this.config.modelPath, 'chord_analyzer.py'),
          '--audio-path', request.audioPath,
          '--start-time', request.startTime.toString(),
          '--end-time', request.endTime?.toString() || '',
          '--model-type', request.modelType
        ],
        {
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      pythonProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code: number) => {
        const processingTime = Date.now() - startTime;

        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve({
              success: true,
              data: result,
              processingTime
            });
          } catch (parseError) {
            resolve({
              success: false,
              error: 'Failed to parse Python output',
              processingTime
            });
          }
        } else {
          resolve({
            success: false,
            error: stderr || `Python process exited with code ${code}`,
            processingTime
          });
        }
      });

      pythonProcess.on('error', (error: Error) => {
        const processingTime = Date.now() - startTime;
        resolve({
          success: false,
          error: error.message,
          processingTime
        });
      });

      // Set timeout
      setTimeout(() => {
        pythonProcess.kill();
        resolve({
          success: false,
          error: 'Python process timeout',
          processingTime: this.config.timeout
        });
      }, this.config.timeout);
    });
  }

  /**
   * Method 3: gRPC Integration
   * Best for: High-performance, real-time applications
   * 
   * Uses gRPC for efficient communication between services
   */
  async analyzeViaGRPC(request: MLAnalysisRequest): Promise<MLAnalysisResponse> {
    try {
      const startTime = Date.now();
      
      // This would require gRPC client setup
      // const client = new ChordAnalysisClient('localhost:50051');
      // const response = await client.analyzeChord(request);
      
      // For now, return a placeholder
      logger.info('gRPC integration not implemented yet');
      
      return {
        success: false,
        error: 'gRPC integration not implemented',
        processingTime: Date.now() - startTime
      };

    } catch (error: any) {
      logger.error('gRPC ML analysis failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Method 4: Message Queue Integration
   * Best for: Asynchronous processing, high throughput
   * 
   * Uses Redis/RabbitMQ to queue analysis requests
   */
  async analyzeViaMessageQueue(request: MLAnalysisRequest): Promise<MLAnalysisResponse> {
    try {
      const startTime = Date.now();
      
      // This would require Redis/Bull queue setup
      // const job = await analysisQueue.add('chord-analysis', request);
      // const result = await job.finished();
      
      logger.info('Message queue integration not implemented yet');
      
      return {
        success: false,
        error: 'Message queue integration not implemented',
        processingTime: Date.now() - startTime
      };

    } catch (error: any) {
      logger.error('Message queue ML analysis failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: 0
      };
    }
  }

  /**
   * Main analysis method that chooses the best integration approach
   */
  async analyzeChords(request: MLAnalysisRequest): Promise<ChordSymbol[]> {
    let response: MLAnalysisResponse;

    // Try different methods in order of preference
    if (this.pythonServiceUrl) {
      response = await this.analyzeViaHTTP(request);
    } else {
      response = await this.analyzeViaChildProcess(request);
    }

    if (!response.success) {
      throw new Error(`ML analysis failed: ${response.error}`);
    }

    // Transform Python response to our TypeScript types
    return this.transformMLResponse(response.data);
  }

  /**
   * Transform Python ML response to TypeScript types
   */
  private transformMLResponse(data: any): ChordSymbol[] {
    // This would transform the Python response format to our ChordSymbol interface
    // Example transformation:
    return data.chords?.map((chord: any) => ({
      symbol: chord.symbol,
      startTime: chord.start_time,
      endTime: chord.end_time,
      confidence: chord.confidence,
      root: chord.root,
      quality: chord.quality,
      extensions: chord.extensions || []
    })) || [];
  }

  /**
   * Set Python service URL for HTTP integration
   */
  setPythonServiceUrl(url: string): void {
    this.pythonServiceUrl = url;
  }

  /**
   * Health check for ML service
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.pythonServiceUrl) {
        const response = await axios.get(`${this.pythonServiceUrl}/health`, {
          timeout: 5000
        });
        return response.status === 200;
      } else {
        // Check if Python script exists and is executable
        await fs.access(path.join(this.config.modelPath, 'chord_analyzer.py'));
        return true;
      }
    } catch (error) {
      logger.error('ML service health check failed:', error);
      return false;
    }
  }
}
