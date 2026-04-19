import { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import CoursesPageContent from '@/components/courses/courses-page-content';

export const metadata: Metadata = {
  title: "Khóa học | HọcLộ Trình",
  description: "Duyệt tất cả khóa học trên nền tảng HọcLộ Trình",
};

export default function CoursesPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto">
        <CoursesPageContent />
      </div>
    </DashboardLayout>
  );
}
