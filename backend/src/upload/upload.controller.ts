import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, Query, InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { HlsService } from '../hls/hls.service';
import { StorageService } from '../storage/storage.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { getContentType } from '../storage/storage.constants';
import { createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_VIDEO_TYPES = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

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
const UPLOAD_BASE = join(process.cwd(), 'uploads');

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
    private readonly hlsService: HlsService,
    private readonly storageService: StorageService,
  ) {}

  @Post('video')
  @UseGuards(RolesGuard)
  @Roles('teacher', 'admin')
  @ApiOperation({ summary: 'Upload a video file for lessons (converts to HLS)' })
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
    @Query('hls') hlsParam?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    // Validate MIME type after upload
    this.uploadService.validateFile(file, 'videos');

    const skipHls = hlsParam === 'false';

    if (!skipHls) {
      // Convert to HLS and upload to S3/MinIO
      try {
        const result = await this.hlsService.convertAndUpload(file.path, file.originalname);
        return {
          url: result.hlsUrl,
          hlsManifestKey: result.hlsManifestKey,
          originalKey: result.originalKey,
          videoId: result.videoId,
          segmentCount: result.segmentCount,
          format: 'hls',
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      } catch (error) {
        // Cleanup the uploaded temp file on HLS failure
        cleanupUploadedFile(file.path);
        throw new InternalServerErrorException(
          `HLS conversion failed: ${(error as Error).message}`
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

      return {
        url: this.storageService.getPublicUrl(key),
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
