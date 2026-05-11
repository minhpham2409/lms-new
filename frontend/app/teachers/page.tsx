"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Users, BookOpen, Star, Loader2, ArrowRight, Award, Mail, Search, Phone, GraduationCap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface Teacher {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  bio?: string | null;
  _count: {
    courses: number;
  };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API}/users/public/teachers`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Lỗi khi tải danh sách giáo viên:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredTeachers = teachers.filter((t) => {
    const name = t.firstName ? `${t.firstName} ${t.lastName || ""}`.trim() : t.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalCourses = teachers.reduce((sum, t) => sum + t._count.courses, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero Section */}
      <div className="pt-28 pb-20 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(8,145,178,0.04) 50%, rgba(236,72,153,0.03) 100%)" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20"
             style={{ background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
             style={{ background: "radial-gradient(circle, rgba(8,145,178,0.3) 0%, transparent 70%)" }} />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 backdrop-blur-sm"
               style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", color: "#a78bfa" }}>
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Đội ngũ giảng viên chất lượng cao</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
            Gặp Gỡ Các <span className="gradient-text">Chuyên Gia</span>
            <br className="hidden sm:block" />
            Của Chúng Tôi
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "var(--foreground-muted)" }}>
            Những giáo viên tâm huyết và giàu kinh nghiệm sẽ đồng hành cùng bạn trên con đường chinh phục tri thức.
          </p>

          {/* Stats Bar */}
          <div className="inline-flex items-center gap-6 sm:gap-10 px-8 py-4 rounded-2xl backdrop-blur-md"
               style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#7c3aed" }}>{teachers.length}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--foreground-muted)" }}>Giảng viên</p>
            </div>
            <div className="w-px h-10" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#0891b2" }}>{totalCourses}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--foreground-muted)" }}>Khóa học</p>
            </div>
            <div className="w-px h-10" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#f59e0b" }}>⭐ 4.9</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--foreground-muted)" }}>Đánh giá TB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 relative z-20">
        <div className="card-base p-2 flex items-center gap-3" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
          <Search className="w-5 h-5 ml-3 flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
          <input
            type="text"
            placeholder="Tìm giáo viên theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm py-2.5 placeholder:text-gray-400"
            style={{ color: "var(--foreground)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}>
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Teachers List */}
      <div className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "#7c3aed" }} />
              <p style={{ color: "var(--foreground-muted)" }}>Đang tải danh sách giáo viên...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-20 card-base max-w-md mx-auto">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--foreground-muted)", opacity: 0.5 }} />
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? "Không tìm thấy giáo viên" : "Chưa có giáo viên nào"}
              </h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                {searchQuery ? `Không có kết quả cho "${searchQuery}". Hãy thử từ khóa khác.` : "Hệ thống đang cập nhật danh sách giáo viên."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                Hiển thị <span className="font-semibold" style={{ color: "var(--foreground)" }}>{filteredTeachers.length}</span> giáo viên
                {searchQuery && <span> cho từ khóa &quot;{searchQuery}&quot;</span>}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTeachers.map((teacher, index) => {
                  const fullName = teacher.firstName
                    ? `${teacher.firstName} ${teacher.lastName || ""}`.trim()
                    : teacher.username;

                  const gradients = [
                    "linear-gradient(135deg, #7c3aed, #0891b2)",
                    "linear-gradient(135deg, #f59e0b, #ef4444)",
                    "linear-gradient(135deg, #10b981, #0891b2)",
                    "linear-gradient(135deg, #ec4899, #7c3aed)",
                    "linear-gradient(135deg, #6366f1, #a855f7)",
                    "linear-gradient(135deg, #14b8a6, #3b82f6)",
                  ];
                  const bgGradient = gradients[index % gradients.length];
                  const initial = fullName.charAt(0).toUpperCase();

                  return (
                    <Link href={`/teachers/${teacher.id}`} key={teacher.id}
                          className="card-base card-hover flex flex-col p-0 overflow-hidden group relative">
                      {/* Cover gradient */}
                      <div className="h-28 relative" style={{ background: bgGradient }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.2) 100%)" }} />
                        {/* Decorative dots */}
                        <div className="absolute top-4 right-4 grid grid-cols-3 gap-1 opacity-30">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                          ))}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="absolute top-[68px] left-6 w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl transition-transform duration-300 group-hover:scale-105"
                           style={{ background: bgGradient, border: "4px solid var(--card)" }}>
                        {initial}
                      </div>

                      <div className="pt-16 pb-6 px-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                          {fullName}
                        </h3>
                        <div className="flex items-center gap-2 mb-1" style={{ color: "var(--foreground-muted)" }}>
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <p className="text-xs truncate">{teacher.email}</p>
                        </div>
                        <div className="flex items-center gap-2 mb-4" style={{ color: "var(--foreground-muted)" }}>
                          <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                          <p className="text-xs">Giảng viên</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="p-3 rounded-xl flex items-center gap-2.5 transition-colors"
                               style={{ background: "var(--muted)" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ background: "rgba(124,58,237,0.1)" }}>
                              <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium" style={{ color: "var(--foreground-muted)" }}>Khóa học</p>
                              <p className="font-bold text-sm">{teacher._count.courses}</p>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl flex items-center gap-2.5 transition-colors"
                               style={{ background: "var(--muted)" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ background: "rgba(245,158,11,0.1)" }}>
                              <Star className="w-4 h-4" style={{ color: "#f59e0b" }} />
                            </div>
                            <div>
                              <p className="text-[10px] font-medium" style={{ color: "var(--foreground-muted)" }}>Đánh giá</p>
                              <p className="font-bold text-sm">4.9/5</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                               style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                            Xem hồ sơ <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact CTA Section */}
      <div className="py-16" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(8,145,178,0.04))" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Bạn muốn trở thành giảng viên?</h2>
          <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            Chia sẻ kiến thức của bạn với hàng ngàn học sinh trên nền tảng HọcLộ Trình. Liên hệ ngay với chúng tôi để bắt đầu hành trình giảng dạy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:providminh24092004@gmail.com"
               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/25"
               style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              <Mail className="w-4 h-4" /> providminh24092004@gmail.com
            </a>
            <a href="tel:0916869648"
               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
               style={{ background: "var(--muted)", color: "var(--foreground)" }}>
              <Phone className="w-4 h-4" style={{ color: "#7c3aed" }} /> 0916 869 648
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
