'use client';

import { useSession } from 'next-auth/react';
import { ManagementShell } from './management-shell';
import { StudentAppShell } from './student-app-shell';
import { TEACHER_NAV_ITEMS, PARENT_NAV_ITEMS } from './management-nav-config';

/**
 * Use under shared routes (profile, notifications, courses, …) so teachers/parents
 * keep the same management sidebar instead of switching to the learner shell (cart/catalog).
 */
export function RoleAwareAppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const role = session?.user?.role;
  if (role === 'teacher') {
    return (
      <ManagementShell panelTitle="Teacher" requiredRole="teacher" navItems={TEACHER_NAV_ITEMS}>
        {children}
      </ManagementShell>
    );
  }
  if (role === 'parent') {
    return (
      <ManagementShell panelTitle="Parent" requiredRole="parent" navItems={PARENT_NAV_ITEMS}>
        {children}
      </ManagementShell>
    );
  }

  return <StudentAppShell>{children}</StudentAppShell>;
}
