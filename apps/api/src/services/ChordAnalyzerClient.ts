/**
 * Chord Analyzer Client - TypeScript implementation
 * Handles communication with the Python chord analyzer service
 */

import { YouTubeAnalysisRequest, AnalysisResult } from '../types';

export class ChordAnalyzerClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze chords in audio from YouTube URL
   */
  async analyzeChords(request: YouTubeAnalysisRequest): Promise<AnalysisResult> {
    console.log('ChordAnalyzerClient.analyzeChords called with:', request);

    try {
      // For YouTube analysis, we need to find the existing audio file
      // The audio file should already be downloaded via the /api/youtube/download endpoint
      const audioProcessor = new (await import('./AudioProcessor')).AudioProcessor();
      
      // Find the audio file for this YouTube URL
      const audioPath = await this.findYouTubeAudioFile(request.url);
      if (!audioPath) {
        throw new Error('YouTube audio file not found. Please download the audio first.');
      }

      try {
        // Read the existing audio file
        const audioBuffer = await audioProcessor.readAudioFile(audioPath);
        
        // Create FormData for the Python service
        const formData = new FormData();
        const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('start_time', request.startTime.toString());
        if (typeof request.endTime === 'number') {
          formData.append('end_time', request.endTime.toString());
        }
        formData.append('model_type', 'chroma');

        const response = await fetch(`${this.baseUrl}/api/v1/analyze/audio`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Python service responded with status: ${response.status}`);
        }

        const pythonResult = await response.json();
        console.log('Python service response:', JSON.stringify(pythonResult, null, 2));

        const transformedResult = {
          analysisId: request.analysisId,
          status: 'completed' as const,
          progress: 1,
          chords: [{
            chord: pythonResult.chord,
            confidence: pythonResult.confidence,
            startTime: request.startTime,
            endTime: request.endTime || request.startTime + 1
          }],
          key: 'Unknown',
          tempo: 120,
          timeSignature: '4/4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('Transformed result:', JSON.stringify(transformedResult, null, 2));
        return transformedResult;
      } finally {
        // Note: We don't clean up the audio file here since it might be reused
        // The audio file will be cleaned up when the user changes YouTube URLs
        console.log('Analysis completed, keeping audio file for potential reuse');
      }
    } catch (error) {
      console.error('Error calling chord analyzer service:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`Failed to analyze chords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find the audio file for a YouTube URL
   */
  private async findYouTubeAudioFile(url: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const ytdl = await import('ytdl-core');
      
      // Extract video ID from URL
      const videoId = ytdl.default.getVideoID(url);
      const tempDir = path.join(process.cwd(), 'temp', 'audio');
      
      console.log(`Looking for audio file for video ID: ${videoId}`);
      console.log(`Searching in directory: ${tempDir}`);
      
      // List all files in temp directory
      const files = await fs.readdir(tempDir);
      console.log(`Found ${files.length} files in temp directory:`, files);
      
      // Find the most recent file for this video ID or ytdlp files
      const audioFiles = files
        .filter(file => (file.includes(videoId) || file.startsWith('ytdlp_')) && file.endsWith('.wav'))
        .map(file => ({
          name: file,
          path: path.join(tempDir, file),
          mtime: 0 // We'll get this if needed
        }))
        .sort((a, b) => b.name.localeCompare(a.name)); // Sort by name (which includes timestamp)
      
      console.log(`Found ${audioFiles.length} audio files for video ID ${videoId}:`, audioFiles);
      
      return audioFiles.length > 0 ? audioFiles[0].path : null;
    } catch (error) {
      console.error('Error finding YouTube audio file:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }
  }

  /**
   * Check if the chord analyzer service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}