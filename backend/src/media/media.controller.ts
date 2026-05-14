import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { JwtTokenService } from '../auth/services/jwt-token.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly storageService: StorageService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  @Get('videos/*')
  @ApiOperation({ summary: 'Stream protected video content' })
  async streamVideo(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.verifyMediaAuth(req);
    const key = req.params[0]; 
    if (!key) return res.status(400).send('Invalid media path');
    await this.pipeMedia(`videos/${key}`, res);
  }

  @Get('materials/*')
  @ApiOperation({ summary: 'Download protected material/document' })
  async downloadMaterial(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.verifyMediaAuth(req);
    const key = req.params[0]; 
    if (!key) return res.status(400).send('Invalid media path');
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
      this.jwtTokenService.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired media token.');
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
