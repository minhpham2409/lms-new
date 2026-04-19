import { Metadata } from 'next';
import { UnifiedPageShell } from '@/components/layout/unified-page-shell';
import CoursesPageContent from '@/components/courses/courses-page-content';

export const metadata: Metadata = {
  title: "Khóa học | HọcLộ Trình",
  description: "Duyệt tất cả khóa học trên nền tảng HọcLộ Trình",
};

export default function CoursesPage() {
  return (
    <UnifiedPageShell contentClassName="py-8">
      <div className="w-full max-w-7xl mx-auto">
        <CoursesPageContent />
      </div>
    </UnifiedPageShell>
  );
}
