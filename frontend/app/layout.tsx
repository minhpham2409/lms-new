import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

const interFont = Inter({
  variable: "--font-plus-jakarta", // Keep the variable name to avoid breaking other CSS relying on it
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HọcLộ Trình — Nền tảng học tập thông minh",
    template: "%s | HọcLộ Trình",
  },
  description:
    "Nền tảng LMS kết nối giáo viên, học sinh và phụ huynh. Khóa học chất lượng cao, bài tập tương tác, theo dõi tiến độ thời gian thực.",
  keywords: ["học online", "LMS", "e-learning", "học sinh cấp 2", "khóa học"],
  authors: [{ name: "HọcLộ Trình" }],
  openGraph: {
    title: "HọcLộ Trình — Nền tảng học tập thông minh",
    description: "Nền tảng LMS kết nối giáo viên, học sinh và phụ huynh",
    type: "website",
    locale: "vi_VN",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body
        className={`${interFont.variable} ${jetBrainsMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif" }}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--card-border)",
                  color: "var(--foreground)",
                  backdropFilter: "blur(20px)",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
