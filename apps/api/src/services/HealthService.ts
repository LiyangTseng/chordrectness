/**
 * Health Service
 * Provides system health information
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database?: 'healthy' | 'degraded' | 'unhealthy';
    chordAnalyzer?: 'healthy' | 'degraded' | 'unhealthy';
    storage?: 'healthy' | 'degraded' | 'unhealthy';
  };
}

export async function getSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now();

  // Check chord analyzer service
  let chordAnalyzerStatus: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy';
  try {
    const response = await fetch('http://localhost:8001/api/v1/health');
    if (response.ok) {
      chordAnalyzerStatus = 'healthy';
    }
  } catch (error) {
    console.error('Chord analyzer health check failed:', error);
  }

  // Determine overall status
  const status = chordAnalyzerStatus === 'healthy' ? 'healthy' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      chordAnalyzer: chordAnalyzerStatus,
    }
  };
}
