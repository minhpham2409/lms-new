import type { Metadata } from "next";
import CourseDetailPageClient from "@/components/courses/course-detail-page-client";
import type { Course } from "@/types";
import { JsonLd, absoluteUrl, createMetadata } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

async function getCourse(id: string): Promise<Course | null> {
  try {
    const res = await fetch(`${API}/courses/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Course;
  } catch {
    return null;
  }
}

function text(value: string | null | undefined, fallback = "") {
  return (value || fallback).replace(/\s+/g, " ").trim();
}

function truncate(value: string, length = 155) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trim()}…`;
}

function instructorName(course: Course) {
  const author = course.author;
  return text(
    author?.firstName ? `${author.firstName} ${author.lastName || ""}` : author?.username,
    "Giáo viên LumiLearn",
  );
}

function lessonCount(course: Course) {
  return course.sections?.reduce((sum, section) => sum + (section.lessons?.length || 0), 0) || 0;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    return createMetadata({
      title: "Không tìm thấy khóa học",
      description: "Khóa học này không tồn tại hoặc chưa được xuất bản trên LumiLearn.",
      path: `/courses/${id}`,
      noIndex: true,
    });
  }

  const title = text(course.title, "Khóa học LumiLearn");
  const description = truncate(
    text(
      course.description,
      `Khóa học ${title} trên LumiLearn do ${instructorName(course)} giảng dạy, có ${lessonCount(course)} bài học và lộ trình học rõ ràng.`,
    ),
  );

  return createMetadata({
    title,
    description,
    path: `/courses/${id}`,
    image: course.imageUrl || "/images/lumilearn_text_banner.png",
    keywords: [title, instructorName(course), "khóa học online", "học online LumiLearn"],
    noIndex: course.status !== "published",
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);
  const title = text(course?.title, "Khóa học LumiLearn");
  const description = text(course?.description, `Thông tin khóa học ${title} trên LumiLearn.`);
  const totalLessons = course ? lessonCount(course) : 0;
  const price = Number(course?.price || 0);
  const rating = course?.averageRating || 4.8;

  return (
    <>
      {course && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Course",
              name: title,
              description,
              url: absoluteUrl(`/courses/${id}`),
              image: absoluteUrl(course.imageUrl || "/images/lumilearn_text_banner.png"),
              inLanguage: "vi-VN",
              provider: {
                "@type": "EducationalOrganization",
                name: "LumiLearn",
                sameAs: absoluteUrl("/"),
              },
              creator: {
                "@type": "Person",
                name: instructorName(course),
              },
              hasCourseInstance: {
                "@type": "CourseInstance",
                courseMode: "online",
                inLanguage: "vi-VN",
                instructor: {
                  "@type": "Person",
                  name: instructorName(course),
                },
              },
              offers: {
                "@type": "Offer",
                price,
                priceCurrency: "VND",
                availability: "https://schema.org/InStock",
                url: absoluteUrl(`/courses/${id}`),
                category: price === 0 ? "Free" : "Paid",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating,
                ratingCount: Math.max(course._count?.enrollments || 1, 1),
                bestRating: 5,
                worstRating: 1,
              },
              educationalLevel: course.level || "Secondary education",
              numberOfCredits: totalLessons,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Khóa học", item: absoluteUrl("/courses") },
                { "@type": "ListItem", position: 3, name: title, item: absoluteUrl(`/courses/${id}`) },
              ],
            },
          ]}
        />
      )}
      <CourseDetailPageClient />
    </>
  );
}
