import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonRepository } from '../database/repositories/lesson.repository';
import { SectionRepository } from '../database/repositories/section.repository';
import { EnrollmentRepository } from '../database/repositories/enrollment.repository';

const mockLesson = {
  id: 'lesson-1',
  title: 'Test Lesson',
  section: {
    course: {
      id: 'course-1',
      authorId: 'teacher-1',
      status: 'published',
    },
  },
};

describe('LessonsService — Content Access Security', () => {
  let service: LessonsService;
  let lessonRepo: jest.Mocked<Partial<LessonRepository>>;
  let sectionRepo: jest.Mocked<Partial<SectionRepository>>;
  let enrollmentRepo: jest.Mocked<Partial<EnrollmentRepository>>;

  beforeEach(async () => {
    lessonRepo = {
      findByIdWithSection: jest.fn().mockResolvedValue(mockLesson),
      findById: jest.fn().mockResolvedValue(mockLesson),
      findMany: jest.fn().mockResolvedValue([]),
      getNextOrder: jest.fn().mockResolvedValue(1),
      createWithOrder: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    sectionRepo = {
      findByIdWithCourse: jest.fn().mockResolvedValue({
        id: 'section-1',
        course: { id: 'course-1', authorId: 'teacher-1', status: 'published' },
      }),
    };

    enrollmentRepo = {
      findByUserAndCourse: jest.fn().mockResolvedValue(null), // Not enrolled by default
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: LessonRepository, useValue: lessonRepo },
        { provide: SectionRepository, useValue: sectionRepo },
        { provide: EnrollmentRepository, useValue: enrollmentRepo },
      ],
    }).compile();

    service = module.get<LessonsService>(LessonsService);
  });

  describe('findOne (GET /lessons/:id)', () => {
    it('should allow admin to access any lesson', async () => {
      const user = { id: 'admin-1', role: 'admin' };
      await expect(service.findOne('lesson-1', user)).resolves.toEqual(mockLesson);
    });

    it('should allow course author (teacher) to access their lesson', async () => {
      const user = { id: 'teacher-1', role: 'teacher' };
      await expect(service.findOne('lesson-1', user)).resolves.toEqual(mockLesson);
    });

    it('should allow enrolled student to access lesson', async () => {
      (enrollmentRepo.findByUserAndCourse as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
        status: 'active',
      });
      const user = { id: 'student-1', role: 'student' };
      await expect(service.findOne('lesson-1', user)).resolves.toEqual(mockLesson);
    });

    it('should DENY non-enrolled student access to lesson', async () => {
      const user = { id: 'student-not-enrolled', role: 'student' };
      // enrollmentRepo returns null by default
      await expect(service.findOne('lesson-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should DENY student with pending enrollment', async () => {
      (enrollmentRepo.findByUserAndCourse as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
        status: 'pending', // Not active
      });
      const user = { id: 'student-1', role: 'student' };
      await expect(service.findOne('lesson-1', user)).rejects.toThrow(ForbiddenException);
    });

    it('should DENY non-author teacher from another course', async () => {
      const user = { id: 'other-teacher', role: 'teacher' };
      // Non-author teacher with no enrollment → should be blocked
      await expect(service.findOne('lesson-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});
