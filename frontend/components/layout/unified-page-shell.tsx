"use client";

import "@/styles/landing.css";
import { LandingNavigation } from "@/components/landing/landing-navigation";
import { LandingFooter } from "@/components/landing/landing-footer";
import { ReactNode } from "react";

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
    <div className="landing-page flex flex-col min-h-screen">
      {!hideNav && <LandingNavigation />}
      <main className={`flex-1 ${contentClassName}`}>{children}</main>
      {!hideFooter && <LandingFooter />}
    </div>
  );
}
