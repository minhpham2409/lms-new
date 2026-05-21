"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth/auth-state";
import { Logo } from "@/components/ui/logo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const allNavLinks = [
  { href: "/courses", label: "Khóa học", roles: ["student", null] },
  { href: "/teachers", label: "Giáo viên", roles: null },
  { href: "/about", label: "Giới thiệu", roles: null },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifCount, setNotifCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, isLoggedIn, logout, loading, token } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      setTimeout(() => document.addEventListener("click", handleClick), 0);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [userMenuOpen]);

  const fetchCounts = useCallback(async () => {
    if (!token || !isLoggedIn) return;
    try {
      const [notifRes, cartRes] = await Promise.all([
        fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        user?.role === "student" ? fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null) : Promise.resolve(null),
      ]);
      if (notifRes?.ok) { const n = await notifRes.json(); setNotifCount(Array.isArray(n) ? n.filter((x: any) => !x.isRead).length : 0); }
      if (cartRes?.ok) { const c = await cartRes.json(); setCartCount(Array.isArray(c) ? c.length : 0); }
    } catch {}
  }, [token, isLoggedIn, user?.role]);

  useEffect(() => { fetchCounts(); const i = setInterval(fetchCounts, 15000); return () => clearInterval(i); }, [fetchCounts]);
  useEffect(() => { fetchCounts(); }, [pathname, fetchCounts]);

  const handleLogout = () => { logout(); setUserMenuOpen(false); router.push("/"); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/courses?search=${encodeURIComponent(searchQuery)}`); };

  const userInitial = user?.firstName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || "U";
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "";
  const dashboardLink = user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : user?.role === "parent" ? "/parent" : "/dashboard";
  const roleLabel = user?.role === "student" ? "Học sinh" : user?.role === "teacher" ? "Giáo viên" : user?.role === "parent" ? "Phụ huynh" : "Admin";

  const userRole = user?.role || null;
  const navLinks = allNavLinks.filter((l) => !l.roles || l.roles.includes(userRole));
  if (isLoggedIn && user) navLinks.push({ href: dashboardLink, label: "Dashboard", roles: null });

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? (theme === "dark" ? "rgba(5,16,37,0.95)" : "rgba(248,250,252,0.95)")
          : (theme === "dark" ? "rgba(5,16,37,0.8)" : "rgba(248,250,252,0.8)"),
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? `1px solid var(--border)` : "1px solid transparent",
      }}
    >
      <nav className="max-w-[1200px] mx-auto px-6 sm:px-10">
        <div className="flex items-center justify-between h-[64px] gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0"><Logo size="lg" /></Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}
                className="px-3 py-2 text-sm font-semibold rounded-lg transition-colors"
                style={{ color: pathname === l.href ? "var(--primary)" : "var(--muted-foreground)" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="w-full">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm khóa học..."
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: "var(--muted)", border: `1.5px solid var(--border)`, color: "var(--foreground)" }}
                onFocus={e => { e.target.style.borderColor = "var(--primary)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; }}
              />
            </form>
          </div>

          {/* Right */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Theme toggle — text */}
            <button onClick={toggle}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ color: "var(--muted-foreground)" }}>
              {theme === "dark" ? "☀ Sáng" : "☾ Tối"}
            </button>

            {!loading && isLoggedIn && user ? (
              <>
                {/* Notifications — text badge */}
                <Link href="/notifications"
                  className="relative px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  style={{ color: "var(--muted-foreground)" }}>
                  Thông báo
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: "var(--destructive)", color: "#fff" }}>
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </Link>

                {/* Cart — text */}
                {user.role === "student" && (
                  <Link href="/cart"
                    className="relative px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ color: "var(--muted-foreground)" }}>
                    Giỏ hàng
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User menu */}
                <div className="relative ml-1">
                  <button onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{ color: "var(--foreground)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                      {userInitial}
                    </div>
                    <span className="text-sm font-semibold">{displayName.split(" ")[0]}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden"
                      style={{ background: "var(--card)", border: `1px solid var(--border)`, boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}
                      onClick={(e) => e.stopPropagation()}>
                      <div className="px-4 py-3" style={{ borderBottom: `1px solid var(--border)` }}>
                        <p className="text-sm font-bold">{displayName}</p>
                        <p className="text-xs" style={{ color: "var(--primary)" }}>{roleLabel}</p>
                      </div>
                      <div className="py-1">
                        <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]">Dashboard</Link>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]">Hồ sơ</Link>
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]">Cài đặt</Link>
                        <div className="h-px mx-3" style={{ background: "var(--border)" }} />
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]" style={{ color: "var(--destructive)" }}>Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : !loading ? (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors" style={{ color: "var(--primary)" }}>Đăng nhập</Link>
                <Link href="/auth/register" className="px-4 py-2.5 text-sm font-bold rounded-lg transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Đăng ký
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 pt-2" style={{ borderTop: `1px solid var(--border)` }}>
            <form onSubmit={handleSearch} className="mb-3">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm..." className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "var(--muted)", border: `1px solid var(--border)` }} />
            </form>
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                style={{ color: pathname === l.href ? "var(--primary)" : "var(--muted-foreground)" }}>
                {l.label}
              </Link>
            ))}
            <div className="h-px my-2" style={{ background: "var(--border)" }} />
            <button onClick={toggle} className="block px-4 py-2.5 text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
              {theme === "dark" ? "☀ Chế độ sáng" : "☾ Chế độ tối"}
            </button>
            {!loading && !isLoggedIn && (
              <div className="flex gap-2 mt-3 px-4">
                <Link href="/auth/login" className="flex-1 text-center py-2.5 text-sm font-bold rounded-lg" style={{ border: `1.5px solid var(--primary)`, color: "var(--primary)" }}>Đăng nhập</Link>
                <Link href="/auth/register" className="flex-1 text-center py-2.5 text-sm font-bold rounded-lg" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Đăng ký</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
