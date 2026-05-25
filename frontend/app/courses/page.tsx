import type { Metadata } from "next";
import CoursesPageClient from "@/components/courses/courses-page-client";
import { JsonLd, absoluteUrl, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Khóa học online",
  description:
    "Khám phá các khóa học online trên LumiLearn theo môn học, trình độ và giáo viên. Học sinh có thể so sánh nội dung, học phí, số bài học và đánh giá trước khi đăng ký.",
  path: "/courses",
  keywords: ["khóa học online", "khóa học LumiLearn", "học Toán online", "học tiếng Anh online", "học lập trình online"],
});

export default function CoursesPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Khóa học online LumiLearn",
            description: metadata.description,
            url: absoluteUrl("/courses"),
            inLanguage: "vi-VN",
            isPartOf: {
              "@type": "WebSite",
              name: "LumiLearn",
              url: absoluteUrl("/"),
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: absoluteUrl("/"),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Khóa học",
                item: absoluteUrl("/courses"),
              },
            ],
          },
        ]}
      />
      <CoursesPageClient />
    </>
  );
}
