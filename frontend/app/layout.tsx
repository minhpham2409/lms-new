import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  JsonLd,
  absoluteUrl,
  createMetadata,
  organizationJsonLd,
  siteUrl,
  websiteJsonLd,
} from "@/lib/seo";

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
  ...createMetadata({ path: "/" }),
  metadataBase: new URL(siteUrl),
  title: {
    default: "LumiLearn - Nền tảng học tập thông minh",
    template: "%s | LumiLearn",
  },
  applicationName: "LumiLearn",
  authors: [{ name: "LumiLearn" }],
  creator: "LumiLearn",
  publisher: "LumiLearn",
  category: "education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/lumilearn_logo_icon.png",
  },
  manifest: absoluteUrl("/manifest.webmanifest"),
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
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
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
