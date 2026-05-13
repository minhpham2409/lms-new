"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Search, BookOpen, Clock, Users, Star, Play, Grid3X3, List, Loader2,
  Sparkles, Filter, TrendingUp, ArrowRight,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const categories = ["Tất cả", "Toán", "Lý", "Hóa", "Sinh", "Anh văn", "Văn", "Lập trình"];

const colorMap: Record<string, string> = {
  "Toán": "#7c3aed", "Lý": "#3b82f6", "Hóa": "#f59e0b", "Sinh": "#10b981",
  "Anh văn": "#0891b2", "Văn": "#ec4899", "Lập trình": "#f97316",
};

const gradientMap: Record<string, string> = {
  "Toán": "linear-gradient(135deg, #7c3aed, #4f46e5)",
  "Lý": "linear-gradient(135deg, #3b82f6, #2563eb)",
  "Hóa": "linear-gradient(135deg, #f59e0b, #d97706)",
  "Sinh": "linear-gradient(135deg, #10b981, #059669)",
  "Anh văn": "linear-gradient(135deg, #0891b2, #0e7490)",
  "Văn": "linear-gradient(135deg, #ec4899, #db2777)",
  "Lập trình": "linear-gradient(135deg, #f97316, #ea580c)",
};

const emojiMap: Record<string, string> = {
  "Toán": "📐", "Lý": "⚡", "Hóa": "🧪", "Sinh": "🧬",
  "Anh văn": "🌍", "Văn": "📖", "Lập trình": "💻",
};

function guessCategory(title: string): string {
  if (/toán/i.test(title)) return "Toán";
  if (/lý|vật lý/i.test(title)) return "Lý";
  if (/hóa/i.test(title)) return "Hóa";
  if (/sinh/i.test(title)) return "Sinh";
  if (/anh|english/i.test(title)) return "Anh văn";
  if (/văn|ngữ/i.test(title)) return "Văn";
  if (/python|lập trình|code/i.test(title)) return "Lập trình";
  return "Toán";
}

interface CourseItem {
  id: string; title: string; description: string; price: number; status: string;
  author: { username: string; firstName?: string; lastName?: string };
  sections?: { _count?: { lessons: number } }[];
  _count: { enrollments: number };
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = search.trim() ? `${API}/courses/search?q=${encodeURIComponent(search.trim())}` : `${API}/courses`;
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(url).then((r) => r.json()).then((data) => {
        setCourses(Array.isArray(data) ? data.filter((c: any) => c.status === "published") : []);
      }).catch(() => {}).finally(() => setLoading(false));
    }, search.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = courses.filter((c) => {
    const cat = guessCategory(c.title);
    return activeCategory === "Tất cả" || cat === activeCategory;
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="orb orb-violet w-[500px] h-[500px] -top-40 right-[-150px] opacity-30" />
        <div className="orb orb-cyan w-[300px] h-[300px] top-20 left-[-100px] opacity-20" />
        <div className="absolute inset-0 dot-pattern opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl">
            <div className="section-tag mb-5 animate-slide-up">
              <Sparkles className="w-3.5 h-3.5" /> Khám phá khóa học
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 animate-slide-up animate-delay-100">
              Tìm kiếm{" "}
              <span className="text-shimmer">khóa học phù hợp</span>
            </h1>
            <p className="text-base sm:text-lg mb-8 animate-slide-up animate-delay-200" style={{ color: "var(--foreground-muted)" }}>
              Khóa học chất lượng cao từ các giáo viên hàng đầu, được thiết kế dành riêng cho học sinh
            </p>

            {/* Search bar — premium */}
            <div className="relative animate-slide-up animate-delay-300">
              <div className="glass-card rounded-2xl p-1.5 flex items-center gap-2"
                style={{ boxShadow: "0 8px 40px rgba(124,58,237,0.1)" }}>
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm theo tên khóa học, môn học..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: "transparent", color: "var(--foreground)" }} />
                </div>
                <button className="btn-primary py-3 px-6 rounded-xl text-sm flex-shrink-0">
                  <Search className="w-4 h-4" /> Tìm
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-8 animate-slide-up animate-delay-400">
            {[
              { label: "Khóa học", value: courses.length, icon: BookOpen, color: "#7c3aed" },
              { label: "Giáo viên", value: new Set(courses.map(c => c.author?.username)).size, icon: Users, color: "#0891b2" },
              { label: "Miễn phí", value: courses.filter(c => c.price === 0).length, icon: Star, color: "#10b981" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-lg font-extrabold">{value}</p>
                  <p className="text-[10px] -mt-0.5" style={{ color: "var(--foreground-muted)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient separator */}
      <div className="gradient-line" />

      {/* Filters */}
      <section className="py-6 sticky top-16 z-30" style={{ background: "var(--background)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const color = cat === "Tất cả" ? "#7c3aed" : (colorMap[cat] || "#7c3aed");
                return (
                  <button key={cat} onClick={() => setActiveCategory(cat)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5"
                    style={{
                      background: isActive ? `${color}22` : "var(--muted)",
                      border: `1px solid ${isActive ? `${color}55` : "var(--border)"}`,
                      color: isActive ? color : "var(--foreground-muted)",
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                    }}>
                    {cat !== "Tất cả" && <span className="text-xs">{emojiMap[cat]}</span>}
                    {cat}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setView("grid")} className="p-2.5 rounded-xl transition-all duration-200"
                style={{ background: view === "grid" ? "rgba(124,58,237,0.2)" : "var(--muted)", border: `1px solid ${view === "grid" ? "rgba(124,58,237,0.4)" : "var(--border)"}` }}>
                <Grid3X3 className="w-4 h-4" style={{ color: view === "grid" ? "#a78bfa" : "var(--foreground-muted)" }} />
              </button>
              <button onClick={() => setView("list")} className="p-2.5 rounded-xl transition-all duration-200"
                style={{ background: view === "list" ? "rgba(124,58,237,0.2)" : "var(--muted)", border: `1px solid ${view === "list" ? "rgba(124,58,237,0.4)" : "var(--border)"}` }}>
                <List className="w-4 h-4" style={{ color: view === "list" ? "#a78bfa" : "var(--foreground-muted)" }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="pb-24 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results count */}
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            Hiển thị <strong style={{ color: "var(--foreground)" }}>{filtered.length}</strong> khóa học
            {activeCategory !== "Tất cả" && <> trong <strong style={{ color: colorMap[activeCategory] || "var(--foreground)" }}>{activeCategory}</strong></>}
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center gradient-animated">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Đang tải khóa học...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 card-base">
              <BookOpen className="w-14 h-14 mx-auto mb-4 opacity-30" style={{ color: "#7c3aed" }} />
              <h3 className="text-lg font-bold mb-2">Không tìm thấy khóa học</h3>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Thử thay đổi từ khóa hoặc bộ lọc</p>
              <button onClick={() => { setSearch(""); setActiveCategory("Tất cả"); }} className="btn-secondary text-sm">
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className={view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filtered.map((course, index) => {
                const cat = guessCategory(course.title);
                const color = colorMap[cat] || "#7c3aed";
                const gradient = gradientMap[cat] || "linear-gradient(135deg, #7c3aed, #4f46e5)";
                const emoji = emojiMap[cat] || "📐";
                const authorName = course.author?.firstName || course.author?.username || "Giáo viên";
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div
                      className={`card-base card-spotlight hover-lift overflow-hidden group ${view === "list" ? "flex gap-6" : ""}`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      {/* Thumbnail */}
                      <div className={`relative overflow-hidden ${view === "list" ? "w-48 flex-shrink-0 rounded-xl" : "aspect-[16/9] rounded-t-2xl -mx-6 -mt-6 mb-5"}`}
                        style={{ background: `${color}0a` }}>
                        {/* Gradient overlay */}
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }} />
                        {/* Animated pattern */}
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                          backgroundSize: "20px 20px", color,
                        }} />
                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
                            style={{ background: `${color}15`, backdropFilter: "blur(8px)" }}>
                            {emoji}
                          </div>
                        </div>
                        {/* Price badge */}
                        <div className="absolute top-3 right-3">
                          <span className="badge text-xs font-bold backdrop-blur-sm" style={{
                            background: course.price === 0 ? "rgba(16,185,129,0.25)" : "rgba(124,58,237,0.25)",
                            color: course.price === 0 ? "#34d399" : "#a78bfa",
                            border: `1px solid ${course.price === 0 ? "rgba(16,185,129,0.4)" : "rgba(124,58,237,0.4)"}`,
                          }}>{course.price === 0 ? "✨ Miễn phí" : `${(course.price / 1000).toFixed(0)}k ₫`}</span>
                        </div>
                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                          <span className="badge text-[10px] backdrop-blur-sm" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                            {emoji} {cat}
                          </span>
                        </div>
                        {/* Bottom gradient fade */}
                        <div className="absolute bottom-0 left-0 right-0 h-12" style={{
                          background: "linear-gradient(to top, var(--card), transparent)"
                        }} />
                      </div>

                      <div className={view === "list" ? "py-4 flex-1" : ""}>
                        <h3 className="font-bold mb-2 line-clamp-1 group-hover:text-[#a78bfa] transition-colors">{course.title}</h3>
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>{course.description}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
                          <span className="flex items-center gap-1.5">
                            <Play className="w-3 h-3" style={{ color }} />
                            {course.sections?.reduce((acc, s) => acc + (s._count?.lessons || 0), 0) || 0} bài học
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" style={{ color: "#0891b2" }} /> {course._count?.enrollments || 0} học sinh
                          </span>
                        </div>

                        {/* Author + CTA */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ background: gradient }}>
                              {authorName.charAt(0)}
                            </div>
                            <span className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>{authorName}</span>
                          </div>
                          <span className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color }}>
                            Xem chi tiết <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
