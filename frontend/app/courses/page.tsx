"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Search, BookOpen, Clock, Users, Star, Play, Grid3X3, List, Loader2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const categories = ["Tất cả", "Toán", "Lý", "Hóa", "Sinh", "Anh văn", "Văn", "Lập trình"];

const colorMap: Record<string, string> = {
  "Toán": "#7c3aed", "Lý": "#3b82f6", "Hóa": "#f59e0b", "Sinh": "#10b981",
  "Anh văn": "#0891b2", "Văn": "#ec4899", "Lập trình": "#f97316",
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
  _count: { sections: number; enrollments: number };
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

      <section className="pt-24 pb-12 relative overflow-hidden">
        <div className="orb orb-violet w-[400px] h-[400px] -top-40 right-[-100px] opacity-25" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="section-tag mb-4"><BookOpen className="w-3.5 h-3.5" /> Khám phá khóa học</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Tìm kiếm <span className="gradient-text">khóa học phù hợp</span>
          </h1>
          <p className="text-base max-w-lg" style={{ color: "var(--foreground-muted)" }}>
            Khóa học chất lượng từ các giáo viên hàng đầu
          </p>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm khóa học..." className="input-base pl-11" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setView("grid")} className="p-2.5 rounded-xl transition-all"
                style={{ background: view === "grid" ? "rgba(124,58,237,0.2)" : "var(--muted)", border: `1px solid ${view === "grid" ? "rgba(124,58,237,0.4)" : "var(--border)"}` }}>
                <Grid3X3 className="w-4 h-4" style={{ color: view === "grid" ? "#a78bfa" : "var(--foreground-muted)" }} />
              </button>
              <button onClick={() => setView("list")} className="p-2.5 rounded-xl transition-all"
                style={{ background: view === "list" ? "rgba(124,58,237,0.2)" : "var(--muted)", border: `1px solid ${view === "list" ? "rgba(124,58,237,0.4)" : "var(--border)"}` }}>
                <List className="w-4 h-4" style={{ color: view === "list" ? "#a78bfa" : "var(--foreground-muted)" }} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  background: activeCategory === cat ? "rgba(124,58,237,0.2)" : "var(--muted)",
                  border: `1px solid ${activeCategory === cat ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
                  color: activeCategory === cat ? "#a78bfa" : "var(--foreground-muted)",
                }}>{cat}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--foreground-muted)" }} />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy khóa học</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Thử thay đổi từ khóa hoặc bộ lọc</p>
            </div>
          ) : (
            <div className={view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {filtered.map((course) => {
                const cat = guessCategory(course.title);
                const color = colorMap[cat] || "#7c3aed";
                const authorName = course.author?.firstName || course.author?.username || "Giáo viên";
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className={`card-base card-hover overflow-hidden ${view === "list" ? "flex gap-6" : ""}`}>
                      <div className={`relative overflow-hidden ${view === "list" ? "w-48 flex-shrink-0 rounded-xl" : "aspect-video rounded-t-2xl -mx-6 -mt-6 mb-4"}`}
                        style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 opacity-20" style={{ color }} />
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="badge text-xs" style={{
                            background: course.price === 0 ? "rgba(16,185,129,0.2)" : "rgba(124,58,237,0.2)",
                            color: course.price === 0 ? "#34d399" : "#a78bfa",
                            border: `1px solid ${course.price === 0 ? "rgba(16,185,129,0.3)" : "rgba(124,58,237,0.3)"}`,
                          }}>{course.price === 0 ? "Miễn phí" : `${(course.price / 1000).toFixed(0)}k`}</span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className="badge text-[10px]" style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>{cat}</span>
                        </div>
                      </div>

                      <div className={view === "list" ? "py-4 flex-1" : ""}>
                        <h3 className="font-bold mb-2 line-clamp-1">{course.title}</h3>
                        <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>{course.description}</p>
                        <div className="flex items-center gap-4 text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
                          <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {course._count?.sections || 0} chương</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course._count?.enrollments || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: color }}>
                              {authorName.charAt(0)}
                            </div>
                            <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{authorName}</span>
                          </div>
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
