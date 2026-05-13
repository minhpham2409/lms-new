import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController — Security', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;

  beforeEach(async () => {
    usersService = {
      findOne: jest.fn().mockResolvedValue({ id: 'other-user', username: 'other' }),
      findAll: jest.fn().mockResolvedValue([]),
      updateProfile: jest.fn().mockResolvedValue({ id: 'user-1', firstName: 'Test' }),
      getStudentDashboard: jest.fn().mockResolvedValue({}),
      checkInStreak: jest.fn().mockResolvedValue({}),
      getMyStreakCoupon: jest.fn().mockResolvedValue(null),
      findPublicTeachers: jest.fn().mockResolvedValue([]),
      findPublicTeacherById: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('GET /users/:id', () => {
    it('should allow admin to view any user', async () => {
      const req = { user: { id: 'admin-id', role: 'admin' } };
      await expect(controller.findOne('other-user', req)).resolves.toBeDefined();
    });

    it('should allow user to view their own profile', async () => {
      const req = { user: { id: 'user-1', role: 'student' } };
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: 'user-1' });
      await expect(controller.findOne('user-1', req)).resolves.toBeDefined();
    });

    it('should DENY normal user viewing another user', async () => {
      const req = { user: { id: 'user-1', role: 'student' } };
      let threw = false;
      try {
        await controller.findOne('other-user', req);
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(ForbiddenException);
      }
      expect(threw).toBe(true);
    });

    it('should DENY teacher viewing another user', async () => {
      const req = { user: { id: 'teacher-1', role: 'teacher' } };
      let threw = false;
      try {
        await controller.findOne('other-user', req);
      } catch (e) {
        threw = true;
        expect(e).toBeInstanceOf(ForbiddenException);
      }
      expect(threw).toBe(true);
    });
  });

  describe('PUT /users/me', () => {
    it('should allow user to update their own safe fields', async () => {
      const req = { user: { id: 'user-1' } };
      const dto = { firstName: 'Updated' };
      await expect(controller.updateMe(req, dto)).resolves.toBeDefined();
      expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', dto);
    });
  });
});
