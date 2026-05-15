import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { JwtTokenService } from '../auth/services/jwt-token.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly storageService: StorageService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('videos/*')
  @ApiOperation({ summary: 'Stream protected video content' })
  async streamVideo(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const key = req.params[0]; 
    if (!key) return res.status(400).send('Invalid media path');
    const user = this.verifyMediaAuth(req);
    await this.verifyVideoAccess(user, `videos/${key}`);
    await this.pipeMedia(`videos/${key}`, req, res);
  }

  @Get('hls/*')
  @ApiOperation({ summary: 'Stream protected HLS video content' })
  async streamHls(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const key = req.params[0];
    if (!key) return res.status(400).send('Invalid media path');
    const user = this.verifyMediaAuth(req);
    await this.verifyVideoAccess(user, `hls/${key}`);
    await this.pipeMedia(`hls/${key}`, req, res);
  }

  @Get('materials/*')
  @ApiOperation({ summary: 'Download protected material/document' })
  async downloadMaterial(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const key = req.params[0]; 
    if (!key) return res.status(400).send('Invalid media path');
    const user = this.verifyMediaAuth(req);
    await this.verifyMaterialAccess(user, `materials/${key}`);
    await this.pipeMedia(`materials/${key}`, req, res);
  }

  @Get('images/*')
  @ApiOperation({ summary: 'View public image' })
  async viewImage(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Images are public (avatars, thumbnails)
    const key = req.params[0]; 
    if (!key) return res.status(400).send('Invalid media path');
    await this.pipeMedia(`images/${key}`, req, res);
  }

  private verifyMediaAuth(req: Request) {
    const token = req.cookies?.['refresh_token'] || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Media access denied. Authentication required.');
    }

    try {
      return this.jwtTokenService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired media token.');
    }
  }

  private rejectUnsafeKey(key: string) {
    if (key.includes('..') || key.startsWith('/')) {
      throw new UnauthorizedException('Invalid media path.');
    }
  }

  private async verifyVideoAccess(user: { sub: string; role: string }, fullKey: string) {
    this.rejectUnsafeKey(fullKey);

    const lesson = await this.prisma.lesson.findFirst({
      where: { videoUrl: { contains: fullKey } },
      select: {
        id: true,
        section: {
          select: {
            course: {
              select: { id: true, authorId: true },
            },
          },
        },
      },
    });

    if (!lesson?.section?.course) {
      throw new UnauthorizedException('Media access denied.');
    }

    await this.assertCourseAccess(user, lesson.section.course);
  }

  private async verifyMaterialAccess(user: { sub: string; role: string }, fullKey: string) {
    this.rejectUnsafeKey(fullKey);

    const material = await this.prisma.material.findFirst({
      where: { fileUrl: { contains: fullKey } },
      select: {
        id: true,
        lesson: {
          select: {
            section: {
              select: {
                course: {
                  select: { id: true, authorId: true },
                },
              },
            },
          },
        },
      },
    });

    const course = material?.lesson?.section?.course;
    if (!course) {
      throw new UnauthorizedException('Media access denied.');
    }

    await this.assertCourseAccess(user, course);
  }

  private async assertCourseAccess(
    user: { sub: string; role: string },
    course: { id: string; authorId: string },
  ) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher' && course.authorId === user.sub) return;

    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.sub, courseId: course.id } },
      select: { status: true },
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.active) {
      throw new UnauthorizedException('Media access denied.');
    }
  }

  private getContentType(fullKey: string): string | undefined {
    if (fullKey.endsWith('.m3u8')) return 'application/x-mpegURL';
    if (fullKey.endsWith('.ts')) return 'video/MP2T';
    if (fullKey.endsWith('.mp4')) return 'video/mp4';
    if (fullKey.endsWith('.pdf')) return 'application/pdf';
    if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) return 'image/jpeg';
    if (fullKey.endsWith('.png')) return 'image/png';
    if (fullKey.endsWith('.webp')) return 'image/webp';
    if (fullKey.endsWith('.gif')) return 'image/gif';
    return undefined;
  }

  private parseRange(range: string, size: number) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) return null;

    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : size - 1;

    if (!match[1] && match[2]) {
      const suffixLength = parseInt(match[2], 10);
      start = Math.max(size - suffixLength, 0);
      end = size - 1;
    }

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return null;
    }

    return { start, end: Math.min(end, size - 1) };
  }

  private async pipeMedia(fullKey: string, req: Request, res: Response) {
    try {
      const contentType = this.getContentType(fullKey);
      if (contentType) res.setHeader('Content-Type', contentType);

      const metadata = await this.storageService.getObjectMetadata(fullKey);
      const size = metadata.ContentLength;
      if (size) {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', size.toString());
      }

      const rangeHeader = req.headers.range;
      if (rangeHeader && size) {
        const range = this.parseRange(rangeHeader, size);
        if (!range) {
          res.setHeader('Content-Range', `bytes */${size}`);
          return res.status(416).send('Requested range not satisfiable');
        }

        const contentLength = range.end - range.start + 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
        res.setHeader('Content-Length', contentLength.toString());

        const stream = await this.storageService.getObjectStream(
          fullKey,
          `bytes=${range.start}-${range.end}`,
        );
        return (stream as any).pipe(res);
      }

      const stream = await this.storageService.getObjectStream(fullKey);
      (stream as any).pipe(res);
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        res.status(404).send('Media not found');
      } else {
        res.status(500).send('Error streaming media');
      }
    }
  }
}
