import { Controller, Get, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { StorageService } from '../storage/storage.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Get('videos/*')
  @ApiOperation({ summary: 'Stream protected video content' })
  async streamVideo(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Check for cookie or Bearer token
    const token = req.cookies?.['refresh_token'] || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Media access denied. Authentication required.');
    }

    // Since it's a wildcard route, we extract the path
    const key = req.params[0]; 
    if (!key) {
      return res.status(400).send('Invalid media path');
    }

    const fullKey = `videos/${key}`;

    try {
      const stream = await this.storageService.getObjectStream(fullKey);
      
      // Set correct content type
      if (key.endsWith('.m3u8')) res.setHeader('Content-Type', 'application/x-mpegURL');
      else if (key.endsWith('.ts')) res.setHeader('Content-Type', 'video/MP2T');
      else if (key.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');

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
