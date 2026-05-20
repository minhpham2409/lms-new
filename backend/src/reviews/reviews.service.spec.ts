import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo: {
    findByUserAndCourse: jest.Mock;
    create: jest.Mock;
    findByCourse: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
  };
  let enrollmentRepo: { findByUserAndCourse: jest.Mock };

  beforeEach(() => {
    reviewRepo = {
      findByUserAndCourse: jest.fn(),
      create: jest.fn(),
      findByCourse: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    enrollmentRepo = { findByUserAndCourse: jest.fn() };

    service = new ReviewsService(reviewRepo as any, enrollmentRepo as any);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a review for an enrolled user', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'enroll-1' });
      reviewRepo.findByUserAndCourse.mockResolvedValue(null);
      reviewRepo.create.mockResolvedValue({
        id: 'review-1',
        rating: 5,
        comment: 'Great course!',
      });

      const result = await service.create(
        { courseId: 'course-1', rating: 5, comment: 'Great course!' },
        'user-1',
      );

      expect(result.rating).toBe(5);
      expect(reviewRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ courseId: 'course-1', userId: 'user-1', rating: 5 }),
      );
    });

    it('should throw ForbiddenException for non-enrolled user', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue(null);

      await expect(
        service.create({ courseId: 'course-1', rating: 5 }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException for duplicate review', async () => {
      enrollmentRepo.findByUserAndCourse.mockResolvedValue({ id: 'enroll-1' });
      reviewRepo.findByUserAndCourse.mockResolvedValue({ id: 'existing-review' });

      await expect(
        service.create({ courseId: 'course-1', rating: 4 }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── findByCourse ───────────────────────────────────────────────────────────

  describe('findByCourse', () => {
    it('should return all reviews for a course', async () => {
      reviewRepo.findByCourse.mockResolvedValue([
        { id: 'r1', rating: 5 },
        { id: 'r2', rating: 3 },
      ]);

      const result = await service.findByCourse('course-1');

      expect(result).toHaveLength(2);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should update own review', async () => {
      reviewRepo.findById.mockResolvedValue({ id: 'review-1', userId: 'user-1' });
      reviewRepo.update.mockResolvedValue({ id: 'review-1', rating: 4 });

      const result = await service.update('review-1', { rating: 4 }, 'user-1');

      expect(result.rating).toBe(4);
    });

    it('should throw NotFoundException when review does not exist', async () => {
      reviewRepo.findById.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { rating: 4 }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when updating another users review', async () => {
      reviewRepo.findById.mockResolvedValue({ id: 'review-1', userId: 'other-user' });

      await expect(
        service.update('review-1', { rating: 4 }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
