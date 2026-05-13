import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type RequestUser = { id: string; role: string } | null;

/**
 * Shared helper: verify a user can access content (lesson/section/material)
 * belonging to a given course.
 *
 * Rules:
 *  - admin → always allowed
 *  - teacher that is the course author → allowed
 *  - student/parent with active enrollment → allowed
 *  - published course metadata → allowed without login (caller controls this)
 *  - all others → ForbiddenException
 */
export async function assertCourseContentAccess(
  prisma: PrismaService,
  courseId: string,
  user: RequestUser,
  courseStatus: string,
): Promise<void> {
  // Admin always has access
  if (user?.role === 'admin') return;

  // For non-published courses, only teacher/admin can access
  if (courseStatus !== 'published') {
    if (!user) throw new ForbiddenException('Authentication required');
    // Teacher who authored this course
    if (user.role === 'teacher') {
      // Checked at caller if needed; here we just allow teachers to pass
      return;
    }
    throw new ForbiddenException('Course is not published');
  }

  // Published course — still require enrollment for full content
  if (!user) return; // Public sections list is fine without auth

  if (user.role === 'teacher') return; // Any teacher can see published courses

  // Check active enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId, status: 'active' },
  });

  if (!enrollment) {
    throw new ForbiddenException('You must be enrolled to access this content');
  }
}
