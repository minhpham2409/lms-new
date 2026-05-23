import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { join } from 'path';
import { existsSync, readdirSync, statSync, rmSync } from 'fs';

/**
 * Cleanup Service — runs a nightly cron job to remove stale chunked upload
 * directories that were never completed (older than 24 hours).
 * Prevents disk space exhaustion on the VPS.
 */
@Injectable()
export class UploadCleanupService {
  private readonly logger = new Logger(UploadCleanupService.name);
  private readonly uploadsDir = join(process.cwd(), 'tmp', 'uploads');
  private readonly maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleCleanup() {
    if (!existsSync(this.uploadsDir)) return;

    const entries = readdirSync(this.uploadsDir, { withFileTypes: true });
    let cleaned = 0;

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const dirPath = join(this.uploadsDir, entry.name);
      try {
        const stats = statSync(dirPath);
        const ageMs = Date.now() - stats.birthtimeMs;

        if (ageMs > this.maxAgeMs) {
          rmSync(dirPath, { recursive: true, force: true });
          cleaned++;
          this.logger.log(`Cleaned stale upload: ${entry.name}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to clean ${entry.name}: ${(error as Error).message}`);
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Upload cleanup completed: removed ${cleaned} stale upload(s)`);
    }
  }
}
