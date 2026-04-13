import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CourseRepository } from '../database/repositories';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async create(dto: CreateCourseDto, authorId: string) {
    return this.courseRepository.createWithAuthor(dto, authorId);
  }

  async findAll() {
    return this.courseRepository.findAllWithCounts();
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findByIdWithSections(id);
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId) throw new ForbiddenException('You can only update your own courses');
    return this.courseRepository.update(id, dto);
  }

  async remove(id: string, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId) throw new ForbiddenException('You can only delete your own courses');
    return this.courseRepository.delete(id);
  }

  async findByAuthor(authorId: string) {
    return this.courseRepository.findByAuthorId(authorId);
  }

  async search(q: string) {
    return this.courseRepository.search(q);
  }

  async submitForReview(id: string, authorId: string) {
    const course = await this.courseRepository.findById(id);
    if (!course) throw new NotFoundException('Course not found');
    if (course.authorId !== authorId) throw new ForbiddenException('You can only submit your own courses');
    if (course.status !== 'draft') throw new ForbiddenException('Only draft courses can be submitted for review');
    return this.courseRepository.update(id, { status: 'pending' });
  }
}
