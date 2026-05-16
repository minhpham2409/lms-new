import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HlsService } from './hls.service';
import { JobNames, QueueNames } from '../shared/queues';
import { PrismaService } from '../prisma/prisma.service';

export interface HlsConversionJobData {
  filePath: string;
  originalName: string;
  filename: string;
  size: number;
  mimetype: string;
  mediaAssetId?: string;
}

@Processor(QueueNames.VIDEO)
export class HlsProcessor {
  private readonly logger = new Logger(HlsProcessor.name);

  constructor(
    private readonly hlsService: HlsService,
    private readonly prisma: PrismaService,
  ) {}

  @Process(JobNames.CONVERT_VIDEO_HLS)
  async convertVideo(job: Job<HlsConversionJobData>) {
    this.logger.log(`Converting video job ${job.id}: ${job.data.originalName}`);
    await job.progress(5);

    try {
      const result = await this.hlsService.convertAndUpload(
        job.data.filePath,
        job.data.originalName,
      );

      await job.progress(100);
      const payload = {
        url: result.hlsUrl,
        hlsManifestKey: result.hlsManifestKey,
        originalKey: result.originalKey,
        videoId: result.videoId,
        mediaAssetId: job.data.mediaAssetId,
        segmentCount: result.segmentCount,
        format: 'hls',
        filename: job.data.filename,
        originalName: job.data.originalName,
        size: job.data.size,
        mimetype: job.data.mimetype,
      };

      if (job.data.mediaAssetId) {
        await (this.prisma as any).mediaAsset.update({
          where: { id: job.data.mediaAssetId },
          data: {
            status: 'READY',
            url: result.hlsUrl,
            hlsManifestKey: result.hlsManifestKey,
            originalKey: result.originalKey,
            jobId: String(job.id),
            error: null,
          },
        });
      }

      return payload;
    } catch (error) {
      if (job.data.mediaAssetId) {
        await (this.prisma as any).mediaAsset.update({
          where: { id: job.data.mediaAssetId },
          data: {
            status: 'FAILED',
            jobId: String(job.id),
            error: (error as Error).message,
          },
        });
      }
      throw error;
    }
  }
}
