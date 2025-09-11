/**
 * Client for communicating with the Python chord-analyzer service
 */

export interface ChordAnalysisRequest {
  url: string;
  start_time: number;
  end_time?: number;
  analysis_id: string;
}

export interface ChordResult {
  chord: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

export interface ChordAnalysisResponse {
  analysis_id: string;
  status: string;
  chords: ChordResult[];
  key: string;
  tempo: number;
  time_signature: string;
}

export class ChordAnalyzerClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://chord-analyzer:8001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Analyze chords in audio from YouTube URL
   */
  async analyzeChords(request: ChordAnalysisRequest): Promise<ChordAnalysisResponse> {
    try {
      // First extract audio from YouTube using our AudioProcessor
      const audioProcessor = new (await import('./AudioProcessor')).AudioProcessor();
      const audioResult = await audioProcessor.extractAudioFromYouTube(
        request.url,
        request.start_time,
        request.end_time
      );

      // Then send the audio file to the Python service
      const formData = new FormData();
      const audioBuffer = await audioProcessor.readAudioFile(audioResult.audioPath);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('start_time', request.start_time.toString());
      if (request.end_time) {
        formData.append('end_time', request.end_time.toString());
      }
      formData.append('model_type', 'chroma');

      const response = await fetch(`${this.baseUrl}/api/v1/analyze/audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chord analyzer service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      // Clean up the audio file
      await audioProcessor.cleanup(audioResult.audioPath);

      // Transform the result to match our expected format
      return {
        analysis_id: request.analysis_id,
        status: 'completed',
        chords: [{
          chord: result.chord,
          confidence: result.confidence,
          start_time: request.start_time,
          end_time: request.end_time || request.start_time + 1
        }],
        key: 'Unknown',
        tempo: 120,
        time_signature: '4/4'
      };
    } catch (error) {
      console.error('Error calling chord analyzer service:', error);
      throw new Error(`Failed to analyze chords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if the chord analyzer service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`);
      return response.ok;
    } catch (error) {
      console.error('Chord analyzer service health check failed:', error);
      return false;
    }
  }
}
