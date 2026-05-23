import {
  Controller, Get, Param, Post, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, NotFoundException, Query, InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { UploadService } from './upload.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { JobNames, QueueNames } from '../shared/queues';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { getContentType } from '../storage/storage.constants';
import { createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = ['.mp4', '.webm', '.mov', '.avi'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx'];

function cleanupUploadedFile(path?: string) {
  if (!path) return;
  try {
    if (existsSync(path)) unlinkSync(path);
  } catch {
    // Best-effort cleanup only.
  }
}

/**
 * Static helpers for multer diskStorage config.
 * We cannot use NestJS DI inside multer's static config,
 * so these replicate the minimal logic from UploadService.
 */
// Multer writes the incoming stream before controller code runs. Keep those
// temporary files outside /app/uploads so Docker volume ownership cannot block
// teacher uploads. HLS/S3 handlers clean these files after processing.
const UPLOAD_BASE = process.env.UPLOAD_TMP_DIR || join('/tmp', 'lms-uploads');

function ensureDir(dir: string): string {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getUploadDestination(type: string) {
  return ensureDir(join(UPLOAD_BASE, type));
}

function generateFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  return `${randomUUID()}${ext}`;
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    @InjectQueue(QueueNames.VIDEO) private readonly videoQueue: Queue,
  ) {}

  @Post('video')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Upload a video file for lessons (queues HLS conversion)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiQuery({ name: 'hls', required: false, description: 'Set to false to skip HLS conversion' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, getUploadDestination('videos'));
        },
        filename: (_req, file, cb) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: { fileSize: MAX_VIDEO_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_VIDEO_TYPES.includes(ext)) {
          return cb(new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: { id: string },
    @Query('hls') hlsParam?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    try {
      this.uploadService.validateFile(file, 'videos');
    } catch (error) {
      cleanupUploadedFile(file.path);
      throw error;
    }

    const skipHls = hlsParam === 'false';

    if (!skipHls) {
      let mediaAsset: { id: string } | undefined;
      try {
        mediaAsset = await (this.prisma as any).mediaAsset.create({
          data: {
            ownerId: user.id,
            type: 'VIDEO',
            status: 'PROCESSING',
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
          },
        });

        const job = await this.videoQueue.add(
          JobNames.CONVERT_VIDEO_HLS,
          {
            filePath: file.path,
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            mediaAssetId: mediaAsset.id,
          },
          {
            attempts: 1,
            removeOnComplete: false,
            removeOnFail: false,
            timeout: 30 * 60 * 1000,
          },
        );

        return {
          jobId: String(job.id),
          mediaAssetId: mediaAsset.id,
          status: 'processing',
          format: 'hls-processing',
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      } catch (error) {
        if (mediaAsset) {
          await (this.prisma as any).mediaAsset.update({
            where: { id: mediaAsset.id },
            data: {
              status: 'FAILED',
              error: (error as Error).message,
            },
          }).catch(() => undefined);
        }
        cleanupUploadedFile(file.path);
        throw new InternalServerErrorException(
          `Failed to queue HLS conversion: ${(error as Error).message}`
        );
      }
    }

    // Direct Upload to S3/MinIO (when hls=false)
    const fileId = randomUUID();
    const ext = extname(file.originalname).toLowerCase();
    const key = `videos/original/${fileId}${ext}`;
    try {
      await this.storageService.putObject({
        key,
        body: createReadStream(file.path),
        contentType: getContentType(file.originalname),
      });
      const mediaAsset = await (this.prisma as any).mediaAsset.create({
        data: {
          ownerId: user.id,
          type: 'VIDEO',
          status: 'READY',
          url: this.storageService.getPublicUrl(key),
          storageKey: key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });

      return {
        url: mediaAsset.url,
        mediaAssetId: mediaAsset.id,
        storageKey: key,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        format: 'direct',
      };
    } finally {
      cleanupUploadedFile(file.path);
    }
  }

  @Get('video/jobs/:jobId')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Get HLS video processing status' })
  async getVideoJobStatus(@Param('jobId') jobId: string) {
    const job = await this.videoQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Video processing job not found');

    const state = await job.getState();
    const progress = job.progress();

    if (state === 'completed') {
      const result = await job.finished();
      return {
        jobId,
        status: 'completed',
        progress: 100,
        ...result,
      };
    }

    if (state === 'failed') {
      return {
        jobId,
        status: 'failed',
        progress,
        error: job.failedReason || 'Video processing failed',
      };
    }

    return {
      jobId,
      status: state,
      progress,
    };
  }

  @Post('image')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin', 'student')
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, getUploadDestination('images'));
        },
        filename: (_req, file, cb) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: { fileSize: MAX_IMAGE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.includes(ext)) {
          return cb(new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    this.uploadService.validateFile(file, 'images');

    // Upload to S3/MinIO
    let uploadedToObjectStorage = false;
    try {
      const fileId = randomUUID();
      const ext = extname(file.originalname).toLowerCase();
      const key = `images/${fileId}${ext}`;
      await this.storageService.putObject({
        key,
        body: createReadStream(file.path),
        contentType: getContentType(file.originalname),
      });
      uploadedToObjectStorage = true;
      return {
        url: this.storageService.getPublicUrl(key),
        storageKey: key,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch {
      // Fallback to local
      return {
        url: this.uploadService.getFileUrl(file.filename, 'images'),
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } finally {
      if (uploadedToObjectStorage) cleanupUploadedFile(file.path);
    }
  }

  @Post('file')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Upload a document file (PDF, DOC, TXT, etc.)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, getUploadDestination('files'));
        },
        filename: (_req, file, cb) => {
          cb(null, generateFilename(file.originalname));
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_FILE_TYPES.includes(ext)) {
          return cb(new BadRequestException(`File type ${ext} not allowed. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}`), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    this.uploadService.validateFile(file, 'files');

    // Upload to S3/MinIO
    let uploadedToObjectStorage = false;
    try {
      const fileId = randomUUID();
      const ext = extname(file.originalname).toLowerCase();
      const key = `materials/${fileId}${ext}`;
      await this.storageService.putObject({
        key,
        body: createReadStream(file.path),
        contentType: getContentType(file.originalname),
      });
      uploadedToObjectStorage = true;
      return {
        url: this.storageService.getPublicUrl(key),
        storageKey: key,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch {
      // Fallback to local
      return {
        url: this.uploadService.getFileUrl(file.filename, 'files'),
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } finally {
      if (uploadedToObjectStorage) cleanupUploadedFile(file.path);
    }
  }
}
