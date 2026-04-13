import VideoPlayer from '@/components/courses/video-player';

interface LessonPageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { id, lessonId } = await params;
  return <VideoPlayer courseId={id} lessonId={lessonId} />;
}
