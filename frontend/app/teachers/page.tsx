"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Users, BookOpen, Star, Loader2, ArrowRight, Award, Mail, Search, GraduationCap } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b0f19] text-foreground transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <div className="relative text-white pt-36 pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #0e7490 100%)" }}>
        <div className="absolute inset-0">
          <img src="/images/hero_banner_lumi.png" alt="" className="w-full h-full object-cover object-center opacity-20" />
        </div>
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute top-0 right-0 w-96 h-96 orb orb-violet opacity-30" />
        <div className="absolute bottom-0 left-0 w-72 h-72 orb orb-teal opacity-25" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6"
              style={{ background: "rgba(129,140,248,0.15)", color: "#a5b4fc", border: "1px solid rgba(129,140,248,0.3)" }}>
              <Award className="w-3.5 h-3.5" /> Đội ngũ giảng viên ưu tú
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Gặp gỡ những{" "}
              <span style={{ background: "linear-gradient(135deg,#a5b4fc,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>người dẫn đường</span>{" "}xuất sắc
            </h1>
            <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
              Tại LumiLearn, chúng tôi sở hữu mạng lưới giáo viên chuyên nghiệp, giàu kinh nghiệm và luôn truyền đạt tri thức với phương pháp sư phạm hiện đại nhất.
            </p>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a5b4fc] opacity-70" />
              <input type="text" placeholder="Tìm kiếm giảng viên theo tên hoặc email..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-2xl text-white outline-none text-sm placeholder-slate-400 transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
                onFocus={e => { e.target.style.borderColor = "#818cf8"; e.target.style.background = "rgba(255,255,255,0.15)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.2)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative -mt-8 z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-8 w-full md:w-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                <Users className="w-6 h-6 text-[#6366f1]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">
                  {loading ? "--" : teachers.length}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Giảng viên tinh hoa</p>
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.1)" }}>
                <BookOpen className="w-6 h-6 text-[#06b6d4]" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">
                  {loading ? "--" : totalCourses}
                </p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Khóa học chất lượng</p>
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none flex items-center gap-1">4.9</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Đánh giá trung bình</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-end shrink-0">
             <div className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
               style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#6366f1" }}>
                <Award className="w-4 h-4" /> Hệ thống tuyển chọn khắt khe
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Đang tải danh sách giảng viên...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#111625] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy giảng viên nào</p>
            <p className="text-slate-500 text-sm mt-1">Hãy thử tìm kiếm với từ khóa khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher) => {
              const fullName = teacher.firstName ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() : teacher.username;
              const initial = fullName.charAt(0).toUpperCase();

              return (
                <Link
                  href={`/teachers/${teacher.id}`}
                  key={teacher.id}
                  className="group relative flex flex-col bg-white dark:bg-[#130f2a] border overflow-hidden hover:-translate-y-2 transition-all duration-300 rounded-2xl"
                  style={{ borderColor: "rgba(199,210,254,0.4)", boxShadow: "0 2px 12px rgba(99,102,241,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(99,102,241,0.18)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(99,102,241,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(199,210,254,0.4)"; }}
                >
                  {/* Top Decorative Banner */}
                  <div className="h-20 w-full relative overflow-hidden rounded-t-2xl"
                    style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed, #06b6d4)" }}>
                    <div className="absolute inset-0 dot-pattern opacity-30" />
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                      {teacher._count.courses > 2 ? "Chuyên Gia" : "Giảng Viên"}
                    </span>
                  </div>

                  {/* Avatar Overlapping Banner */}
                  <div className="px-6 -mt-10 mb-4 flex items-end gap-3.5 relative z-10">
                    <div className="w-20 h-20 rounded-2xl p-0.5 shadow-lg shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
                      <div className="w-full h-full rounded-2xl bg-white dark:bg-[#130f2a] flex items-center justify-center text-2xl font-extrabold text-[#6366f1]">
                        {initial}
                      </div>
                    </div>
                    <div className="min-w-0 pb-1">
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-white truncate group-hover:text-primary transition-colors">
                        {fullName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate" title={teacher.email}>
                        <Mail className="w-3.5 h-3.5 text-primary/75" />
                        {teacher.email}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="px-6 pb-6 flex-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {teacher.bio || "Chuyên gia giảng dạy tận tâm tại LumiLearn, luôn cam kết đồng hành cùng học sinh trên con đường chinh phục tri thức."}
                  </div>

                  {/* Stats Footer */}
                  <div className="px-6 py-4 mt-auto flex items-center justify-between rounded-b-2xl"
                    style={{ background: "rgba(99,102,241,0.04)", borderTop: "1px solid rgba(199,210,254,0.3)" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                        <BookOpen className="w-4 h-4 text-[#6366f1]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Khóa học</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-none mt-0.5">{teacher._count.courses}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)" }}>
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Đánh giá</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-none mt-0.5">4.9</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="relative text-white py-24 overflow-hidden" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0e7490 100%)" }}>
        <div className="absolute inset-0">
          <img src="/images/hero_banner_lumi.png" alt="" className="w-full h-full object-cover opacity-15" />
        </div>
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-96 h-96 orb orb-violet opacity-30" />
        <div className="absolute bottom-0 left-0 w-72 h-72 orb orb-teal opacity-25" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(129,140,248,0.2)", border: "1px solid rgba(129,140,248,0.3)" }}>
            <GraduationCap className="w-8 h-8 text-[#a5b4fc]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Trở thành giảng viên ngay hôm nay</h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Hàng ngàn học viên đang chờ đón những kiến thức quý báu từ bạn. Tham gia giảng dạy tại{" "}
            <span style={{ background: "linear-gradient(135deg,#a5b4fc,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>LumiLearn</span>{" "}
            để tạo dựng uy tín và nhận nguồn thu nhập xứng đáng.
          </p>
          <a href="mailto:providminh24092004@gmail.com"
            className="inline-flex items-center gap-2 font-extrabold py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 text-sm text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)", boxShadow: "0 6px 24px rgba(99,102,241,0.45)" }}>
            Liên hệ đăng ký giảng dạy <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
