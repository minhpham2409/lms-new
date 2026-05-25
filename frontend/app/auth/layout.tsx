import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Tài khoản",
  description: "Đăng nhập hoặc đăng ký tài khoản LumiLearn.",
  path: "/auth/login",
  noIndex: true,
});

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
