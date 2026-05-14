import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';

describe('MediaController', () => {
  let controller: MediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: require('../storage/storage.service').StorageService,
          useValue: {
            getObjectStream: jest.fn(),
          },
        },
        {
          provide: require('../auth/services/jwt-token.service').JwtTokenService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
        {
          provide: require('../prisma/prisma.service').PrismaService,
          useValue: {
            lesson: { findFirst: jest.fn() },
            material: { findFirst: jest.fn() },
            enrollment: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
