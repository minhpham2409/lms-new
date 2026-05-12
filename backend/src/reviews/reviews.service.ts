import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ReviewRepository, EnrollmentRepository } from '../database/repositories';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  async create(dto: CreateReviewDto, userId: string) {
    const enrollment = await this.enrollmentRepository.findByUserAndCourse(userId, dto.courseId);
    if (!enrollment) throw new ForbiddenException('You must be enrolled to review this course');

    const existing = await this.reviewRepository.findByUserAndCourse(userId, dto.courseId);
    if (existing) throw new ConflictException('You have already reviewed this course');

    return this.reviewRepository.create({
      courseId: dto.courseId,
      userId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async findByCourse(courseId: string) {
    return this.reviewRepository.findByCourse(courseId);
  }

  async update(id: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.reviewRepository.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('You can only update your own reviews');
    return this.reviewRepository.update(id, dto);
  }
}
