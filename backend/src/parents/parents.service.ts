import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ParentChildRepository } from '../database/repositories';
import { PrismaService } from '../prisma/prisma.service';
import { LinkChildDto } from './dto';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentChildRepository: ParentChildRepository,
    private readonly prisma: PrismaService,
  ) {}

  async linkChild(dto: LinkChildDto, parentId: string) {
    const raw = (dto.identifier ?? dto.childId ?? '').trim();
    if (!raw) {
      throw new BadRequestException('Enter the student email, username, or account ID');
    }

    const child = await this.resolveStudentUser(raw);
    if (!child) throw new NotFoundException('Student not found');
    if (child.role !== 'student') throw new ForbiddenException('Target user is not a student');
    if (child.id === parentId) throw new ForbiddenException('Cannot link to yourself');

    const existing = await this.parentChildRepository.findLink(parentId, child.id);
    if (existing) throw new ConflictException('Link request already exists');

    return this.parentChildRepository.create({ parentId, childId: child.id, status: 'pending' });
  }

  /** UUID, email (with @), or username — case-insensitive for email/username on SQLite. */
  private async resolveStudentUser(raw: string) {
    const s = raw.trim();
    if (this.looksLikeUuid(s)) {
      return this.prisma.user.findUnique({ where: { id: s } });
    }
    if (s.includes('@')) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM User WHERE lower(email) = lower(${s}) LIMIT 1
      `;
      if (!rows[0]) return null;
      return this.prisma.user.findUnique({ where: { id: rows[0].id } });
    }
    const exact = await this.prisma.user.findUnique({ where: { username: s } });
    if (exact) return exact;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM User WHERE lower(username) = lower(${s}) LIMIT 1
    `;
    if (!rows[0]) return null;
    return this.prisma.user.findUnique({ where: { id: rows[0].id } });
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  async acceptLink(linkId: string, childId: string) {
    const link = await this.parentChildRepository.findById(linkId);
    if (!link) throw new NotFoundException('Link request not found');
    if (link.childId !== childId) throw new ForbiddenException('This request is not for you');
    if (link.status !== 'pending') throw new ConflictException('Request already processed');
    return this.parentChildRepository.update(linkId, { status: 'accepted' });
  }

  async getChildren(parentId: string) {
    return this.parentChildRepository.findChildren(parentId);
  }

  async getOutgoingPending(parentId: string) {
    return this.parentChildRepository.findOutgoingPending(parentId);
  }

  async getPendingForStudent(childId: string) {
    return this.parentChildRepository.findPendingRequest(childId);
  }

  async getChildProgress(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new ForbiddenException('Not linked to this student');

    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
      },
    });
  }

  async getChildCourses(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new ForbiddenException('Not linked to this student');

    return this.prisma.enrollment.findMany({
      where: { userId: childId },
      include: {
        course: {
          include: {
            author: { select: { id: true, username: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }

  /** Full snapshot for parent UI: profile, enrollments + lesson stats, certificates, activity counts. */
  async getChildDashboard(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') {
      throw new ForbiddenException('Not linked to this student');
    }

    const child = await this.prisma.user.findUnique({
      where: { id: childId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        isActive: true,
      },
    });
    if (!child) throw new NotFoundException('Student not found');

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: childId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          include: {
            author: {
              select: { id: true, username: true, firstName: true, lastName: true, email: true },
            },
            _count: { select: { sections: true } },
          },
        },
      },
    });

    const courseIds = enrollments.map(e => e.courseId);

    const sections =
      courseIds.length === 0
        ? []
        : await this.prisma.section.findMany({
            where: { courseId: { in: courseIds } },
            select: { courseId: true, _count: { select: { lessons: true } } },
          });
    const totalLessonsByCourse = new Map<string, number>();
    for (const s of sections) {
      totalLessonsByCourse.set(
        s.courseId,
        (totalLessonsByCourse.get(s.courseId) ?? 0) + s._count.lessons,
      );
    }

    const vpRows =
      courseIds.length === 0
        ? []
        : await this.prisma.videoProgress.findMany({
            where: {
              userId: childId,
              completed: true,
              lesson: { section: { courseId: { in: courseIds } } },
            },
            select: { lesson: { select: { section: { select: { courseId: true } } } } },
          });
    const completedLessonsByCourse = new Map<string, number>();
    for (const row of vpRows) {
      const cid = row.lesson.section.courseId;
      completedLessonsByCourse.set(cid, (completedLessonsByCourse.get(cid) ?? 0) + 1);
    }

    const certificates = await this.prisma.certificate.findMany({
      where: { userId: childId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true, status: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });

    const [quizAttemptsCount, submissionCount] = await Promise.all([
      this.prisma.quizAttempt.count({ where: { studentId: childId } }),
      this.prisma.submission.count({ where: { studentId: childId } }),
    ]);

    const enrollmentRows = enrollments.map(e => ({
      id: e.id,
      userId: e.userId,
      courseId: e.courseId,
      status: e.status,
      progress: e.progress,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      course: e.course,
      stats: {
        totalLessons: totalLessonsByCourse.get(e.courseId) ?? 0,
        completedLessons: completedLessonsByCourse.get(e.courseId) ?? 0,
      },
    }));

    return {
      child,
      link: {
        id: link.id,
        linkedAt: link.createdAt,
        updatedAt: link.updatedAt,
      },
      enrollments: enrollmentRows,
      certificates,
      activity: {
        quizAttempts: quizAttemptsCount,
        assignmentSubmissions: submissionCount,
        videoLessonsCompleted: vpRows.length,
      },
    };
  }

  /** Parent cancels a pending link request they created. */
  async cancelOutgoingLink(parentId: string, linkId: string) {
    const row = await this.parentChildRepository.findById(linkId);
    if (!row || row.parentId !== parentId) throw new NotFoundException('Link request not found');
    if (row.status !== 'pending') throw new BadRequestException('Only pending requests can be cancelled');
    await this.parentChildRepository.delete(linkId);
    return { success: true };
  }

  /** Parent removes an accepted link to a child. */
  async unlinkChild(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new NotFoundException('No active link with this student');
    await this.parentChildRepository.delete(link.id);
    return { success: true };
  }

  /** Student declines a pending parent link request. */
  async rejectIncomingLink(childId: string, linkId: string) {
    const row = await this.parentChildRepository.findById(linkId);
    if (!row || row.childId !== childId) throw new ForbiddenException('This request is not for you');
    if (row.status !== 'pending') throw new BadRequestException('Request already processed');
    await this.parentChildRepository.delete(linkId);
    return { success: true };
  }
}
