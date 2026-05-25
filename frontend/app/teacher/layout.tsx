import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Khu vực giáo viên",
  description: "Không gian quản lý khóa học dành cho giáo viên LumiLearn.",
  path: "/teacher",
  noIndex: true,
});

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return children;
}
