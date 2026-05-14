"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap, Bell, ShoppingCart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Zap, Sun, Moon, Trophy,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth/auth-state";

const allNavLinks = [
  { href: "/courses", label: "Khóa học", roles: ["student", null] },
  { href: "/teachers", label: "Giáo viên", roles: null },
  { href: "/achievements", label: "Thành tích", roles: ["student"] },
  { href: "/monthly-race", label: "Thi đua tháng", roles: ["student"] },
  { href: "/about", label: "Giới thiệu", roles: null }, // visible to all
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user, isLoggedIn, logout, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      setTimeout(() => document.addEventListener("click", handleClick), 0);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  const bg = theme === "dark"
    ? (scrolled ? "rgba(8,12,20,0.92)" : "rgba(8,12,20,0)")
    : (scrolled ? "rgba(248,249,252,0.92)" : "rgba(248,249,252,0)");

  const userInitial = user?.firstName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || "U";
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "";

  const dashboardLink = user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : user?.role === "parent" ? "/parent" : "/dashboard";

  // Filter nav links based on role: "Khóa học" only for students & guests
  const userRole = user?.role || null;
  const navLinks = allNavLinks.filter((link) => {
    if (!link.roles) return true; // visible to all
    return link.roles.includes(userRole);
  });

  if (isLoggedIn && user) {
    navLinks.push({ href: dashboardLink, label: "Dashboard", roles: null });
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ background: bg, backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid var(--border)" : "none" }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="gradient-text">HọcLộ</span>
              <span style={{ color: "var(--foreground)" }}>Trình</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === link.href ? "bg-[var(--muted)]" : "hover:bg-[var(--muted)]"}`}
                style={{ color: pathname === link.href ? "var(--foreground)" : "var(--foreground-muted)" }}
              >{link.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme toggle */}
            <button onClick={toggle} className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
              {theme === "dark" ? <Sun className="w-4 h-4" style={{ color: "#f59e0b" }} /> : <Moon className="w-4 h-4" style={{ color: "#7c3aed" }} />}
            </button>

            {!loading && isLoggedIn && user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 rounded-lg transition-all duration-200 hover:bg-[var(--muted)]" style={{ color: "var(--foreground-muted)" }}>
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#7c3aed" }} />
                </Link>

                {/* Cart — only for students */}
                {user.role === "student" && (
                  <Link href="/cart" className="relative p-2 rounded-lg transition-all duration-200 hover:bg-[var(--muted)]" style={{ color: "var(--foreground-muted)" }}>
                    <ShoppingCart className="w-5 h-5" />
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-[var(--muted)]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                      {userInitial}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate hidden lg:block">{displayName}</span>
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
                      style={{ background: "var(--popover)", border: "1px solid var(--border)", backdropFilter: "blur(24px)" }}
                      onClick={(e) => e.stopPropagation()}>
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-sm font-semibold">{displayName}</p>
                        <p className="text-xs capitalize" style={{ color: "var(--foreground-muted)" }}>{user.role === "student" ? "Học sinh" : user.role === "teacher" ? "Giáo viên" : user.role === "parent" ? "Phụ huynh" : "Admin"}</p>
                      </div>
                      <div className="p-2">
                        <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start"><User className="w-4 h-4" /> Hồ sơ</Link>
                        {user.role === "student" && (
                          <Link href="/achievements" onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start"><Trophy className="w-4 h-4" /> Thành tích</Link>
                        )}
                        {user.role === "student" && (
                          <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="btn-ghost w-full justify-start"><ShoppingCart className="w-4 h-4" /> Đơn hàng</Link>
                        )}
                        <button onClick={handleLogout} className="btn-ghost w-full justify-start" style={{ color: "#ef4444" }}><LogOut className="w-4 h-4" /> Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">Đăng nhập</Link>
                <Link href="/auth/register" className="btn-primary text-sm px-5 py-2.5">
                  <Zap className="w-4 h-4" /> Bắt đầu miễn phí
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isLoggedIn && user && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>{userInitial}</div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg" style={{ color: "var(--foreground-muted)" }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t" style={{ background: "var(--popover)", borderColor: "var(--border)", backdropFilter: "blur(24px)" }}>
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ color: "var(--foreground-muted)" }}>{link.label}</Link>
            ))}
            {isLoggedIn && user ? (
              <div className="pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center">Dashboard</Link>
                <button onClick={handleLogout} className="btn-ghost w-full justify-center" style={{ color: "#ef4444" }}>Đăng xuất</button>
              </div>
            ) : (
              <div className="pt-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                <Link href="/auth/login" className="btn-secondary w-full justify-center">Đăng nhập</Link>
                <Link href="/auth/register" className="btn-primary w-full justify-center">Bắt đầu miễn phí</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
