import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseDetailContent from '@/components/courses/course-detail-content';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCourse(id: string) {
  const res = await fetch(`${API_URL}/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

async function getReviews(id: string) {
  try {
    const res = await fetch(`${API_URL}/courses/${id}/reviews`, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  if (!course) return { title: "Course Not Found | Let's Learn" };
  return {
    title: `${course.title} | Let's Learn`,
    description: course.description || "Join this course on Let's Learn platform",
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [course, reviews] = await Promise.all([getCourse(id), getReviews(id)]);
  if (!course) notFound();
  return <CourseDetailContent course={course} reviews={reviews} />;
}
