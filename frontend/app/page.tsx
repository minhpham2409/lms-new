import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export const metadata: Metadata = {
  title: "HọcLộ Trình | Nền tảng LMS cho học sinh cấp 2",
  description:
    "LMS kết nối giáo viên, học sinh và phụ huynh: khóa học, bài tập, tiến độ và báo cáo minh bạch.",
  openGraph: {
    title: "HọcLộ Trình | Nền tảng LMS",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return <LandingPageClient />;
}
