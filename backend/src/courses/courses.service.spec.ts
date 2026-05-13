import { Test, TestingModule } from '@nestjs/testing';
import { CoursesService } from './courses.service';
import { CourseRepository } from '../database/repositories';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
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
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
