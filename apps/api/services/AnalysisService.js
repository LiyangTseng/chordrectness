/**
 * Analysis Service - Main service for coordinating chord analysis
 */

const { v4: uuidv4 } = require('uuid');
const AudioExtractor = require('./AudioExtractor');
const ChordAnalyzer = require('./ChordAnalyzer');
const logger = require('../utils/logger');

class AnalysisService {
  constructor() {
    this.audioExtractor = new AudioExtractor();
    this.chordAnalyzer = new ChordAnalyzer();
    this.analyses = new Map(); // In-memory storage for demo
  }

  /**
   * Start a new chord analysis
   */
  async startAnalysis({ url, startTime, endTime, analysisId }) {
    const id = analysisId || uuidv4();
    
    // Initialize analysis record
    const analysis = {
      id,
      url,
      startTime,
      endTime,
      status: 'processing',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      result: null,
      error: null
    };

    this.analyses.set(id, analysis);

    // Start background processing
    this.processAnalysis(id).catch(error => {
      logger.error(`Analysis ${id} failed:`, error);
      this.analyses.get(id).status = 'error';
      this.analyses.get(id).error = error.message;
      this.analyses.get(id).updatedAt = new Date();
    });

    return {
      analysisId: id,
      status: 'processing',
      message: 'Analysis started successfully'
    };
  }

  /**
   * Process analysis in background
   */
  async processAnalysis(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    try {
      logger.info(`Processing analysis ${analysisId}`);

      // Step 1: Extract audio
      analysis.progress = 0.1;
      analysis.updatedAt = new Date();
      
      const audioPath = await this.audioExtractor.extractAudioSegment(
        analysis.url,
        analysis.startTime,
        analysis.endTime
      );

      analysis.progress = 0.4;
      analysis.updatedAt = new Date();

      // Step 2: Analyze chords
      const chordProgression = await this.chordAnalyzer.analyzeChords(audioPath);

      analysis.progress = 0.8;
      analysis.updatedAt = new Date();

      // Step 3: Create result
      const result = {
        videoUrl: analysis.url,
        startTime: analysis.startTime,
        endTime: analysis.endTime,
        chordProgression,
        analysisDuration: analysis.endTime ? analysis.endTime - analysis.startTime : null,
        confidenceScores: chordProgression.map(chord => chord.confidence),
        averageConfidence: chordProgression.reduce((sum, chord) => sum + chord.confidence, 0) / chordProgression.length,
        createdAt: new Date()
      };

      // Update analysis
      analysis.status = 'completed';
      analysis.progress = 1.0;
      analysis.result = result;
      analysis.updatedAt = new Date();

      logger.info(`Analysis ${analysisId} completed successfully`);

      // Cleanup audio file
      await this.audioExtractor.cleanup(audioPath);

    } catch (error) {
      analysis.status = 'error';
      analysis.error = error.message;
      analysis.updatedAt = new Date();
      throw error;
    }
  }

  /**
   * Get analysis status
   */
  getAnalysisStatus(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      return null;
    }

    return {
      analysisId: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      error: analysis.error
    };
  }

  /**
   * Get analysis result
   */
  getAnalysisResult(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis || analysis.status !== 'completed') {
      return null;
    }

    return analysis.result;
  }

  /**
   * Cancel analysis
   */
  cancelAnalysis(analysisId) {
    const analysis = this.analyses.get(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    if (analysis.status === 'processing') {
      analysis.status = 'cancelled';
      analysis.updatedAt = new Date();
    }

    return {
      analysisId,
      status: analysis.status,
      message: 'Analysis cancelled'
    };
  }

  /**
   * Get recent analyses
   */
  getRecentAnalyses({ limit = 10, offset = 0 }) {
    const allAnalyses = Array.from(this.analyses.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(offset, offset + limit);

    return allAnalyses.map(analysis => ({
      analysisId: analysis.id,
      url: analysis.url,
      startTime: analysis.startTime,
      endTime: analysis.endTime,
      status: analysis.status,
      progress: analysis.progress,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt
    }));
  }
}

module.exports = AnalysisService;
