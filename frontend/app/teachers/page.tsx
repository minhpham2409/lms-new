"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Users, BookOpen, Star, Loader2, ArrowRight, Award, Mail } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface Teacher {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  _count: {
    courses: number;
  };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/users/public/teachers`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setTeachers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Lỗi khi tải danh sách giáo viên:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero Section */}
      <div className="pt-28 pb-16 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.05), rgba(8,145,178,0.05))" }}>
        <div className="orb orb-violet w-[400px] h-[400px] -top-20 -left-20 opacity-30" />
        <div className="orb orb-cyan w-[300px] h-[300px] top-20 right-[-50px] opacity-20" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa" }}>
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Đội ngũ giảng viên</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
            Gặp Gỡ Các <span className="gradient-text">Chuyên Gia</span> Của Chúng Tôi
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "var(--foreground-muted)" }}>
            Những giáo viên tâm huyết và giàu kinh nghiệm sẽ đồng hành cùng bạn trên con đường chinh phục tri thức và đạt được những thành tựu mới.
          </p>
        </div>
      </div>

      {/* Teachers List */}
      <div className="flex-1 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "#7c3aed" }} />
              <p style={{ color: "var(--foreground-muted)" }}>Đang tải danh sách giáo viên...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-20 card-base max-w-md mx-auto">
              <Users className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--foreground-muted)", opacity: 0.5 }} />
              <h3 className="text-xl font-bold mb-2">Chưa có giáo viên nào</h3>
              <p style={{ color: "var(--foreground-muted)" }}>Hệ thống đang cập nhật danh sách giáo viên, bạn vui lòng quay lại sau nhé.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {teachers.map((teacher, index) => {
                const fullName = teacher.firstName 
                  ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() 
                  : teacher.username;
                
                // Giả lập màu sắc gradient cho avatar
                const gradients = [
                  "linear-gradient(135deg, #7c3aed, #0891b2)",
                  "linear-gradient(135deg, #f59e0b, #ef4444)",
                  "linear-gradient(135deg, #10b981, #0891b2)",
                  "linear-gradient(135deg, #ec4899, #7c3aed)",
                ];
                const bgGradient = gradients[index % gradients.length];
                const initial = fullName.charAt(0).toUpperCase();

                return (
                  <div key={teacher.id} className="card-base card-hover flex flex-col p-0 overflow-hidden group">
                    <div className="h-24 relative" style={{ background: bgGradient }}>
                      <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg" 
                           style={{ background: bgGradient, border: "4px solid var(--card)" }}>
                        {initial}
                      </div>
                    </div>
                    
                    <div className="pt-14 pb-6 px-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {fullName}
                      </h3>
                      <div className="flex items-center gap-2 mb-4" style={{ color: "var(--foreground-muted)" }}>
                        <Mail className="w-3.5 h-3.5" />
                        <p className="text-sm truncate">{teacher.email}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "var(--muted)" }}>
                          <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} />
                          <div>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Khóa học</p>
                            <p className="font-bold text-sm">{teacher._count.courses}</p>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl flex items-center gap-2" style={{ background: "var(--muted)" }}>
                          <Star className="w-4 h-4" style={{ color: "#f59e0b" }} />
                          <div>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Đánh giá</p>
                            <p className="font-bold text-sm">4.9/5</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <Link href={`/teachers/${teacher.id}`} className="btn-secondary w-full flex justify-center items-center gap-2">
                          Xem thông tin chi tiết <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
