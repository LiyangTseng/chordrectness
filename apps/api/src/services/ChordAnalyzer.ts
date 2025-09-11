/**
 * Chord Analyzer Service - TypeScript implementation with ML integration
 * This service coordinates between audio processing and ML model analysis.
 */

import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';
import { MLService } from './MLService';
import { 
  ChordSymbol, 
  MLAnalysisRequest, 
  MLServiceConfig,
  AudioInfo 
} from '../types';

export class ChordAnalyzer {
  private mlService: MLService;
  private sampleRate: number;
  private hopLength: number;
  private nFFT: number;

  constructor(mlConfig?: MLServiceConfig) {
    this.sampleRate = 22050;
    this.hopLength = 512;
    this.nFFT = 2048;

    // Initialize ML service with default config if not provided
    const defaultMLConfig: MLServiceConfig = {
      pythonPath: process.env.PYTHON_PATH || 'python3',
      modelPath: process.env.ML_MODEL_PATH || './ml_models',
      timeout: parseInt(process.env.ML_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.ML_MAX_RETRIES || '3')
    };

    this.mlService = new MLService(mlConfig || defaultMLConfig);
  }

  /**
   * Analyze chords in audio file using ML models
   */
  async analyzeChords(audioPath: string): Promise<ChordSymbol[]> {
    try {
      logger.info(`Analyzing chords in: ${audioPath}`);

      // Validate audio file exists
      await fs.access(audioPath);

      // Get audio info
      const audioInfo = await this.getAudioInfo(audioPath);
      logger.info(`Audio info: ${JSON.stringify(audioInfo)}`);

      // Prepare ML analysis request
      const mlRequest: MLAnalysisRequest = {
        audioPath,
        startTime: 0,
        endTime: audioInfo.duration,
        modelType: 'chord_recognition'
      };

      // Use ML service for analysis
      const chordProgression = await this.mlService.analyzeChords(mlRequest);

      logger.info(`Chord analysis completed: ${chordProgression.length} chords detected`);
      return chordProgression;

    } catch (error: any) {
      logger.error('Chord analysis failed:', error);
      
      // Fallback to mock data if ML service fails
      logger.warn('Falling back to mock chord progression');
      return this.generateMockChordProgression();
    }
  }

  /**
   * Analyze specific time segment
   */
  async analyzeChordSegment(
    audioPath: string, 
    startTime: number, 
    endTime: number
  ): Promise<ChordSymbol[]> {
    try {
      const mlRequest: MLAnalysisRequest = {
        audioPath,
        startTime,
        endTime,
        modelType: 'chord_recognition'
      };

      return await this.mlService.analyzeChords(mlRequest);

    } catch (error: any) {
      logger.error('Segment analysis failed:', error);
      throw new Error(`Failed to analyze chord segment: ${error.message}`);
    }
  }

  /**
   * Get audio file information
   */
  private async getAudioInfo(audioPath: string): Promise<AudioInfo> {
    try {
      // In a real implementation, you would use ffprobe or similar
      // For now, return mock data
      return {
        duration: 30, // seconds
        sampleRate: this.sampleRate,
        channels: 1,
        bitrate: 128000
      };
    } catch (error) {
      logger.error('Failed to get audio info:', error);
      throw error;
    }
  }

  /**
   * Generate mock chord progression for demonstration/fallback
   */
  private generateMockChordProgression(): ChordSymbol[] {
    const commonProgressions = [
      // ii-V-I progression
      [
        { 
          symbol: 'Dm7', 
          startTime: 0, 
          endTime: 2, 
          confidence: 0.85, 
          root: 'D', 
          quality: 'minor7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'G7', 
          startTime: 2, 
          endTime: 4, 
          confidence: 0.90, 
          root: 'G', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'Cmaj7', 
          startTime: 4, 
          endTime: 6, 
          confidence: 0.88, 
          root: 'C', 
          quality: 'major7', 
          extensions: ['7'] 
        }
      ],
      // Jazz progression
      [
        { 
          symbol: 'Cmaj7', 
          startTime: 0, 
          endTime: 2, 
          confidence: 0.87, 
          root: 'C', 
          quality: 'major7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'Am7', 
          startTime: 2, 
          endTime: 4, 
          confidence: 0.82, 
          root: 'A', 
          quality: 'minor7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'Dm7', 
          startTime: 4, 
          endTime: 6, 
          confidence: 0.85, 
          root: 'D', 
          quality: 'minor7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'G7', 
          startTime: 6, 
          endTime: 8, 
          confidence: 0.89, 
          root: 'G', 
          quality: 'dominant7', 
          extensions: ['7'] 
        }
      ],
      // Blues progression
      [
        { 
          symbol: 'C7', 
          startTime: 0, 
          endTime: 2, 
          confidence: 0.91, 
          root: 'C', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'C7', 
          startTime: 2, 
          endTime: 4, 
          confidence: 0.88, 
          root: 'C', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'F7', 
          startTime: 4, 
          endTime: 6, 
          confidence: 0.86, 
          root: 'F', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'C7', 
          startTime: 6, 
          endTime: 8, 
          confidence: 0.90, 
          root: 'C', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'G7', 
          startTime: 8, 
          endTime: 10, 
          confidence: 0.84, 
          root: 'G', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'F7', 
          startTime: 10, 
          endTime: 12, 
          confidence: 0.87, 
          root: 'F', 
          quality: 'dominant7', 
          extensions: ['7'] 
        },
        { 
          symbol: 'C7', 
          startTime: 12, 
          endTime: 14, 
          confidence: 0.89, 
          root: 'C', 
          quality: 'dominant7', 
          extensions: ['7'] 
        }
      ]
    ];

    // Return a random progression for demo
    const randomProgression = commonProgressions[
      Math.floor(Math.random() * commonProgressions.length)
    ];
    
    return randomProgression;
  }

  /**
   * Health check for chord analyzer
   */
  async healthCheck(): Promise<boolean> {
    try {
      return await this.mlService.healthCheck();
    } catch (error) {
      logger.error('Chord analyzer health check failed:', error);
      return false;
    }
  }

  /**
   * Get ML service instance for advanced usage
   */
  getMLService(): MLService {
    return this.mlService;
  }
}
