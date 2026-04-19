"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "next-auth/react";
import {
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Bell,
  LayoutDashboard,
  GraduationCap,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { notificationsApi, cartApi } from "@/lib/api-service";

export function MainNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    const loadNotifications = () => {
      notificationsApi
        .getAll()
        .then((ns) => setUnreadCount(ns.filter((n) => !n.isRead).length))
        .catch(() => {});
    };
    const loadCart = () => {
      cartApi
        .get()
        .then((items) => setCartCount(items.length))
        .catch(() => {});
    };
    loadNotifications();
    loadCart();
    const onRefresh = () => loadNotifications();
    window.addEventListener("focus", onRefresh);
    window.addEventListener("lms-notifications-changed", onRefresh);
    return () => {
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("lms-notifications-changed", onRefresh);
    };
  }, [status, session?.accessToken]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const role = session?.user?.role;

  const navItems = [
    ...(status !== "authenticated" || role === "student"
      ? [{ name: "Courses", path: "/courses", icon: BookOpen }]
      : []),
    ...(session ? [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }] : []),
    ...(role === "teacher" ? [{ name: "My Courses", path: "/teacher", icon: GraduationCap }] : []),
    ...(role === "parent" ? [{ name: "My Children", path: "/parent", icon: Users }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block text-lg">
              Let&apos;s Learn
            </span>
          </Link>
          <nav className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors hover:bg-muted ${
                  isActive(item.path) ? "text-primary bg-primary/10" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {status === "authenticated" ? (
            <>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                      {cartCount}
                    </Badge>
                  )}
                  <span className="sr-only">Cart</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profile">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 bg-background md:hidden overflow-y-auto">
          <div className="container py-6 flex flex-col gap-4 px-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 text-base font-medium px-3 py-2.5 rounded-md transition-colors ${
                    isActive(item.path) ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              {status === "authenticated" && (
                <>
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 text-base font-medium px-3 py-2.5 rounded-md text-muted-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 text-base font-medium px-3 py-2.5 rounded-md text-muted-foreground hover:bg-muted"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="h-5 w-5" />
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                </>
              )}
            </nav>
            <div className="flex flex-col gap-2 pt-2 border-t">
              {status === "authenticated" ? (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </Button>
                  <Button variant="default" onClick={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
