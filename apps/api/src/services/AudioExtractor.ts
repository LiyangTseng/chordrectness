/**
 * Audio Extractor Service - TypeScript implementation
 * Handles YouTube audio extraction and processing with proper type safety.
 */

import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';
import logger from '../utils/logger';
import { AudioExtractionOptions, AudioInfo } from '../types';

export class AudioExtractor {
  private tempDir: string;

  constructor(tempDir: string = path.join(process.cwd(), 'temp', 'audio')) {
    this.tempDir = tempDir;
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Extract audio segment from YouTube video
   */
  async extractAudioSegment(
    url: string,
    startTime: number,
    endTime?: number
  ): Promise<string> {
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
      await this.extractWithFFmpeg(audioStream, outputPath, startTime, endTime);

      return outputPath;

    } catch (error: any) {
      logger.error('Audio extraction failed:', error);
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }

  /**
   * Extract audio with FFmpeg
   */
  private async extractWithFFmpeg(
    audioStream: Readable,
    outputPath: string,
    startTime: number,
    endTime?: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
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
        .on('error', (error: Error) => {
          logger.error('FFmpeg error:', error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Clean up temporary audio file
   */
  async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up audio file: ${filePath}`);
    } catch (error: any) {
      logger.warn(`Failed to clean up audio file ${filePath}:`, error.message);
    }
  }

  /**
   * Get audio file info using FFprobe
   */
  async getAudioInfo(filePath: string): Promise<AudioInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const stream = metadata.streams[0];
          resolve({
            duration: metadata.format.duration || 0,
            sampleRate: stream.sample_rate || 0,
            channels: stream.channels || 0,
            bitrate: parseInt(String(metadata.format.bit_rate || '0')),
            format: metadata.format.format_name || 'wav'
          });
        }
      });
    });
  }

  /**
   * Extract audio with custom options
   */
  async extractWithOptions(
    url: string,
    options: AudioExtractionOptions
  ): Promise<string> {
    try {
      const info = await ytdl.getInfo(url);
      const videoId = info.videoDetails.videoId;

      const filename = `${videoId}_${uuidv4()}.wav`;
      const outputPath = path.join(this.tempDir, filename);

      const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      await this.extractWithCustomOptions(audioStream, outputPath, options);

      return outputPath;

    } catch (error: any) {
      logger.error('Custom audio extraction failed:', error);
      throw new Error(`Failed to extract audio with custom options: ${error.message}`);
    }
  }

  /**
   * Extract audio with custom FFmpeg options
   */
  private async extractWithCustomOptions(
    audioStream: Readable,
    outputPath: string,
    options: AudioExtractionOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(audioStream)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(22050)
        .format('wav');

      // Add time filters
      if ((options.startTime && options.startTime > 0) || options.endTime) {
        let filter = '';
        if (options.startTime && options.startTime > 0) {
          filter += `atrim=start=${options.startTime}`;
        }
        if (options.endTime) {
          filter += (options.startTime && options.startTime > 0) ? `:end=${options.endTime}` : `atrim=end=${options.endTime}`;
        }
        command = command.audioFilters(filter);
      }

      command
        .on('end', () => {
          logger.info(`Custom audio extraction completed: ${outputPath}`);
          resolve();
        })
        .on('error', (error: Error) => {
          logger.error('Custom FFmpeg error:', error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  /**
   * Get temp directory path
   */
  getTempDir(): string {
    return this.tempDir;
  }

  /**
   * Clean up all temporary files
   */
  async cleanupAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      const deletePromises = files.map(file =>
        fs.unlink(path.join(this.tempDir, file))
      );
      await Promise.all(deletePromises);
      logger.info(`Cleaned up ${files.length} temporary files`);
    } catch (error: any) {
      logger.warn('Failed to clean up temporary files:', error.message);
    }
  }
}
