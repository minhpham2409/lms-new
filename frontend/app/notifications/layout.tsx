import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Thông báo",
  description: "Thông báo cá nhân trên LumiLearn.",
  path: "/notifications",
  noIndex: true,
});

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
