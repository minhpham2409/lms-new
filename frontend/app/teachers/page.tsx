"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Users, BookOpen, Star, Loader2, ArrowRight, Award, Mail, Search, Phone, GraduationCap } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Udemy-style Dark Hero Section */}
      <div className="bg-[#f7f9fa] dark:bg-[#2d2f31] pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Giảng viên của chúng tôi
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Học hỏi từ những chuyên gia hàng đầu. Đội ngũ giảng viên tâm huyết và giàu kinh nghiệm sẽ đồng hành cùng bạn trên con đường chinh phục tri thức.
            </p>

            {/* Search Bar in Hero */}
            <div className="relative max-w-xl">
              <input
                type="text"
                placeholder="Tìm giảng viên theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-4 rounded-full text-black outline-none border-2 border-transparent focus:border-primary transition-colors"
              />
              <button className="absolute right-2 top-2 bottom-2 w-10 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">{teachers.length}</span>
            <span className="text-foreground-muted">Giảng viên chuyên môn</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl">{totalCourses}</span>
            <span className="text-foreground-muted">Khóa học chất lượng</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl flex items-center gap-1"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> 4.9</span>
            <span className="text-foreground-muted">Đánh giá trung bình</span>
          </div>
        </div>
      </div>

      {/* Teachers List */}
      <div className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
              <p className="text-foreground-muted">Đang tải danh sách giáo viên...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold mb-2">
                {searchQuery ? "Không tìm thấy giảng viên" : "Chưa có giảng viên nào"}
              </h3>
              <p className="text-sm text-foreground-muted">
                {searchQuery ? `Không có kết quả cho "${searchQuery}". Hãy thử từ khóa khác.` : "Hệ thống đang cập nhật danh sách giảng viên."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 gap-6">
              {filteredTeachers.map((teacher, index) => {
                const fullName = teacher.firstName
                  ? `${teacher.firstName} ${teacher.lastName || ""}`.trim()
                  : teacher.username;

                const initial = fullName.charAt(0).toUpperCase();

                return (
                  <Link href={`/teachers/${teacher.id}`} key={teacher.id} className="group border border-border bg-card p-6 flex flex-col hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">
                          {fullName}
                        </h3>
                        <p className="text-sm text-foreground-muted truncate" title={teacher.email}>{teacher.email}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4 text-sm text-foreground-muted line-clamp-2">
                       {teacher.bio || "Giảng viên tại HọcLộ Trình."}
                    </div>

                    <div className="mt-auto border-t border-border pt-4 flex items-center justify-between">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Khóa học</span>
                          <span className="font-bold text-primary">{teacher._count.courses}</span>
                       </div>
                       <div className="flex flex-col text-right">
                          <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">Đánh giá</span>
                          <span className="font-bold flex items-center gap-1 justify-end"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> 4.9</span>
                       </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Udemy-style CTA Section */}
      <div className="bg-muted border-t border-border py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Trở thành giảng viên ngay hôm nay</h2>
          <p className="text-lg text-foreground-muted mb-8">
            Hàng ngàn học viên đang chờ đón những kiến thức quý báu từ bạn. Tham gia giảng dạy tại HọcLộ Trình để tạo ra nguồn thu nhập thụ động và lan tỏa tri thức.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:providminh24092004@gmail.com" className="bg-primary text-white font-bold py-4 px-8 w-full sm:w-auto text-center hover:bg-primary/90 transition-colors">
              Liên hệ đăng ký
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
