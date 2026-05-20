import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ParentChildRepository, ParentDashboardRepository } from '../database/repositories';
import { LinkChildDto } from './dto';

@Injectable()
export class ParentsService {
  constructor(
    private readonly parentChildRepository: ParentChildRepository,
    private readonly dashboardRepository: ParentDashboardRepository,
  ) {}

  async linkChild(dto: LinkChildDto, parentId: string) {
    const raw = (dto.identifier ?? dto.childId ?? '').trim();
    if (!raw) {
      throw new BadRequestException('Enter the student email, username, or account ID');
    }

    const child = await this.dashboardRepository.resolveStudentUser(raw);
    if (!child) throw new NotFoundException('Student not found');
    if (child.role !== 'student') throw new ForbiddenException('Target user is not a student');
    if (child.id === parentId) throw new ForbiddenException('Cannot link to yourself');

    const existing = await this.parentChildRepository.findLink(parentId, child.id);
    if (existing) throw new ConflictException('Link request already exists');

    return this.parentChildRepository.create({ parentId, childId: child.id, status: 'pending' });
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

    return this.dashboardRepository.getChildEnrollments(childId);
  }

  async getChildCourses(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') throw new ForbiddenException('Not linked to this student');

    return this.dashboardRepository.getChildCourses(childId);
  }

  /** Full snapshot for parent UI: profile, enrollments + lesson stats, certificates, activity counts. */
  async getChildDashboard(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') {
      throw new ForbiddenException('Not linked to this student');
    }

    const child = await this.dashboardRepository.getChildProfile(childId);
    if (!child) throw new NotFoundException('Student not found');

    const enrollments = await this.dashboardRepository.getChildEnrollmentsDetailed(childId);
    const courseIds = enrollments.map(e => e.courseId);

    const [sections, vpRows, certificates, activity] = await Promise.all([
      this.dashboardRepository.getSectionLessonCounts(courseIds),
      this.dashboardRepository.getCompletedVideoLessons(childId, courseIds),
      this.dashboardRepository.getChildCertificates(childId),
      this.dashboardRepository.getActivityCounts(childId),
    ]);

    const totalLessonsByCourse = new Map<string, number>();
    for (const s of sections) {
      totalLessonsByCourse.set(
        s.courseId,
        (totalLessonsByCourse.get(s.courseId) ?? 0) + s._count.lessons,
      );
    }

    const completedLessonsByCourse = new Map<string, number>();
    for (const row of vpRows) {
      const cid = row.lesson.section.courseId;
      completedLessonsByCourse.set(cid, (completedLessonsByCourse.get(cid) ?? 0) + 1);
    }

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
        quizAttempts: activity.quizAttemptsCount,
        assignmentSubmissions: activity.submissionCount,
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

  /** Parent views child's orders */
  async getChildOrders(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') {
      throw new ForbiddenException('Not linked to this student');
    }
    const orders = await this.dashboardRepository.getChildOrders(childId);
    const txnRefs = orders
      .map((order: any) => order.payment?.txnRef)
      .filter((txnRef): txnRef is string => !!txnRef);
    const issues = await this.dashboardRepository.getPaymentIssuesByTxnRefs(txnRefs);
    const issueByTxnRef = new Map<string, any>();
    for (const issue of issues) {
      if (issue.txnRef && !issueByTxnRef.has(issue.txnRef)) {
        issueByTxnRef.set(issue.txnRef, issue);
      }
    }

    return orders.map((order: any) => ({
      ...order,
      paymentIssue: order.payment?.txnRef
        ? issueByTxnRef.get(order.payment.txnRef) ?? null
        : null,
    }));
  }

  /** Parent views child's graded submissions (bảng điểm) */
  async getChildGrades(parentId: string, childId: string) {
    const link = await this.parentChildRepository.findLink(parentId, childId);
    if (!link || link.status !== 'accepted') {
      throw new ForbiddenException('Not linked to this student');
    }
    return this.dashboardRepository.getChildGrades(childId);
  }
}
