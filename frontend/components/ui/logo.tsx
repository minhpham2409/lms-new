"use client";

import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Premium SVG Icon combining a glowing book and a star of wisdom (Luminescence) */}
      <div className={`relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${iconSizes[size]}`}>
        {/* Glow behind the logo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1d4ed8] to-[#3b82f6] rounded-none blur-md opacity-25 group-hover:opacity-40 transition-opacity duration-300" />
        
        {/* Main Logo Body */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
        >
          {/* Background shape */}
          <rect width="100" height="100" rx="0" fill="url(#logo-grad)" />
          
          {/* Open Book Geometry */}
          <path
            d="M28 58C36.5 58 45 61 50 63.5C55 61 63.5 58 72 58V38C63.5 38 55 41 50 43.5C45 41 36.5 38 28 38V58Z"
            fill="white"
            fillOpacity="0.15"
          />
          <path
            d="M50 43.5V63.5"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="square"
            strokeOpacity="0.4"
          />
          
          {/* Glowing Sparkle / Star of Wisdom */}
          <path
            d="M50 20C50 30 46 34 36 34C46 34 50 38 50 48C50 38 54 34 64 34C54 34 50 30 50 20Z"
            fill="url(#star-grad)"
          />
          
          {/* Subtle swoosh underneath */}
          <path
            d="M26 66C40 72 60 72 74 66"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="square"
            strokeOpacity="0.7"
          />

          {/* Definitions for Gradients */}
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="star-grad" x1="36" y1="34" x2="64" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF9E6" />
              <stop offset="0.5" stopColor="#FFD875" />
              <stop offset="1" stopColor="#FFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Styled Text */}
      {!iconOnly && (
        <span className={`font-extrabold tracking-tight select-none transition-colors duration-200 ${textSizes[size]}`}>
          <span className="text-[#2d2f31] dark:text-white group-hover:text-[#2563eb] dark:group-hover:text-[#3b82f6] transition-colors duration-300">
            Lumi
          </span>
          <span className="bg-gradient-to-r from-[#3b82f6] to-[#1d4ed8] bg-clip-text text-transparent">
            Learn
          </span>
        </span>
      )}
    </div>
  );
}
