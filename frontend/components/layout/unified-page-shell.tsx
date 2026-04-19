"use client";

import { Merriweather, Roboto } from "next/font/google";
import "@/styles/landing.css";
import { LandingNavigation } from "@/components/landing/landing-navigation";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ReactNode } from "react";

const fontHeading = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-landing-heading",
});

const fontBody = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  variable: "--font-landing-body",
});

type UnifiedPageShellProps = {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
  contentClassName?: string;
};

export function UnifiedPageShell({
  children,
  hideNav = false,
  hideFooter = false,
  contentClassName = "",
}: UnifiedPageShellProps) {
  return (
    <div
      className={`landing-page flex flex-col min-h-screen ${fontHeading.variable} ${fontBody.variable}`}
    >
      {!hideNav && <LandingNavigation />}
      <main className={`flex-1 ${contentClassName}`}>{children}</main>
      {!hideFooter && <LandingFooter />}
    </div>
  );
}
