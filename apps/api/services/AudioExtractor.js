/**
 * Audio Extractor Service - Handles YouTube audio extraction and processing
 */

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AudioExtractor {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'audio');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Extract audio segment from YouTube video
   */
  async extractAudioSegment(url, startTime, endTime) {
    try {
      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const videoId = info.videoDetails.videoId;
      
      logger.info(`Extracting audio from video: ${info.videoDetails.title}`);

      // Generate unique filename
      const filename = `${videoId}_${uuidv4()}.wav`;
      const outputPath = path.join(this.tempDir, filename);

      // Create audio stream
      const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      // Extract segment using ffmpeg
      await new Promise((resolve, reject) => {
        let command = ffmpeg(audioStream)
          .audioCodec('pcm_s16le')
          .audioChannels(1) // Mono
          .audioFrequency(22050) // 22.05kHz sample rate
          .format('wav');

        // Add time filters if needed
        if (startTime > 0 || endTime) {
          let filter = '';
          if (startTime > 0) {
            filter += `atrim=start=${startTime}`;
          }
          if (endTime) {
            filter += startTime > 0 ? `:end=${endTime}` : `atrim=end=${endTime}`;
          }
          command = command.audioFilters(filter);
        }

        command
          .on('end', () => {
            logger.info(`Audio extraction completed: ${outputPath}`);
            resolve();
          })
          .on('error', (error) => {
            logger.error('FFmpeg error:', error);
            reject(error);
          })
          .save(outputPath);
      });

      return outputPath;

    } catch (error) {
      logger.error('Audio extraction failed:', error);
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }

  /**
   * Clean up temporary audio file
   */
  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up audio file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to clean up audio file ${filePath}:`, error.message);
    }
  }

  /**
   * Get audio file info
   */
  async getAudioInfo(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            duration: metadata.format.duration,
            sampleRate: metadata.streams[0].sample_rate,
            channels: metadata.streams[0].channels,
            bitrate: metadata.format.bit_rate
          });
        }
      });
    });
  }
}

module.exports = AudioExtractor;
