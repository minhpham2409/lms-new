import { Injectable } from '@nestjs/common';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

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
    return `/uploads/${type}/${filename}`;
  }
}
