import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/contact", "/courses", "/teachers", "/terms", "/privacy", "/help"],
        disallow: [
          "/admin",
          "/cart",
          "/dashboard",
          "/orders",
          "/parent",
          "/profile",
          "/settings",
          "/teacher",
          "/notifications",
          "/api",
          "/auth/reset-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
