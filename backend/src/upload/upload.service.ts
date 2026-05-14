import { Injectable, BadRequestException } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, openSync, readSync, closeSync } from 'fs';
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

/**
 * Magic byte signatures for common file types.
 * Each entry maps a MIME type to its leading byte pattern (hex).
 */
const MAGIC_BYTES: { mime: string; bytes: number[]; offset?: number }[] = [
  // Images
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF (followed by WEBP at offset 8)
  // Videos
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp at offset 4
  { mime: 'video/webm', bytes: [0x1A, 0x45, 0xDF, 0xA3] }, // EBML header (WebM/MKV)
  { mime: 'video/quicktime', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }, // ftyp (same as mp4)
  { mime: 'video/x-msvideo', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  // Documents
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'application/zip', bytes: [0x50, 0x4B, 0x03, 0x04] }, // PK (also .docx, .xlsx, .pptx)
  { mime: 'application/msword', bytes: [0xD0, 0xCF, 0x11, 0xE0] }, // OLE2 compound
  { mime: 'application/vnd.ms-excel', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
  { mime: 'application/vnd.ms-powerpoint', bytes: [0xD0, 0xCF, 0x11, 0xE0] },
];

/** OOXML formats use ZIP container — map them for the PK signature check */
const ZIP_BASED_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
]);

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
   * Validate uploaded file MIME type, size, AND magic bytes.
   * Call this from controllers after FileInterceptor to reject invalid uploads.
   */
  validateFile(file: Express.Multer.File, type: 'videos' | 'images' | 'files') {
    const allowedMimes = ALLOWED_MIMES[type];
    if (!allowedMimes) {
      throw new BadRequestException(`Invalid upload type: ${type}`);
    }

    // 1. MIME check (client-reported)
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type '${file.mimetype}' is not allowed for ${type}. ` +
        `Allowed: ${allowedMimes.join(', ')}`,
      );
    }

    // 2. Size check
    const maxSize = MAX_SIZE[type];
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / 1024 / 1024);
      throw new BadRequestException(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${maxMB}MB for ${type}`,
      );
    }

    // 3. Magic byte verification — ensures the binary content matches the
    //    declared MIME type, preventing disguised malicious uploads.
    this.validateMagicBytes(file);
  }

  /**
   * Verify file content against known magic byte signatures.
   * Skips validation for text/plain and SVG (text-based formats).
   */
  private validateMagicBytes(file: Express.Multer.File) {
    const { mimetype } = file;

    // Skip text-based formats that don't have binary signatures
    if (mimetype === 'text/plain' || mimetype === 'image/svg+xml') {
      return;
    }

    let buffer: Buffer;
    if (file.buffer) {
      buffer = file.buffer;
    } else if (file.path) {
      // If using diskStorage, read the first 12 bytes from the file
      try {
        const fd = openSync(file.path, 'r');
        buffer = Buffer.alloc(12);
        const bytesRead = readSync(fd, buffer, 0, 12, 0);
        closeSync(fd);
        if (bytesRead < 12 && bytesRead < Buffer.byteLength(buffer)) {
           buffer = buffer.subarray(0, bytesRead);
        }
      } catch (e) {
        throw new BadRequestException('Unable to read file for integrity check.');
      }
    } else {
      throw new BadRequestException('File content unavailable for integrity check.');
    }

    // Need at least 12 bytes to check signatures (or whatever the buffer length is)
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException(
        'File is too small or empty — unable to verify file integrity.',
      );
    }

    // ZIP-based OOXML formats (.docx, .xlsx, .pptx)
    if (ZIP_BASED_MIMES.has(mimetype)) {
      const isZip = this.matchesBytes(buffer, [0x50, 0x4B, 0x03, 0x04], 0);
      if (!isZip) {
        throw new BadRequestException(
          `File content does not match expected format for '${mimetype}'. ` +
          'The file may be corrupted or disguised.',
        );
      }
      return;
    }

    // Check against known magic byte signatures
    const matchingSignatures = MAGIC_BYTES.filter(sig => sig.mime === mimetype);

    if (matchingSignatures.length === 0) {
      // No signature defined for this MIME — rely on MIME check alone
      return;
    }

    const isValid = matchingSignatures.some(sig =>
      this.matchesBytes(buffer, sig.bytes, sig.offset || 0),
    );

    if (!isValid) {
      throw new BadRequestException(
        `File content does not match expected format for '${mimetype}'. ` +
        'The file may be corrupted or disguised.',
      );
    }
  }

  private matchesBytes(buffer: Buffer, expected: number[], offset: number): boolean {
    if (buffer.length < offset + expected.length) return false;
    return expected.every((byte, i) => buffer[offset + i] === byte);
  }
}
