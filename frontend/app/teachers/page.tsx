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

      {/* Premium Hero Section with mesh blur background */}
      <div className="relative bg-[#0f172a] text-white pt-36 pb-28 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-none bg-[#1e40af]/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] rounded-none bg-[#3b82f6]/15 blur-[120px] pointer-events-none" />

        {/* Abstract pattern grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none text-xs font-extrabold uppercase tracking-wider bg-white/10 text-[#93c5fd] border border-white/10 mb-6 backdrop-blur-sm">
              <Award className="w-3.5 h-3.5" /> Đội ngũ giảng viên ưu tú
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Gặp gỡ những <span className="bg-gradient-to-r from-[#93c5fd] to-[#ffffff] bg-clip-text text-transparent">người dẫn đường</span> xuất sắc
            </h1>
            <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
              Tại LumiLearn, chúng tôi sở hữu mạng lưới giáo viên chuyên nghiệp, giàu kinh nghiệm thực chiến và luôn truyền đạt tri thức với phương pháp sư phạm hiện đại nhất.
            </p>

            {/* Search Bar in Hero */}
            <div className="relative max-w-xl group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] rounded-none blur opacity-30 group-hover:opacity-60 transition duration-300" />
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm giảng viên theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-5 pr-14 py-4 rounded-none text-white bg-slate-900/90 border border-white/10 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/30 transition-all placeholder-slate-400 text-sm shadow-inner"
                />
                <button className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-gradient-to-tr from-[#3b82f6] to-[#1e40af] rounded-none flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-md">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative -mt-8 z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white dark:bg-[#151c2c] border border-slate-200/80 dark:border-slate-800/80 shadow-xl rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
          <div className="flex flex-col sm:flex-row items-center gap-8 w-full md:w-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Users className="w-6 h-6" />
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
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <BookOpen className="w-6 h-6" />
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
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none flex items-center gap-1">4.9</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">Đánh giá trung bình</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex justify-end shrink-0">
             <div className="px-4 py-2 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs font-bold text-primary flex items-center gap-1.5 animate-pulse">
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
                  className="group relative flex flex-col bg-white dark:bg-[#111625] border border-slate-200/80 dark:border-slate-800/80 rounded-none overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 dark:hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300"
                >
                  {/* Top Decorative Banner */}
                  <div className="h-20 w-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    {/* Badge in Banner */}
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10">
                      {teacher._count.courses > 2 ? "Chuyên Gia" : "Giảng Viên"}
                    </span>
                  </div>

                  {/* Avatar Overlapping Banner */}
                  <div className="px-6 -mt-10 mb-4 flex items-end gap-3.5 relative z-10">
                    <div className="w-20 h-20 rounded-none bg-gradient-to-tr from-[#3b82f6] to-[#93c5fd] p-0.5 shadow-lg shrink-0">
                      <div className="w-full h-full rounded-none bg-white dark:bg-[#111625] flex items-center justify-center text-2xl font-extrabold text-primary border-2 border-transparent">
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
                  <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/80 mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Khóa học</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-none mt-0.5">{teacher._count.courses}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
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

      {/* Premium CTA Section */}
      <div className="relative bg-[#0f172a] text-white py-24 overflow-hidden border-t border-white/5">
        {/* Glow behind the CTA */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-none bg-[#1e40af]/10 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <GraduationCap className="w-14 h-14 text-[#93c5fd] mx-auto mb-6 opacity-90 animate-bounce" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight tracking-tight">
            Trở thành giảng viên ngay hôm nay
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Hàng ngàn học viên đang chờ đón những kiến thức quý báu từ bạn. Tham gia giảng dạy tại <span className="text-[#93c5fd] font-bold">LumiLearn</span> để tạo dựng uy tín cá nhân, lan tỏa tri thức và nhận nguồn thu nhập xứng đáng.
          </p>
          <div className="flex justify-center">
            <a
              href="mailto:providminh24092004@gmail.com"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#3b82f6] to-[#1e40af] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-extrabold py-4 px-10 rounded-none transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-[#1e40af]/25 text-sm"
            >
              Liên hệ đăng ký giảng dạy <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
