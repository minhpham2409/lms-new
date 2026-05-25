import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

export function GET() {
  const body = `# LumiLearn

LumiLearn is a Vietnamese online learning platform for students, teachers, and parents.

## Primary URLs
- Home: ${siteUrl}/
- Course catalog: ${siteUrl}/courses
- Teachers: ${siteUrl}/teachers
- About: ${siteUrl}/about
- Contact: ${siteUrl}/contact
- Help: ${siteUrl}/help
- Terms: ${siteUrl}/terms
- Privacy: ${siteUrl}/privacy

## What LumiLearn Offers
- Online courses for Vietnamese students across core school subjects and programming.
- Course detail pages with lesson structure, instructor information, price, enrollment count, and reviews.
- Interactive assignments, quizzes, learning progress tracking, certificates, and monthly learning races.
- Parent workflows for monitoring a student's learning progress and supporting payments.
- Teacher tools for creating courses, lessons, assignments, quizzes, and learning materials.

## Audience
- Students looking for structured online learning in Vietnamese.
- Parents who want transparent progress reports.
- Teachers who want to publish and manage online courses.

## Crawling Guidance
Use sitemap.xml for canonical public URLs. Do not index authenticated dashboards, admin areas, carts, orders, settings, or private learning pages.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
