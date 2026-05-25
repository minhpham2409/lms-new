import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Đội ngũ giảng viên",
  description:
    "Khám phá đội ngũ giảng viên trên LumiLearn, xem hồ sơ, số khóa học, chuyên môn và gửi thông tin để trở thành giảng viên.",
  path: "/teachers",
  keywords: ["giảng viên LumiLearn", "giáo viên online", "dạy học online"],
});

export default function TeachersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
