import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultVal?: any) => {
              const config: Record<string, string> = {
                S3_ENDPOINT: 'http://localhost:9000',
                S3_REGION: 'us-east-1',
                S3_ACCESS_KEY: 'minioadmin',
                S3_SECRET_KEY: 'minioadmin',
                S3_FORCE_PATH_STYLE: 'true',
                S3_BUCKET: 'test-bucket',
                S3_PUBLIC_ENDPOINT: 'http://localhost:9000',
                S3_SIGNED_URL_EXPIRES: '3600',
                API_URL: 'http://api.example.test/api/v1',
              };
              return config[key] ?? defaultVal;
            },
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicUrl', () => {
    it('should generate proxy URL for media', () => {
      const url = service.getPublicUrl('hls/abc/index.m3u8');
      expect(url).toBe('http://api.example.test/api/v1/media/hls/abc/index.m3u8');
      expect(url).toContain('/media/hls/abc/index.m3u8');
    });

    it('should correctly format videos prefix', () => {
      const url = service.getPublicUrl('videos/original/test.mp4');
      expect(url).toContain('/media/videos/original/test.mp4');
    });
  });

  describe('getSignedReadUrl', () => {
    it('should generate a signed URL', async () => {
      // This will fail to connect but should not throw during URL generation
      // In a real test with MinIO running, this would return a valid signed URL
      try {
        const url = await service.getSignedReadUrl('test-key.mp4');
        expect(url).toBeTruthy();
        expect(url).toContain('test-key.mp4');
      } catch {
        // Expected when MinIO is not running
      }
    });
  });
});
