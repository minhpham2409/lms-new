import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CoursesService } from './courses.service';
import { CourseRepository, EnrollmentRepository, WalletRepository } from '../database/repositories';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: CourseRepository,
          useValue: {
            findAllWithCounts: jest.fn(),
            findById: jest.fn(),
            findByIdWithSections: jest.fn(),
            createWithAuthor: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByAuthorId: jest.fn(),
            search: jest.fn(),
          },
        },
        {
          provide: EnrollmentRepository,
          useValue: {
            findByUserAndCourse: jest.fn(),
          },
        },
        {
          provide: WalletRepository,
          useValue: {
            findWithTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
