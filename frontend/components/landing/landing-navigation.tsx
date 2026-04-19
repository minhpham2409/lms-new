"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function LandingNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navigation-root">
      <div className="navigation-container">
        <Link href="/" className="navigation-brand">
          <span className="navigation-brand-name">HọcLộ Trình</span>
        </Link>
        <div className="navigation-desktop-menu">
          <nav className="navigation-links" aria-label="Chính">
            <Link href="/courses" className="navigation-link">
              Khóa học
            </Link>
            <Link href="/about" className="navigation-link">
              Giới thiệu
            </Link>
            <Link href="/contact" className="navigation-link">
              Liên hệ
            </Link>
          </nav>
          <div className="navigation-actions">
            <Link href="/auth/signin" className="navigation-link">
              Đăng nhập
            </Link>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              Đăng ký
            </Link>
          </div>
        </div>
        <button
          type="button"
          className="navigation-mobile-toggle"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <div
        className={`navigation-overlay ${open ? "is-active" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="navigation-overlay-header">
          <span className="navigation-brand-name">HọcLộ Trình</span>
          <button
            type="button"
            className="navigation-mobile-close"
            aria-label="Đóng"
            onClick={() => setOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <div className="navigation-overlay-content">
          <nav className="navigation-overlay-links">
            <Link
              href="/courses"
              className="navigation-overlay-link"
              onClick={() => setOpen(false)}
            >
              Khóa học
            </Link>
            <Link
              href="/about"
              className="navigation-overlay-link"
              onClick={() => setOpen(false)}
            >
              Giới thiệu
            </Link>
            <Link
              href="/contact"
              className="navigation-overlay-link"
              onClick={() => setOpen(false)}
            >
              Liên hệ
            </Link>
          </nav>
          <div className="navigation-overlay-actions">
            <Link
              href="/auth/signin"
              className="btn btn-outline btn-lg"
              onClick={() => setOpen(false)}
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-primary btn-lg"
              onClick={() => setOpen(false)}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
