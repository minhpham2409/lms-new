import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/landing-page-client";
import { JsonLd, absoluteUrl, createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Học online cùng giáo viên Việt Nam",
  description:
    "LumiLearn giúp học sinh học online với khóa học chất lượng, bài tập tương tác, thi đua tháng và báo cáo tiến độ minh bạch cho phụ huynh.",
  path: "/",
  keywords: ["học online Việt Nam", "nền tảng học tập", "khóa học THCS", "khóa học THPT"],
});

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Tính năng học tập nổi bật của LumiLearn",
          itemListElement: [
            "Khóa học online theo môn học",
            "Bài tập và quiz tương tác",
            "Theo dõi tiến độ học tập",
            "Phụ huynh đồng hành cùng học sinh",
          ].map((name, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name,
            url: absoluteUrl(index === 0 ? "/courses" : "/"),
          })),
        }}
      />
      <LandingPageClient />
    </>
  );
}
