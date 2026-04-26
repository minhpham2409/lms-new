import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentRepository, SubmissionRepository } from '../database/repositories';
import { NotificationsService } from '../notifications/notifications.service';
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
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Admin: all; teacher: own course; student: published course + enrolled. */
  private async assertLearnerOrStaffOnCourse(
    user: { id: string; role: string },
    course: { id: string; authorId: string; status: string },
  ) {
    if (user.role === 'admin') return;
    if (user.role === 'teacher') {
      if (course.authorId !== user.id) {
        throw new ForbiddenException('You can only access assignments in your own courses');
      }
      return;
    }
    if (user.role === 'student') {
      if (course.status !== 'published') {
        throw new ForbiddenException('This course is not available');
      }
      const enr = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
      });
      if (!enr) {
        throw new ForbiddenException('You must be enrolled in this course to access assignments');
      }
      return;
    }
    throw new ForbiddenException();
  }

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

  async findByLesson(lessonId: string, user: { id: string; role: string }) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.assertLearnerOrStaffOnCourse(user, lesson.section.course);
    return this.assignmentRepository.findByLessonId(lessonId);
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const assignment = await this.assignmentRepository.findByIdWithLesson(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(user, assignment.lesson.section.course);
    return this.assignmentRepository.model.findUnique({
      where: { id },
      include: { quiz: true },
    });
  }

  /** Student: own submission for this assignment (essay), or null. */
  async getMySubmission(assignmentId: string, studentId: string) {
    const assignment = await this.assignmentRepository.findByIdWithLesson(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(
      { id: studentId, role: 'student' },
      assignment.lesson.section.course,
    );
    return this.submissionRepository.findByAssignmentAndStudent(assignmentId, studentId);
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
    const assignment = await this.assignmentRepository.findByIdWithLesson(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assertLearnerOrStaffOnCourse(
      { id: studentId, role: 'student' },
      assignment.lesson.section.course,
    );
    if (assignment.type !== 'essay') {
      throw new BadRequestException('Use quiz submission endpoint for quiz assignments');
    }

    const existing = await this.submissionRepository.findByAssignmentAndStudent(id, studentId);
    if (existing) throw new ConflictException('You have already submitted this assignment');

    const created = await this.submissionRepository.create({
      assignmentId: id,
      studentId,
      content: dto.content,
      fileUrl: dto.fileUrl,
    });

    this.notificationsService.notifyUser(studentId, {
      title: 'Submission received',
      message: `Your work for "${assignment.title}" was submitted successfully.`,
      type: 'success',
    });

    return created;
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

    const updated = await this.submissionRepository.update(submissionId, {
      score: dto.score,
      feedback: dto.feedback,
      status: 'graded',
      gradedAt: new Date(),
    });

    const fb = dto.feedback?.trim();
    this.notificationsService.notifyUser(submission.studentId, {
      title: 'Assignment graded',
      message: `Your work on "${assignment.title}" was graded: ${dto.score}/${assignment.maxScore}.${fb ? ` Feedback: ${fb}` : ''}`,
      type: 'info',
    });

    return updated;
  }
}
