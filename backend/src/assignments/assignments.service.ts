import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AssignmentRepository, SubmissionRepository } from '../database/repositories';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly submissionRepository: SubmissionRepository,
  ) {}

  private async getAssignmentWithOwnerCheck(id: string, authorId: string) {
    const assignment = await this.assignmentRepository.findByIdWithLesson(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only modify assignments in your own courses');
    }
    return assignment;
  }

  async create(dto: CreateAssignmentDto, authorId: string) {
    const lesson = await this.assignmentRepository.findLessonWithCourse(dto.lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only add assignments to your own lessons');
    }

    return this.assignmentRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      lessonId: dto.lessonId,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      maxScore: dto.maxScore ?? 100,
      minScore: dto.minScore ?? 0,
    });
  }

  async findByLesson(lessonId: string) {
    return this.assignmentRepository.findByLessonId(lessonId);
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, authorId: string) {
    await this.getAssignmentWithOwnerCheck(id, authorId);
    return this.assignmentRepository.update(id, dto);
  }

  async remove(id: string, authorId: string) {
    await this.getAssignmentWithOwnerCheck(id, authorId);
    return this.assignmentRepository.delete(id);
  }

  async submit(id: string, dto: SubmitAssignmentDto, studentId: string) {
    const assignment = await this.assignmentRepository.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.type !== 'essay') {
      throw new BadRequestException('Use quiz submission endpoint for quiz assignments');
    }

    const existing = await this.submissionRepository.findByAssignmentAndStudent(id, studentId);
    if (existing) throw new ConflictException('You have already submitted this assignment');

    return this.submissionRepository.create({
      assignmentId: id,
      studentId,
      content: dto.content,
      fileUrl: dto.fileUrl,
    });
  }

  async getSubmissions(id: string, authorId: string) {
    await this.getAssignmentWithOwnerCheck(id, authorId);
    return this.submissionRepository.findByAssignmentId(id);
  }

  async gradeSubmission(submissionId: string, dto: GradeSubmissionDto, authorId: string) {
    const submission = await this.submissionRepository.findById(submissionId);
    if (!submission) throw new NotFoundException('Submission not found');

    const assignment = await this.assignmentRepository.findByIdWithLesson(submission.assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.lesson.section.course.authorId !== authorId) {
      throw new ForbiddenException('You can only grade submissions in your own courses');
    }
    if (dto.score > assignment.maxScore) {
      throw new BadRequestException(`Score cannot exceed maxScore of ${assignment.maxScore}`);
    }

    return this.submissionRepository.update(submissionId, {
      score: dto.score,
      feedback: dto.feedback,
      status: 'graded',
      gradedAt: new Date(),
    });
  }
}
