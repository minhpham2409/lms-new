"use client";

import { Merriweather, Roboto } from "next/font/google";
import "@/styles/landing.css";
import { LandingNavigation } from "./landing-navigation";
import { LandingHomeContent } from "./landing-home-content";
import { LandingFooter } from "./landing-footer";

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

export function LandingPageClient() {
  return (
    <div
      className={`landing-page ${fontHeading.variable} ${fontBody.variable}`}
    >
      <LandingNavigation />
      <LandingHomeContent />
      <LandingFooter />
    </div>
  );
}
