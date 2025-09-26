/**
 * Validation utilities for the API
 */

export function validateYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

export function validateTimeRange(startTime: number, endTime?: number): boolean {
  if (startTime < 0) return false;
  if (endTime !== undefined && endTime <= startTime) return false;
  return true;
}

export function validateAudioFile(file: File): boolean {
  const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/m4a'];
  const allowedExtensions = ['.wav', '.mp3', '.ogg', '.m4a'];
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  return hasValidType || hasValidExtension;
}
