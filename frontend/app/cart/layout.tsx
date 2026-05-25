import type { Metadata } from "next";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Giỏ hàng",
  description: "Giỏ hàng cá nhân trên LumiLearn.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
