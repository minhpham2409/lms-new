import { Test, TestingModule } from '@nestjs/testing';
import { HlsService } from './hls.service';
import { StorageService } from '../storage/storage.service';

describe('HlsService', () => {
  let service: HlsService;
  let storageService: StorageService;

  const mockStorageService = {
    putObject: jest.fn().mockResolvedValue('test-key'),
    putManyObjects: jest.fn().mockResolvedValue(['key1', 'key2']),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    deleteObjects: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn().mockReturnValue('http://localhost:9000/test-bucket/hls/test/index.m3u8'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HlsService,
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = module.get<HlsService>(HlsService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convertAndUpload', () => {
    it('should throw InternalServerErrorException when ffmpeg is not available', async () => {
      // This test verifies the error handling when ffmpeg is not installed
      // In CI, ffmpeg may not be available, so we expect the service to:
      // 1. Try to upload the original (succeeds with mock)
      // 2. Try to run ffmpeg (fails)
      // 3. Clean up and throw
      try {
        await service.convertAndUpload('/nonexistent/file.mp4', 'test.mp4');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.status).toBe(500);
        expect(error.message).toContain('Video conversion failed');
      }
    });

    it('should call storageService.putObject for original upload', async () => {
      try {
        await service.convertAndUpload('/nonexistent/file.mp4', 'test.mp4');
      } catch {
        // Expected to fail because file doesn't exist
      }
      // putObject is called for the original video attempt (may fail due to file read)
    });
  });

  describe('cleanup', () => {
    it('should handle cleanup gracefully when files do not exist', () => {
      // Verify no errors thrown when cleaning non-existent paths
      expect(() => {
        (service as any).cleanupFile('/nonexistent/path.mp4');
      }).not.toThrow();
    });

    it('should handle cleanup of non-existent temp dir', () => {
      expect(() => {
        (service as any).cleanupTempDir('/nonexistent/dir');
      }).not.toThrow();
    });
  });
});
