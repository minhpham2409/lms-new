import { NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  const progressRepo = {
    findLessonWithDetails: jest.fn(),
    findLessonWithAssignments: jest.fn(),
    findActiveEnrollment: jest.fn(),
    upsertVideoProgressMonotonic: jest.fn(),
    countLessonsByCourse: jest.fn(),
    countCompletedLessons: jest.fn(),
    updateEnrollmentProgress: jest.fn(),
  };

  const eventEmitter = { emit: jest.fn() };
  let service: ProgressService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProgressService(progressRepo as any, eventEmitter as any);
  });

  it('requires an active enrollment before updating video progress', async () => {
    progressRepo.findLessonWithDetails.mockResolvedValue({
      id: 'lesson-1',
      section: { courseId: 'course-1' },
    });
    progressRepo.findActiveEnrollment.mockResolvedValue(null);

    await expect(
      service.updateVideoProgress('user-1', {
        lessonId: 'lesson-1',
        watchTime: 10,
        watchedPercentage: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(progressRepo.upsertVideoProgressMonotonic).not.toHaveBeenCalled();
  });

  it('delegates progress writes to the monotonic repository method', async () => {
    progressRepo.findLessonWithDetails.mockResolvedValue({
      id: 'lesson-1',
      section: { courseId: 'course-1' },
    });
    progressRepo.findActiveEnrollment.mockResolvedValue({ id: 'enrollment-1' });
    progressRepo.findLessonWithAssignments.mockResolvedValue({
      id: 'lesson-1',
      assignments: [],
    });
    progressRepo.upsertVideoProgressMonotonic.mockResolvedValue({
      completed: false,
      watchedPercentage: 30,
      watchTime: 15,
    });

    await service.updateVideoProgress('user-1', {
      lessonId: 'lesson-1',
      watchTime: 15,
      watchedPercentage: 30,
    });

    expect(progressRepo.upsertVideoProgressMonotonic).toHaveBeenCalledWith({
      userId: 'user-1',
      lessonId: 'lesson-1',
      watchTime: 15,
      watchedPercentage: 30,
      completed: false,
    });
  });
});
