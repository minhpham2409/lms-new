"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const iconSizes = { sm: 24, md: 30, lg: 38 };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };
  const s = iconSizes[size];

  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight select-none ${textSizes[size]} ${className}`}>
      <Image src="/images/lumilearn_logo_icon.png" alt="LumiLearn" width={s} height={s} className="rounded-lg" />
      <span>
        <span className="text-foreground">Lumi</span>
        <span style={{ color: "var(--primary)" }}>Learn</span>
      </span>
    </span>
  );
}
