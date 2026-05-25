import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Về LumiLearn",
  description:
    "Tìm hiểu sứ mệnh của LumiLearn trong việc đổi mới giáo dục Việt Nam bằng khóa học online, bài tập tương tác và công cụ theo dõi tiến độ cho phụ huynh.",
  path: "/about",
  keywords: ["về LumiLearn", "giáo dục Việt Nam", "nền tảng LMS"],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
