import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { StorageService, PutObjectInput } from '../storage/storage.service';
import { randomUUID } from 'crypto';
import { join, extname, basename } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, rmdirSync, createReadStream } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getContentType } from '../storage/storage.constants';

const execFileAsync = promisify(execFile);

export interface HlsConversionResult {
  videoId: string;
  originalKey: string;
  hlsManifestKey: string;
  hlsUrl: string;
  segmentCount: number;
}

@Injectable()
export class HlsService {
  private readonly logger = new Logger(HlsService.name);
  private readonly tempDir = join(process.cwd(), 'tmp', 'hls');

  constructor(private readonly storageService: StorageService) {
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Convert an uploaded video file to HLS and upload everything to S3/MinIO.
   *
   * @param filePath - Local path to the uploaded video file
   * @param originalName - Original filename from the upload
   * @returns HLS conversion result with S3 keys and public URL
   */
  async convertAndUpload(filePath: string, originalName: string): Promise<HlsConversionResult> {
    const videoId = randomUUID();
    const ext = extname(originalName).toLowerCase();
    const originalKey = `videos/original/${videoId}${ext}`;
    const hlsDir = join(this.tempDir, videoId);
    let hlsKeys: string[] = [];

    try {
      if (!existsSync(filePath)) {
        throw new Error(`Input file not found: ${filePath}`);
      }

      // 1. Upload original to S3
      await this.storageService.putObject({
        key: originalKey,
        body: createReadStream(filePath),
        contentType: getContentType(originalName),
      });
      this.logger.log(`Uploaded original video: ${originalKey}`);

      // 2. Create temp output dir for HLS segments
      if (!existsSync(hlsDir)) {
        mkdirSync(hlsDir, { recursive: true });
      }

      // 3. Run ffmpeg to convert to HLS
      const manifestPath = join(hlsDir, 'index.m3u8');
      const segmentPattern = join(hlsDir, 'segment_%03d.ts');

      await execFileAsync('ffmpeg', [
        '-i', filePath,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ac', '2',
        '-start_number', '0',
        '-hls_time', '10',          // 10-second segments
        '-hls_list_size', '0',      // Include all segments in playlist
        '-hls_flags', 'independent_segments',
        '-hls_segment_filename', segmentPattern,
        '-f', 'hls',
        manifestPath,
      ], {
        timeout: 600_000, // 10 minute timeout
      });

      this.logger.log(`ffmpeg HLS conversion complete for video ${videoId}`);

      // 4. Upload all HLS files to S3
      const hlsFiles = readdirSync(hlsDir);
      const uploads: PutObjectInput[] = hlsFiles.map((file) => ({
        key: `hls/${videoId}/${file}`,
        body: readFileSync(join(hlsDir, file)),
        contentType: getContentType(file),
      }));
      hlsKeys = uploads.map((upload) => upload.key);

      await this.storageService.putManyObjects(uploads);
      this.logger.log(`Uploaded ${uploads.length} HLS files for video ${videoId}`);

      const hlsManifestKey = `hls/${videoId}/index.m3u8`;
      const hlsUrl = this.storageService.getPublicUrl(hlsManifestKey);
      const segmentCount = hlsFiles.filter((f) => f.endsWith('.ts')).length;

      return {
        videoId,
        originalKey,
        hlsManifestKey,
        hlsUrl,
        segmentCount,
      };
    } catch (error) {
      this.logger.error(`HLS conversion failed for ${originalName}: ${(error as Error).message}`);
      // Attempt cleanup of any partial S3 uploads
      try {
        await this.storageService.deleteObject(originalKey);
      } catch { /* ignore cleanup errors */ }
      try {
        if (hlsKeys.length > 0) {
          await this.storageService.deleteObjects(hlsKeys);
        }
      } catch { /* ignore cleanup errors */ }
      throw new InternalServerErrorException(
        `Video conversion failed: ${(error as Error).message}`,
      );
    } finally {
      // Always clean up temp files
      this.cleanupTempDir(hlsDir);
      this.cleanupFile(filePath);
    }
  }

  /**
   * Convert a video that was uploaded directly to S3 (via presigned URL).
   * Downloads from S3 → converts locally → uploads HLS back to S3.
   *
   * @param s3Key - The S3 key of the uploaded video
   * @param originalName - Original filename from the upload
   * @returns HLS conversion result with S3 keys and public URL
   */
  async convertFromS3AndUpload(s3Key: string, originalName: string): Promise<HlsConversionResult> {
    const videoId = randomUUID();
    const ext = extname(originalName).toLowerCase() || '.mp4';
    const tempFilePath = join(this.tempDir, `${videoId}${ext}`);

    try {
      // 1. Download from S3 to temp file
      this.logger.log(`Downloading ${s3Key} from S3 for HLS conversion...`);
      await this.storageService.downloadToFile(s3Key, tempFilePath);
      this.logger.log(`Downloaded ${s3Key} to ${tempFilePath}`);

      // 2. Use existing conversion logic (but skip re-uploading original since it's already on S3)
      const hlsDir = join(this.tempDir, videoId);
      let hlsKeys: string[] = [];

      if (!existsSync(hlsDir)) {
        mkdirSync(hlsDir, { recursive: true });
      }

      // 3. Run ffmpeg to convert to HLS
      const manifestPath = join(hlsDir, 'index.m3u8');
      const segmentPattern = join(hlsDir, 'segment_%03d.ts');

      await execFileAsync('ffmpeg', [
        '-i', tempFilePath,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-threads', '1', // Limit CPU/RAM on low-memory VPS
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ac', '2',
        '-start_number', '0',
        '-hls_time', '10',
        '-hls_list_size', '0',
        '-hls_flags', 'independent_segments',
        '-hls_segment_filename', segmentPattern,
        '-f', 'hls',
        manifestPath,
      ], {
        timeout: 600_000,
      });

      this.logger.log(`ffmpeg HLS conversion complete for video ${videoId}`);

      // 4. Upload HLS files to S3
      const hlsFiles = readdirSync(hlsDir);
      const uploads: PutObjectInput[] = hlsFiles.map((file) => ({
        key: `hls/${videoId}/${file}`,
        body: readFileSync(join(hlsDir, file)),
        contentType: getContentType(file),
      }));
      hlsKeys = uploads.map((upload) => upload.key);

      await this.storageService.putManyObjects(uploads);
      this.logger.log(`Uploaded ${uploads.length} HLS files for video ${videoId}`);

      const hlsManifestKey = `hls/${videoId}/index.m3u8`;
      const hlsUrl = this.storageService.getPublicUrl(hlsManifestKey);
      const segmentCount = hlsFiles.filter((f) => f.endsWith('.ts')).length;

      return {
        videoId,
        originalKey: s3Key, // Already on S3, use as-is
        hlsManifestKey,
        hlsUrl,
        segmentCount,
      };
    } catch (error) {
      this.logger.error(`HLS conversion from S3 failed for ${originalName}: ${(error as Error).message}`);
      try {
        await this.storageService.deletePrefix(`hls/${videoId}/`);
      } catch { /* ignore cleanup errors */ }
      throw new InternalServerErrorException(
        `Video conversion failed: ${(error as Error).message}`,
      );
    } finally {
      this.cleanupFile(tempFilePath);
      this.cleanupTempDir(join(this.tempDir, videoId));
    }
  }

  private cleanupTempDir(dir: string): void {
    try {
      if (existsSync(dir)) {
        for (const file of readdirSync(dir)) {
          unlinkSync(join(dir, file));
        }
        rmdirSync(dir);
      }
    } catch (err) {
      this.logger.warn(`Failed to cleanup temp dir ${dir}: ${(err as Error).message}`);
    }
  }

  private cleanupFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${(err as Error).message}`);
    }
  }
}
