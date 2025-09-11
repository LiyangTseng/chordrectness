import * as fs from 'fs';
import * as path from 'path';
import * as ytdl from 'ytdl-core';
import * as ffmpeg from 'fluent-ffmpeg';

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
   * Extract audio from YouTube URL
   */
  async extractAudioFromYouTube(
    url: string, 
    startTime: number, 
    endTime?: number
  ): Promise<AudioExtractionResult> {
    try {
      // Validate YouTube URL
      if (!ytdl.validateURL(url)) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video info
      const info = await ytdl.getInfo(url);
      const videoId = info.videoDetails.videoId;
      
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
          .seekInput(startTime)
          .duration(endTime ? endTime - startTime : undefined)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            if (progress.timemark) {
              // Parse duration from timemark (HH:MM:SS.mmm format)
              const timeParts = progress.timemark.split(':');
              duration = parseInt(timeParts[0]) * 3600 + 
                        parseInt(timeParts[1]) * 60 + 
                        parseFloat(timeParts[2]);
            }
          })
          .on('end', () => {
            console.log('Audio extraction completed');
            resolve({
              audioPath: outputPath,
              duration: duration || (endTime ? endTime - startTime : 60),
              sampleRate: 44100
            });
          })
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(new Error(`Audio extraction failed: ${err.message}`));
          })
          .save(outputPath);
      });

    } catch (error) {
      throw new Error(`Failed to extract audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
          sampleRate: parseInt(audioStream.sample_rate || '44100'),
          channels: audioStream.channels || 1
        });
      });
    });
  }
}

