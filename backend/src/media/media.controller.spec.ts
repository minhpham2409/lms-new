import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { MediaController } from './media.controller';
import { StorageService } from '../storage/storage.service';
import { JwtTokenService } from '../auth/services/jwt-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MediaController', () => {
  let controller: MediaController;
  let jwtTokenService: { verifyToken: jest.Mock };
  let prisma: {
    lesson: { findFirst: jest.Mock };
    material: { findFirst: jest.Mock };
    enrollment: { findUnique: jest.Mock };
  };
  let storageService: { getObjectStream: jest.Mock; getObjectMetadata: jest.Mock };

  beforeEach(async () => {
    storageService = {
      getObjectStream: jest.fn(),
      getObjectMetadata: jest.fn(),
    };
    jwtTokenService = {
      verifyToken: jest.fn(),
    };
    prisma = {
      lesson: { findFirst: jest.fn() },
      material: { findFirst: jest.fn() },
      enrollment: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: StorageService,
          useValue: storageService,
        },
        {
          provide: JwtTokenService,
          useValue: jwtTokenService,
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows the course teacher to access protected HLS media', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      section: { course: { id: 'course-1', authorId: 'teacher-1' } },
    });

    await expect(
      (controller as any).verifyVideoAccess(
        { sub: 'teacher-1', role: 'teacher' },
        'hls/video-1/index.m3u8',
      ),
    ).resolves.toBeUndefined();
    expect(prisma.enrollment.findUnique).not.toHaveBeenCalled();
  });

  it('allows active enrolled students to access protected HLS media', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      section: { course: { id: 'course-1', authorId: 'teacher-1' } },
    });
    prisma.enrollment.findUnique.mockResolvedValue({ status: 'active' });

    await expect(
      (controller as any).verifyVideoAccess(
        { sub: 'student-1', role: 'student' },
        'hls/video-1/index.m3u8',
      ),
    ).resolves.toBeUndefined();
    expect(prisma.enrollment.findUnique).toHaveBeenCalledWith({
      where: { userId_courseId: { userId: 'student-1', courseId: 'course-1' } },
      select: { status: true },
    });
  });

  it('matches HLS segment access by video folder prefix', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      section: { course: { id: 'course-1', authorId: 'teacher-1' } },
    });
    prisma.enrollment.findUnique.mockResolvedValue({ status: 'active' });

    await expect(
      (controller as any).verifyVideoAccess(
        { sub: 'student-1', role: 'student' },
        'hls/video-1/segment_000.ts',
      ),
    ).resolves.toBeUndefined();
    expect(prisma.lesson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            { videoUrl: { contains: 'hls/video-1/' } },
            { mediaAsset: { is: { hlsManifestKey: { contains: 'hls/video-1/' } } } },
          ]),
        },
      }),
    );
  });

  it('can match HLS media by MediaAsset manifest key when lesson URL format changes', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      section: { course: { id: 'course-1', authorId: 'teacher-1' } },
    });
    prisma.enrollment.findUnique.mockResolvedValue({ status: 'active' });

    await expect(
      (controller as any).verifyVideoAccess(
        { sub: 'student-1', role: 'student' },
        'hls/video-1/index.m3u8',
      ),
    ).resolves.toBeUndefined();
    expect(prisma.lesson.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: expect.arrayContaining([
            { mediaAsset: { is: { hlsManifestKey: { contains: 'hls/video-1/' } } } },
          ]),
        },
      }),
    );
  });

  it('normalizes wildcard route path arrays from Express 5', () => {
    expect((controller as any).normalizePathParam(['video-1', 'segment_000.ts'])).toBe('video-1/segment_000.ts');
    expect((controller as any).normalizePathParam('video-1/index.m3u8')).toBe('video-1/index.m3u8');
  });

  it('rejects unenrolled students from protected video media', async () => {
    prisma.lesson.findFirst.mockResolvedValue({
      section: { course: { id: 'course-1', authorId: 'teacher-1' } },
    });
    prisma.enrollment.findUnique.mockResolvedValue({ status: 'pending' });

    await expect(
      (controller as any).verifyVideoAccess(
        { sub: 'student-1', role: 'student' },
        'hls/video-1/index.m3u8',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('parses valid HTTP ranges and rejects invalid ranges', () => {
    expect((controller as any).parseRange('bytes=10-19', 100)).toEqual({ start: 10, end: 19 });
    expect((controller as any).parseRange('bytes=200-300', 100)).toBeNull();
  });
});
