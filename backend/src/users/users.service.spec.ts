import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository, StudentDashboardRepository } from '../database/repositories';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from '../achievements/achievements.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: { findMany: jest.fn(), findById: jest.fn() } },
        { provide: StudentDashboardRepository, useValue: { getUserStreak: jest.fn() } },
        { provide: NotificationsService, useValue: { notifyUser: jest.fn() } },
        { provide: AchievementsService, useValue: { checkAndAwardBadges: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
