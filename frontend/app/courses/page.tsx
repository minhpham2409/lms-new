"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Search, BookOpen, Users, Star, Play, Grid3X3, List, Loader2,
  Filter, ArrowRight, SlidersHorizontal, GraduationCap,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const categories = ["Tất cả", "Toán", "Lý", "Hóa", "Sinh", "Anh văn", "Văn", "Lập trình"];

const colorMap: Record<string, string> = {
  "Toán": "#FFCCAA", "Lý": "#3b82f6", "Hóa": "#FFCCAA", "Sinh": "#F8B486",
  "Anh văn": "#94A3B8", "Văn": "#FFCCAA", "Lập trình": "#f97316",
};

const gradientMap: Record<string, string> = {
  "Toán": "linear-gradient(135deg, #FFCCAA, #F8B486)",
  "Lý": "linear-gradient(135deg, #3b82f6, #2563eb)",
  "Hóa": "linear-gradient(135deg, #FFCCAA, #d97706)",
  "Sinh": "linear-gradient(135deg, #F8B486, #059669)",
  "Anh văn": "linear-gradient(135deg, #94A3B8, #0e7490)",
  "Văn": "linear-gradient(135deg, #FFCCAA, #db2777)",
  "Lập trình": "linear-gradient(135deg, #f97316, #ea580c)",
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
  id: string; title: string; description: string; price: number; status: string; imageUrl?: string | null;
  author: { username: string; firstName?: string; lastName?: string };
  sections?: { _count?: { lessons: number } }[];
  _count: { enrollments: number };
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CoursesPageContent />
    </Suspense>
  );
}

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  
  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [view, setView] = useState<"grid" | "list">("list");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

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

  const filtered = useMemo(() => courses.filter((c) => {
    const cat = guessCategory(c.title);
    return activeCategory === "Tất cả" || cat === activeCategory;
  }), [courses, activeCategory]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, activeCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedCourses = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Generate page numbers for pagination buttons
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      <section className="pt-28 pb-10 border-b border-border bg-[var(--background-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)] mb-5">
                <GraduationCap className="w-4 h-4" />
                LumiLearn Course Catalog
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                {search ? `Kết quả cho "${search}"` : "Khám phá khóa học phù hợp"}
              </h1>
              <p className="text-base md:text-lg text-foreground-muted max-w-2xl">
                Tìm khóa học theo môn học, trình độ và giảng viên. Nội dung được trình bày rõ ràng để bạn dễ so sánh trước khi đăng ký.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-[var(--card)] p-4 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-2 block">Tìm kiếm nhanh</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nhập tên khóa học..."
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-[var(--muted)] px-3 py-2">
                  <p className="text-lg font-extrabold">{courses.length}</p>
                  <p className="text-[11px] text-foreground-muted">Khóa học</p>
                </div>
                <div className="rounded-lg bg-[var(--muted)] px-3 py-2">
                  <p className="text-lg font-extrabold">{categories.length - 1}</p>
                  <p className="text-[11px] text-foreground-muted">Danh mục</p>
                </div>
                <div className="rounded-lg bg-[var(--muted)] px-3 py-2">
                  <p className="text-lg font-extrabold">4.8</p>
                  <p className="text-[11px] text-foreground-muted">Đánh giá</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           
           <div className="rounded-xl border border-border bg-[var(--card)] p-3 sm:p-4 mb-7 shadow-sm">
             <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                 <div className="flex items-center gap-2 text-sm font-bold">
                   <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
                   {filtered.length} kết quả
                   {totalPages > 1 && <span className="text-xs font-medium text-foreground-muted">(Trang {currentPage}/{totalPages})</span>}
                 </div>
                 <p className="text-xs text-foreground-muted mt-1">Lọc theo danh mục hoặc đổi chế độ hiển thị.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${activeCategory === cat ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-border bg-background text-foreground-muted hover:text-foreground hover:bg-muted'}`}>
                    {cat}
                  </button>
                ))}
                <div className="hidden sm:block h-8 w-px bg-border mx-1" />
                <button aria-label="Dạng lưới" onClick={() => setView("grid")} className={`h-10 w-10 inline-flex items-center justify-center rounded-lg border transition-colors ${view === "grid" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-border text-foreground-muted hover:text-foreground hover:bg-muted"}`}>
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button aria-label="Dạng danh sách" onClick={() => setView("list")} className={`h-10 w-10 inline-flex items-center justify-center rounded-lg border transition-colors ${view === "list" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-border text-foreground-muted hover:text-foreground hover:bg-muted"}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
             </div>
           </div>

           <div className="flex flex-col lg:flex-row gap-8">
              <div className="hidden lg:block w-64 shrink-0">
                 <div className="sticky top-24 rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="w-4 h-4 text-[var(--primary)]" />
                      <h3 className="font-bold text-base">Bộ lọc</h3>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-3">Danh mục</p>
                    <div className="space-y-3">
                       {categories.map(cat => (
                          <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                             <input 
                               type="radio" 
                               name="category" 
                               className="w-4 h-4 text-primary focus:ring-primary border-border bg-background"
                               checked={activeCategory === cat}
                               onChange={() => setActiveCategory(cat)}
                             />
                             <span className="text-foreground group-hover:text-primary transition-colors">{cat}</span>
                          </label>
                       ))}
                    </div>

                    <div className="my-6 border-t border-border" />

                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-3">Đánh giá</p>
                    <div className="space-y-3">
                       {[4.5, 4.0, 3.5, 3.0].map(rating => (
                          <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                             <input 
                               type="radio" 
                               name="rating" 
                               className="w-4 h-4 text-primary focus:ring-primary border-border bg-background"
                             />
                             <div className="flex items-center">
                                {[1,2,3,4,5].map(star => (
                                   <Star key={star} className={`w-4 h-4 ${star <= Math.floor(rating) ? 'fill-yellow-500 text-yellow-500' : (star === Math.ceil(rating) ? 'fill-yellow-500/50 text-yellow-500' : 'text-muted')}`} />
                                ))}
                                <span className="ml-2 text-foreground group-hover:text-primary transition-colors">{rating} & up</span>
                             </div>
                          </label>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Course List */}
              <div className="flex-1">
                 {loading ? (
                    <div className="flex justify-center items-center h-64 rounded-xl border border-border bg-[var(--card)]">
                       <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                 ) : filtered.length === 0 ? (
                    <div className="text-center py-20 border border-border rounded-xl bg-[var(--card)]">
                       <h3 className="text-2xl font-bold mb-2">Không tìm thấy kết quả</h3>
                       <p className="text-foreground-muted mb-4">Vui lòng thử lại với từ khóa khác.</p>
                       <button onClick={() => {setSearch(""); setActiveCategory("Tất cả");}} className="rounded-lg bg-[var(--primary)] px-6 py-2.5 font-bold text-[var(--primary-foreground)]">Xóa bộ lọc</button>
                    </div>
                 ) : (
                    <>
                    <div className={view === "list" ? "space-y-4" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                       {paginatedCourses.map(course => {
                          const cat = guessCategory(course.title);
                          const authorName = course.author?.firstName || course.author?.username || "Giáo viên";
                          const lessons = course.sections?.reduce((acc, s) => acc + (s._count?.lessons || 0), 0) || 0;
                          
                          if (view === "list") {
                             return (
                                <Link key={course.id} href={`/courses/${course.id}`} className="block">
                                   <div className="flex flex-col sm:flex-row gap-5 p-4 border border-border rounded-xl bg-[var(--card)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                      <div className="w-full sm:w-64 aspect-video rounded-lg relative overflow-hidden shrink-0 border border-border" style={{ background: gradientMap[cat] || 'linear-gradient(135deg, #2563eb, #059669)' }}>
                                         {course.imageUrl ? <img src={course.imageUrl} alt={course.title} className="absolute inset-0 h-full w-full object-cover" /> : null}
                                         <div className="absolute inset-0 bg-black/10" />
                                         <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-4xl font-extrabold text-white/30 mb-1">{course.title.charAt(0).toUpperCase()}</span>
                                            <Play className="w-8 h-8 text-white/60 group-hover:scale-110 transition-transform" />
                                         </div>
                                      </div>
                                      <div className="flex-1 flex flex-col">
                                         <h3 className="font-bold text-lg mb-1 line-clamp-2">{course.title}</h3>
                                         <p className="text-sm text-foreground-muted mb-1 line-clamp-2">{course.description}</p>
                                         <p className="text-xs text-foreground-muted mb-2">Giảng viên {authorName}</p>
                                         
                                         <div className="flex items-center gap-1 mb-2">
                                            <span className="font-bold text-yellow-500 text-sm">4.8</span>
                                            <div className="flex">
                                               {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}
                                            </div>
                                            <span className="text-xs text-foreground-muted">({course._count?.enrollments || 0})</span>
                                         </div>

                                         <div className="flex items-center gap-4 text-xs text-foreground-muted mt-auto">
                                            <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lessons} bài học</span>
                                            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{course._count?.enrollments || 0} học viên</span>
                                         </div>
                                      </div>
                                      <div className="sm:w-36 flex flex-row sm:flex-col sm:items-end justify-between sm:justify-start gap-3">
                                         <span className="font-extrabold text-xl">{course.price === 0 ? "Miễn phí" : `${(course.price / 1000).toFixed(0)}k ₫`}</span>
                                         <span className="inline-flex items-center gap-1 text-sm font-bold text-[var(--primary)]">Xem chi tiết <ArrowRight className="w-4 h-4" /></span>
                                      </div>
                                   </div>
                                </Link>
                             )
                          }

                          return (
                             <Link key={course.id} href={`/courses/${course.id}`} className="block">
                                <div className="border border-border rounded-xl bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group h-full flex flex-col">
                                   <div className="w-full aspect-video relative overflow-hidden border-b border-border" style={{ background: gradientMap[cat] || 'linear-gradient(135deg, #2563eb, #059669)' }}>
                                      {course.imageUrl ? <img src={course.imageUrl} alt={course.title} className="absolute inset-0 h-full w-full object-cover" /> : null}
                                      <div className="absolute inset-0 bg-black/10" />
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                         <span className="text-5xl font-extrabold text-white/30 mb-1">{course.title.charAt(0).toUpperCase()}</span>
                                         <Play className="w-8 h-8 text-white/60 group-hover:scale-110 transition-transform" />
                                      </div>
                                   </div>
                                   <div className="p-4 flex flex-col flex-1">
                                      <h3 className="font-bold mb-1 line-clamp-2">{course.title}</h3>
                                      <p className="text-xs text-foreground-muted mb-1">Giảng viên {authorName}</p>
                                      
                                      <div className="flex items-center gap-1 mb-2">
                                         <span className="font-bold text-yellow-500 text-sm">4.8</span>
                                         <div className="flex">
                                            {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}
                                         </div>
                                         <span className="text-xs text-foreground-muted">({course._count?.enrollments || 0})</span>
                                      </div>

                                      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
                                         <span className="font-bold text-lg">{course.price === 0 ? "Miễn phí" : `${(course.price / 1000).toFixed(0)}k ₫`}</span>
                                         <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)]">Chi tiết <ArrowRight className="w-3.5 h-3.5" /></span>
                                      </div>
                                   </div>
                                </div>
                             </Link>
                          )
                       })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <nav className="flex items-center justify-center gap-1 mt-10 pt-8 border-t border-border" aria-label="Phân trang">
                        {/* First page */}
                        <button
                          onClick={() => { setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Trang đầu"
                        >
                          <ChevronsLeft className="w-4 h-4" />
                        </button>
                        {/* Previous page */}
                        <button
                          onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Trang trước"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {getPageNumbers().map((page, idx) =>
                          page === '...' ? (
                            <span key={`ellipsis-${idx}`} className="px-2 text-foreground-muted select-none">…</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className={`min-w-[40px] h-10 rounded-lg font-bold text-sm transition-colors ${
                                currentPage === page
                                  ? 'bg-primary text-white shadow-md'
                                  : 'border border-border hover:bg-muted'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        )}

                        {/* Next page */}
                        <button
                          onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Trang sau"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {/* Last page */}
                        <button
                          onClick={() => { setCurrentPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Trang cuối"
                        >
                          <ChevronsRight className="w-4 h-4" />
                        </button>
                      </nav>
                    )}
                    </>
                 )}
              </div>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
