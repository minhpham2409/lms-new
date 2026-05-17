"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  Search, BookOpen, Users, Star, Play, Grid3X3, List, Loader2,
  Filter, ArrowRight, CheckCircle2
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const categories = ["Tất cả", "Toán", "Lý", "Hóa", "Sinh", "Anh văn", "Văn", "Lập trình"];

const colorMap: Record<string, string> = {
  "Toán": "#a435f0", "Lý": "#3b82f6", "Hóa": "#f59e0b", "Sinh": "#10b981",
  "Anh văn": "#0891b2", "Văn": "#ec4899", "Lập trình": "#f97316",
};

const gradientMap: Record<string, string> = {
  "Toán": "linear-gradient(135deg, #a435f0, #5624d0)",
  "Lý": "linear-gradient(135deg, #3b82f6, #2563eb)",
  "Hóa": "linear-gradient(135deg, #f59e0b, #d97706)",
  "Sinh": "linear-gradient(135deg, #10b981, #059669)",
  "Anh văn": "linear-gradient(135deg, #0891b2, #0e7490)",
  "Văn": "linear-gradient(135deg, #ec4899, #db2777)",
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
  id: string; title: string; description: string; price: number; status: string;
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
  const [view, setView] = useState<"grid" | "list">("list"); // Udemy defaults to list
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
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero Header - Udemy Style */}
      <section className="pt-24 pb-8 bg-background-2 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <h1 className="text-3xl font-bold mb-4">
              {search ? `Kết quả tìm kiếm cho "${search}"` : "Tất cả khóa học"}
           </h1>
           <p className="text-foreground-muted mb-6">Khám phá hàng trăm khóa học trực tuyến từ cơ bản đến nâng cao.</p>
           
           <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
             <div className="flex items-center gap-2 border border-border px-4 py-2 rounded-full cursor-pointer hover:bg-muted font-bold whitespace-nowrap">
                <Filter className="w-4 h-4" /> Bộ lọc
             </div>
             {categories.slice(1).map(cat => (
                <div key={cat} onClick={() => setActiveCategory(cat)} className={`border px-4 py-2 rounded-full cursor-pointer whitespace-nowrap font-bold transition-colors ${activeCategory === cat ? 'bg-primary text-white border-primary' : 'border-border hover:bg-muted text-foreground'}`}>
                   {cat}
                </div>
             ))}
           </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           
           {/* Top controls */}
           <div className="flex justify-between items-center mb-6">
              <div className="font-bold text-xl">
                 {filtered.length} kết quả
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setView("grid")} className={`p-2 rounded-md ${view === "grid" ? "bg-muted text-primary" : "text-foreground-muted hover:text-foreground"}`}>
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button onClick={() => setView("list")} className={`p-2 rounded-md ${view === "list" ? "bg-muted text-primary" : "text-foreground-muted hover:text-foreground"}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
           </div>

           <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters - Desktop only */}
              <div className="hidden lg:block w-64 shrink-0">
                 <div className="sticky top-24 border-t border-border pt-4">
                    <h3 className="font-bold text-lg mb-4">Danh mục</h3>
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

                    <h3 className="font-bold text-lg mb-4">Đánh giá</h3>
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
                    <div className="flex justify-center items-center h-64">
                       <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                 ) : filtered.length === 0 ? (
                    <div className="text-center py-20 border border-border rounded-lg bg-background-2">
                       <h3 className="text-2xl font-bold mb-2">Không tìm thấy kết quả</h3>
                       <p className="text-foreground-muted mb-4">Vui lòng thử lại với từ khóa khác.</p>
                       <button onClick={() => {setSearch(""); setActiveCategory("Tất cả");}} className="btn-primary px-6 py-2">Xóa bộ lọc</button>
                    </div>
                 ) : (
                    <div className={view === "list" ? "space-y-4" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                       {filtered.map(course => {
                          const cat = guessCategory(course.title);
                          const authorName = course.author?.firstName || course.author?.username || "Giáo viên";
                          const lessons = course.sections?.reduce((acc, s) => acc + (s._count?.lessons || 0), 0) || 0;
                          
                          if (view === "list") {
                             return (
                                <Link key={course.id} href={`/courses/${course.id}`} className="block">
                                   <div className="flex flex-col sm:flex-row gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors group">
                                      <div className="w-full sm:w-64 aspect-video bg-muted rounded-md relative overflow-hidden shrink-0 border border-border">
                                         <div className="absolute inset-0 flex items-center justify-center">
                                            <Play className="w-10 h-10 text-primary opacity-50 group-hover:scale-110 transition-transform" />
                                         </div>
                                      </div>
                                      <div className="flex-1 flex flex-col">
                                         <h3 className="font-bold text-lg mb-1 line-clamp-2">{course.title}</h3>
                                         <p className="text-sm text-foreground-muted mb-1 line-clamp-2">{course.description}</p>
                                         <p className="text-xs text-foreground-muted mb-2">{authorName}</p>
                                         
                                         <div className="flex items-center gap-1 mb-2">
                                            <span className="font-bold text-yellow-500 text-sm">4.8</span>
                                            <div className="flex">
                                               {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}
                                            </div>
                                            <span className="text-xs text-foreground-muted">({course._count?.enrollments || 0})</span>
                                         </div>

                                         <div className="flex items-center gap-4 text-xs text-foreground-muted mt-auto">
                                            <span>{lessons} bài học</span>
                                            <span>•</span>
                                            <span>Mọi trình độ</span>
                                         </div>
                                      </div>
                                      <div className="sm:w-32 flex flex-col sm:items-end justify-start">
                                         <span className="font-bold text-xl">{course.price === 0 ? "Miễn phí" : `${(course.price / 1000).toFixed(0)}k ₫`}</span>
                                      </div>
                                   </div>
                                </Link>
                             )
                          }

                          return (
                             <Link key={course.id} href={`/courses/${course.id}`} className="block">
                                <div className="border border-border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors group h-full flex flex-col">
                                   <div className="w-full aspect-video bg-muted relative overflow-hidden border-b border-border">
                                      <div className="absolute inset-0 flex items-center justify-center">
                                         <Play className="w-10 h-10 text-primary opacity-50 group-hover:scale-110 transition-transform" />
                                      </div>
                                   </div>
                                   <div className="p-4 flex flex-col flex-1">
                                      <h3 className="font-bold mb-1 line-clamp-2">{course.title}</h3>
                                      <p className="text-xs text-foreground-muted mb-1">{authorName}</p>
                                      
                                      <div className="flex items-center gap-1 mb-2">
                                         <span className="font-bold text-yellow-500 text-sm">4.8</span>
                                         <div className="flex">
                                            {[1,2,3,4,5].map(star => <Star key={star} className="w-3 h-3 fill-yellow-500 text-yellow-500" />)}
                                         </div>
                                         <span className="text-xs text-foreground-muted">({course._count?.enrollments || 0})</span>
                                      </div>

                                      <div className="mt-auto pt-4 flex items-center justify-between">
                                         <span className="font-bold text-lg">{course.price === 0 ? "Miễn phí" : `${(course.price / 1000).toFixed(0)}k ₫`}</span>
                                      </div>
                                   </div>
                                </div>
                             </Link>
                          )
                       })}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
