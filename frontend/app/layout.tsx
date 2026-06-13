import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "LumiLearn — Nền tảng học tập thông minh",
    template: "%s | LumiLearn",
  },
  description:
    "Nền tảng LMS kết nối giáo viên, học sinh và phụ huynh. Khóa học chất lượng cao, bài tập tương tác, theo dõi tiến độ thời gian thực.",
  keywords: ["học online", "LMS", "e-learning", "học sinh cấp 2", "khóa học"],
  authors: [{ name: "LumiLearn" }],
  openGraph: {
    title: "LumiLearn — Nền tảng học tập thông minh",
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
      <body className="antialiased">
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
