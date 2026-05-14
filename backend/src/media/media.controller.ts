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
    await this.pipeMedia(`videos/${key}`, res);
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
    await this.pipeMedia(`hls/${key}`, res);
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
    await this.pipeMedia(`materials/${key}`, res);
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
    await this.pipeMedia(`images/${key}`, res);
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

  private async pipeMedia(fullKey: string, res: Response) {
    try {
      const stream = await this.storageService.getObjectStream(fullKey);
      
      if (fullKey.endsWith('.m3u8')) res.setHeader('Content-Type', 'application/x-mpegURL');
      else if (fullKey.endsWith('.ts')) res.setHeader('Content-Type', 'video/MP2T');
      else if (fullKey.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
      else if (fullKey.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf');
      else if (fullKey.endsWith('.jpg') || fullKey.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
      else if (fullKey.endsWith('.png')) res.setHeader('Content-Type', 'image/png');
      else if (fullKey.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
      else if (fullKey.endsWith('.gif')) res.setHeader('Content-Type', 'image/gif');

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
