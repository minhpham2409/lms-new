import { Injectable, BadRequestException } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

/** Allowed MIME types per upload category. */
const ALLOWED_MIMES: Record<string, string[]> = {
  videos: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  files: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'text/plain',
  ],
};

/** Max file sizes in bytes per category. */
const MAX_SIZE: Record<string, number> = {
  videos: 500 * 1024 * 1024,  // 500 MB
  images: 10 * 1024 * 1024,   // 10 MB
  files: 50 * 1024 * 1024,    // 50 MB
};

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directories exist
    for (const sub of ['videos', 'images', 'files']) {
      const dir = join(this.uploadDir, sub);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }
  }

  getUploadDir(type: 'videos' | 'images' | 'files' = 'videos') {
    return join(this.uploadDir, type);
  }

  generateFilename(originalName: string): string {
    const ext = extname(originalName).toLowerCase();
    return `${randomUUID()}${ext}`;
  }

  getFileUrl(filename: string, type: 'videos' | 'images' | 'files' = 'videos'): string {
    // TODO: In production, serve files through signed URLs or a CDN with
    // authentication checks instead of direct public access via /uploads.
    return `/uploads/${type}/${filename}`;
  }

  /**
   * Validate uploaded file MIME type and size.
   * Call this from controllers after FileInterceptor to reject invalid uploads.
   */
  validateFile(file: Express.Multer.File, type: 'videos' | 'images' | 'files') {
    const allowedMimes = ALLOWED_MIMES[type];
    if (!allowedMimes) {
      throw new BadRequestException(`Invalid upload type: ${type}`);
    }

    // MIME check
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed for ${type}. ` +
        `Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    // Size check
    const maxSize = MAX_SIZE[type];
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      throw new BadRequestException(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${maxMB}MB for ${type}`,
      );
    }
  }
}
