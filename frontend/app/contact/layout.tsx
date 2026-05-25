import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Liên hệ",
  description:
    "Liên hệ đội ngũ LumiLearn để được hỗ trợ về khóa học, thanh toán, tài khoản học sinh, tài khoản phụ huynh hoặc đăng ký trở thành giáo viên.",
  path: "/contact",
  keywords: ["liên hệ LumiLearn", "hỗ trợ học online", "đăng ký giáo viên LumiLearn"],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
