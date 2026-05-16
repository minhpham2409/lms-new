import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const DEFAULT_ORPHAN_TTL_HOURS = 24;
const DEFAULT_BATCH_SIZE = 100;

@Injectable()
export class MediaCleanupService {
  private readonly logger = new Logger(MediaCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOrphanMediaAssets() {
    const ttlHours = Number(process.env.MEDIA_ORPHAN_TTL_HOURS || DEFAULT_ORPHAN_TTL_HOURS);
    const batchSize = Number(process.env.MEDIA_ORPHAN_CLEANUP_BATCH_SIZE || DEFAULT_BATCH_SIZE);
    const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);

    const assets = await (this.prisma as any).mediaAsset.findMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ['PROCESSING', 'READY', 'FAILED', 'ORPHANED'] },
        lesson: null,
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
    });

    let cleaned = 0;
    for (const asset of assets) {
      try {
        const keys = [
          asset.storageKey,
          asset.originalKey,
          asset.hlsManifestKey,
        ].filter((key): key is string => !!key);

        if (keys.length > 0) {
          await this.storageService.deleteObjects(keys);
        }

        if (asset.hlsManifestKey?.endsWith('/index.m3u8')) {
          const prefix = asset.hlsManifestKey.replace(/index\.m3u8$/, '');
          await this.storageService.deletePrefix(prefix);
        }

        await (this.prisma as any).mediaAsset.update({
          where: { id: asset.id },
          data: { status: 'DELETED' },
        });
        cleaned += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to cleanup media asset ${asset.id}: ${(error as Error).message}`,
        );
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} orphan media assets`);
    }

    return { scanned: assets.length, cleaned };
  }
}
