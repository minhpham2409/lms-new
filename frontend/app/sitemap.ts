import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type SitemapCourse = {
  id: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

async function getPublishedCourses(): Promise<SitemapCourse[]> {
  try {
    const res = await fetch(`${API}/courses`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const courses = await res.json();
    if (!Array.isArray(courses)) return [];
    return courses.filter((course) => course?.id && course?.status === "published");
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/courses"), lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: absoluteUrl("/teachers"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/help"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const courseRoutes = (await getPublishedCourses()).map((course) => ({
    url: absoluteUrl(`/courses/${course.id}`),
    lastModified: course.updatedAt || course.createdAt || now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...courseRoutes];
}
