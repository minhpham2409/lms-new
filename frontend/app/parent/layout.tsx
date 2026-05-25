import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Khu vực phụ huynh",
  description: "Không gian theo dõi học tập dành cho phụ huynh trên LumiLearn.",
  path: "/parent",
  noIndex: true,
});

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
