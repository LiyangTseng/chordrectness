import * as fs from 'fs';
import * as path from 'path';
import ytdl from 'ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import { spawn } from 'child_process';

export interface AudioExtractionResult {
  audioPath: string;
  duration: number;
  sampleRate: number;
}

export class AudioProcessor {
  private readonly tempDir = path.join(process.cwd(), 'temp', 'audio');

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Extract full audio from YouTube URL (no time restrictions)
   */
  async extractAudioFromYouTube(
    url: string,
    startTime?: number,
    endTime?: number
  ): Promise<AudioExtractionResult> {
    try {
      console.log(`Extracting full audio from YouTube URL: ${url}`);

      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      console.log('YouTube URL is valid, getting video info...');

      // Get video info
      const info = await ytdl.getInfo(url);
      const videoId = info.videoDetails.videoId;
      const videoDuration = parseInt(info.videoDetails.lengthSeconds);

      console.log(`Video ID: ${videoId}, Title: ${info.videoDetails.title}, Duration: ${videoDuration}s`);

      // Generate output filename
      const timestamp = Date.now();
      const outputPath = path.join(this.tempDir, `${videoId}_${timestamp}.wav`);

      // Extract audio using ytdl-core and ffmpeg
      const audioStream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      return new Promise((resolve, reject) => {
        let duration = 0;

        ffmpeg(audioStream)
          .audioCodec('pcm_s16le')
          .audioFrequency(44100)
          .audioChannels(1)
          .format('wav')
          .on('start', (commandLine: string) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress: any) => {
            if (progress.timemark) {
              // Parse duration from timemark (HH:MM:SS.mmm format)
              const timeParts = progress.timemark.split(':');
              duration = parseInt(timeParts[0]) * 3600 +
                        parseInt(timeParts[1]) * 60 +
                        parseFloat(timeParts[2]);
            }
          })
          .on('end', () => {
            console.log('Full audio extraction completed');
            resolve({
              audioPath: outputPath,
              duration: duration || videoDuration,
              sampleRate: 44100
            });
          })
          .on('error', (err: Error) => {
            console.error('FFmpeg error:', err);
            reject(new Error(`Audio extraction failed: ${err.message}`));
          })
          .save(outputPath);
      });

    } catch (error) {
      console.log('ytdl-core failed, trying yt-dlp fallback...');
      return this.extractAudioWithYtDlp(url, startTime, endTime);
    }
  }

  /**
   * Extract full audio using yt-dlp as fallback
   */
  private async extractAudioWithYtDlp(
    url: string,
    startTime?: number,
    endTime?: number
  ): Promise<AudioExtractionResult> {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const outputPath = path.join(this.tempDir, `ytdlp_${timestamp}.wav`);

      console.log(`Using yt-dlp to extract full audio from: ${url}`);

      // Build yt-dlp command - download full video
      const args = [
        url,
        '--extract-audio',
        '--audio-format', 'wav',
        '--audio-quality', '0',
        '--output', outputPath.replace('.wav', '.%(ext)s'),
        '--no-playlist'
      ];

      const ytdlp = spawn('yt-dlp', args);

      ytdlp.on('close', (code) => {
        if (code === 0) {
          console.log('yt-dlp full extraction completed successfully');
          // Get video duration from yt-dlp output or use a default
          resolve({
            audioPath: outputPath,
            duration: 300, // Default 5 minutes, will be updated by frontend
            sampleRate: 44100
          });
        } else {
          reject(new Error(`yt-dlp failed with code ${code}`));
        }
      });

      ytdlp.on('error', (error) => {
        reject(new Error(`yt-dlp error: ${error.message}`));
      });

      ytdlp.stderr.on('data', (data) => {
        console.log('yt-dlp stderr:', data.toString());
      });
    });
  }

  /**
   * Read audio file and return buffer
   */
  async readAudioFile(audioPath: string): Promise<Buffer> {
    try {
      return fs.readFileSync(audioPath);
    } catch (error) {
      throw new Error(`Failed to read audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up temporary audio files
   */
  async cleanup(audioPath: string): Promise<void> {
    try {
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log(`Cleaned up audio file: ${audioPath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get audio file info
   */
  async getAudioInfo(audioPath: string): Promise<{ duration: number; sampleRate: number; channels: number }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get audio info: ${err.message}`));
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');
        if (!audioStream) {
          reject(new Error('No audio stream found'));
          return;
        }

        resolve({
          duration: parseFloat(audioStream.duration || '0'),
          sampleRate: parseInt(audioStream.sample_rate?.toString() || '44100'),
          channels: audioStream.channels || 1
        });
      });
    });
  }
}

