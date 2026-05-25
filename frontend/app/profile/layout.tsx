import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Hồ sơ cá nhân",
  description: "Hồ sơ cá nhân của người dùng LumiLearn.",
  path: "/profile",
  noIndex: true,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
