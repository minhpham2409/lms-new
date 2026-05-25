import type { Metadata } from "next";

export const SITE_NAME = "LumiLearn";
export const DEFAULT_SITE_URL = "http://localhost:3000";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  DEFAULT_SITE_URL
).replace(/\/$/, "");

export const defaultDescription =
  "LumiLearn là nền tảng học online cho học sinh Việt Nam, kết nối giáo viên, học sinh và phụ huynh với khóa học chất lượng, bài tập tương tác và theo dõi tiến độ.";

export const defaultKeywords = [
  "LumiLearn",
  "học online",
  "khóa học online",
  "LMS Việt Nam",
  "e-learning",
  "học sinh THCS",
  "học sinh THPT",
  "gia sư online",
  "bài tập tương tác",
  "phụ huynh theo dõi học tập",
];

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createMetadata({
  title,
  description = defaultDescription,
  path = "/",
  image = "/images/lumilearn_text_banner.png",
  keywords = [],
  noIndex = false,
  type = "website",
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    keywords: [...defaultKeywords, ...keywords],
    alternates: {
      canonical: url,
      languages: {
        vi: url,
        "vi-VN": url,
      },
    },
    openGraph: {
      title: title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Nền tảng học tập thông minh`,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || SITE_NAME,
        },
      ],
      locale: "vi_VN",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Nền tảng học tập thông minh`,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: siteUrl,
    logo: absoluteUrl("/images/lumilearn_logo_icon.png"),
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      addressCountry: "VN",
      addressLocality: "TP. Hồ Chí Minh",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@lumilearn.edu.vn",
      telephone: "+84-28-3600-0000",
      availableLanguage: ["vi"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/courses")}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
