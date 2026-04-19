import { DashboardLayout } from '@/components/layout/unified-page-shell';
import VideoPlayer from '@/components/courses/video-player';

interface LessonPageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, lessonId } = await params;
  return (
    <DashboardLayout contentClassName="py-0">
      <VideoPlayer courseId={id} lessonId={lessonId} />
    </DashboardLayout>
  );
}
