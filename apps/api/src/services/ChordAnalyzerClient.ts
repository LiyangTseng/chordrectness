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
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chord analyzer service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Chord analyzer service health check failed:', error);
      return false;
    }
  }
}
