"use client";

import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const iconSizes = { sm: "w-8 h-8", md: "w-9 h-9", lg: "w-12 h-12" };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Unique SVG Icon: Orbiting Knowledge — a glowing planet with book rings */}
      <div className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(99,102,241,0.5)]"
        >
          <defs>
            <linearGradient id="ll-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" />
              <stop offset="0.5" stopColor="#7c3aed" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="ll-star" x1="18" y1="8" x2="30" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef9c3" />
              <stop offset="1" stopColor="#fbbf24" />
            </linearGradient>
            <radialGradient id="ll-glow" cx="50%" cy="50%" r="50%">
              <stop stopColor="#a5b4fc" stopOpacity="0.6" />
              <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
            <filter id="ll-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
            </filter>
          </defs>

          {/* Glow circle */}
          <circle cx="24" cy="24" r="22" fill="url(#ll-glow)" filter="url(#ll-blur)" opacity="0.7" />

          {/* Main rounded square background */}
          <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#ll-bg)" />

          {/* Inner light overlay */}
          <rect x="2" y="2" width="44" height="22" rx="14" fill="white" fillOpacity="0.06" />

          {/* Book pages - left page */}
          <path
            d="M12 31V17C12 16.4 12.4 16 13 16C15.5 16 18.5 17 20 18.5V32.5C18.5 31.2 15.5 30.2 13 30.2C12.4 30.2 12 30.6 12 31Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Book pages - right page */}
          <path
            d="M36 31V17C36 16.4 35.6 16 35 16C32.5 16 29.5 17 28 18.5V32.5C29.5 31.2 32.5 30.2 35 30.2C35.6 30.2 36 30.6 36 31Z"
            fill="white"
            fillOpacity="0.75"
          />
          {/* Book spine */}
          <rect x="23" y="17" width="2" height="15.5" rx="1" fill="white" fillOpacity="0.5" />

          {/* 4-point star / sparkle top-right */}
          <path
            d="M33 10C33 13 31.5 14.5 28.5 14.5C31.5 14.5 33 16 33 19C33 16 34.5 14.5 37.5 14.5C34.5 14.5 33 13 33 10Z"
            fill="url(#ll-star)"
          />

          {/* Tiny dot accent */}
          <circle cx="15" cy="12" r="1.5" fill="white" fillOpacity="0.6" />
        </svg>
      </div>

      {/* Styled Text */}
      {!iconOnly && (
        <span className={`font-extrabold tracking-tight select-none ${textSizes[size]}`}>
          <span className="text-foreground dark:text-white group-hover:text-[#6366f1] dark:group-hover:text-[#818cf8] transition-colors duration-200">
            Lumi
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #7c3aed, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Learn
          </span>
        </span>
      )}
    </div>
  );
}
