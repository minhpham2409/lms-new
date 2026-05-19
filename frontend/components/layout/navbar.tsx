"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap, Bell, ShoppingCart, User, Menu, X,
  ChevronDown, LogOut, LayoutDashboard, Zap, Sun, Moon, Trophy, Search, Settings
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/components/auth/auth-state";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => setUserMenuOpen(false);
    if (userMenuOpen) {
      setTimeout(() => document.addEventListener("click", handleClick), 0);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [userMenuOpen]);

  // Fetch notification count and cart count
  const fetchCounts = useCallback(async () => {
    if (!token || !isLoggedIn) return;
    try {
      const [notifRes, cartRes] = await Promise.all([
        fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        user?.role === "student"
          ? fetch(`${API}/cart`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
          : Promise.resolve(null),
      ]);
      if (notifRes?.ok) {
        const notifs = await notifRes.json();
        setNotifCount(Array.isArray(notifs) ? notifs.filter((n: any) => !n.isRead).length : 0);
      }
      if (cartRes?.ok) {
        const cart = await cartRes.json();
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      }
    } catch {}
  }, [token, isLoggedIn, user?.role]);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Re-fetch counts when pathname changes (e.g. after checkout)
  useEffect(() => { fetchCounts(); }, [pathname, fetchCounts]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const userInitial = user?.firstName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || "U";
  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "";

  const dashboardLink = user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/teacher" : user?.role === "parent" ? "/parent" : "/dashboard";

  // Filter nav links based on role
  const userRole = user?.role || null;
  const navLinks = allNavLinks.filter((link) => {
    if (!link.roles) return true;
    return link.roles.includes(userRole);
  });

  if (isLoggedIn && user) {
    navLinks.push({ href: dashboardLink, label: "Dashboard", roles: null });
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 dark:bg-[#1c1d1f]/90 backdrop-blur-md"
      style={{ borderBottom: "1px solid #d1d7dc", boxShadow: scrolled ? "0 2px 4px rgba(0,0,0,0.08)" : "none" }}
    >
      <nav className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[70px] gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 bg-[#5624d0] rounded-full flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:block text-[#2d2f31] dark:text-white">
              HọcLộ Trình
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center shrink-0 gap-1">
            {navLinks.map((link) => (
               <Link key={link.href} href={link.href} className="px-3 py-2 text-sm font-medium hover:text-[#5624d0] transition-colors text-[#2d2f31] dark:text-[#b0b5b9] dark:hover:text-white">
                 {link.label}
               </Link>
            ))}
          </div>

          {/* Search Bar - Udemy Style */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
             <form onSubmit={handleSearch} className="w-full relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6a6f73]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bạn muốn học môn gì hôm nay?" 
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#2d2f31] dark:border-[#6a6f73] bg-transparent focus:outline-none focus:border-[#5624d0] focus:ring-1 focus:ring-[#5624d0] text-sm text-[#2d2f31] dark:text-white placeholder:text-[#b0b5b9]"
                />
             </form>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Theme toggle */}
            <button onClick={toggle} className="p-2 rounded-full hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors"
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
              {theme === "dark" ? <Sun className="w-5 h-5 text-[#e59819]" /> : <Moon className="w-5 h-5 text-[#6a6f73]" />}
            </button>

            {!loading && isLoggedIn && user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications" className="relative p-2 rounded-full hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] text-[#2d2f31] dark:text-white">
                  <Bell className="w-5 h-5" />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ef4444] text-white text-[10px] font-bold flex items-center justify-center">
                      {notifCount > 99 ? "99+" : notifCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                {user.role === "student" && (
                  <Link href="/cart" className="relative p-2 rounded-full hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] text-[#2d2f31] dark:text-white">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#a435f0] text-white text-[10px] font-bold flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User menu */}
                <div className="relative ml-1">
                  <button onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#2d2f31] dark:bg-[#6a6f73]">
                      {userInitial}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#2d2f31] rounded shadow-lg border border-[#d1d7dc] dark:border-[#3e4143] overflow-hidden"
                      onClick={(e) => e.stopPropagation()}>
                      <div className="px-4 py-3 border-b border-[#d1d7dc] dark:border-[#3e4143]">
                        <p className="text-sm font-bold text-[#2d2f31] dark:text-white">{displayName}</p>
                        <p className="text-xs text-[#6a6f73] capitalize">{user.role === "student" ? "Học sinh" : user.role === "teacher" ? "Giáo viên" : user.role === "parent" ? "Phụ huynh" : "Admin"}</p>
                      </div>
                      <div className="py-1">
                        <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2f31] dark:text-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2f31] dark:text-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"><User className="w-4 h-4" /> Hồ sơ</Link>
                        {user.role === "student" && (
                          <Link href="/achievements" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2f31] dark:text-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"><Trophy className="w-4 h-4" /> Thành tích</Link>
                        )}
                        {user.role === "student" && (
                          <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2f31] dark:text-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"><ShoppingCart className="w-4 h-4" /> Đơn hàng</Link>
                        )}
                        <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2d2f31] dark:text-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]"><Settings className="w-4 h-4" /> Cài đặt</Link>
                        <div className="h-px bg-[#d1d7dc] dark:bg-[#3e4143]" />
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#ef4444] hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] w-full"><LogOut className="w-4 h-4" /> Đăng xuất</button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : !loading ? (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-bold text-[#2d2f31] dark:text-white border border-[#2d2f31] dark:border-white hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">Đăng nhập</Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-bold text-white bg-[#2d2f31] dark:bg-white dark:text-[#2d2f31] hover:bg-[#3e4143] dark:hover:bg-[#f7f9fa] transition-colors rounded">
                   Đăng ký
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={toggle} className="p-2" style={{ color: "#6a6f73" }}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isLoggedIn && user && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#2d2f31] dark:bg-[#6a6f73]">{userInitial}</div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2" style={{ color: "#2d2f31" }}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#d1d7dc] dark:border-[#3e4143] bg-white dark:bg-[#1c1d1f]">
          <div className="px-4 py-4 space-y-1">
             <form onSubmit={handleSearch} className="mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm khóa học..." 
                  className="w-full px-4 py-2.5 border border-[#d1d7dc] dark:border-[#3e4143] bg-transparent rounded text-sm"
                />
             </form>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-[#2d2f31] dark:text-[#b0b5b9] hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] rounded">{link.label}</Link>
            ))}
            {isLoggedIn && user ? (
              <div className="pt-3 flex flex-col gap-2 border-t border-[#d1d7dc] dark:border-[#3e4143]">
                <Link href={dashboardLink} onClick={() => setMobileOpen(false)} className="w-full text-center py-2.5 text-sm font-bold border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white rounded">Dashboard</Link>
                <button onClick={handleLogout} className="w-full text-center py-2.5 text-sm font-bold text-[#ef4444] hover:bg-[#fef2f2] rounded">Đăng xuất</button>
              </div>
            ) : (
              <div className="pt-3 flex flex-col gap-2 border-t border-[#d1d7dc] dark:border-[#3e4143]">
                <Link href="/auth/login" className="w-full text-center py-2.5 text-sm font-bold border border-[#2d2f31] dark:border-white text-[#2d2f31] dark:text-white rounded">Đăng nhập</Link>
                <Link href="/auth/register" className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#2d2f31] dark:bg-white dark:text-[#2d2f31] rounded">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
