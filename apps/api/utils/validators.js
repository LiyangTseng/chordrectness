/**
 * Validation utilities
 */

/**
 * Validate YouTube URL
 */
function validateYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

/**
 * Validate time format (HH:MM:SS or seconds)
 */
function validateTimeFormat(time) {
  if (typeof time === 'number') {
    return time >= 0;
  }
  
  if (typeof time === 'string') {
    // Check HH:MM:SS format
    const timeRegex = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;
    return timeRegex.test(time);
  }
  
  return false;
}

/**
 * Convert time string to seconds
 */
function timeStringToSeconds(timeString) {
  if (typeof timeString === 'number') {
    return timeString;
  }
  
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return parseFloat(timeString) || 0;
}

/**
 * Validate analysis ID format
 */
function validateAnalysisId(id) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

module.exports = {
  validateYouTubeUrl,
  validateTimeFormat,
  timeStringToSeconds,
  validateAnalysisId
};
