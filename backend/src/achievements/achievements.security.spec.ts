import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

describe('AchievementsController — Seed Security', () => {
  let controller: AchievementsController;
  let achievementsService: jest.Mocked<Partial<AchievementsService>>;

  beforeEach(async () => {
    achievementsService = {
      seedBadges: jest.fn().mockResolvedValue(undefined),
      getLeaderboard: jest.fn().mockResolvedValue([]),
      getUserAchievements: jest.fn().mockResolvedValue([]),
      checkAndAwardBadges: jest.fn().mockResolvedValue(undefined),
      getUserPublicProfile: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementsController],
      providers: [
        { provide: AchievementsService, useValue: achievementsService },
      ],
    }).compile();

    controller = module.get<AchievementsController>(AchievementsController);
  });

  describe('POST /achievements/seed', () => {
    it('should call seedBadges and return success message', async () => {
      const result = await controller.seedBadges();
      expect(result).toEqual({ message: 'Badges seeded successfully' });
      expect(achievementsService.seedBadges).toHaveBeenCalled();
    });

    it('should return disabled message in production without ENABLE_SEED', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_SEED;

      try {
        const result = await controller.seedBadges();
        expect(result.message).toContain('Seed disabled');
        expect(achievementsService.seedBadges).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('GET /achievements/leaderboard', () => {
    it('should return leaderboard without auth', async () => {
      const result = await controller.getLeaderboard();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
