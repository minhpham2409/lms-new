"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Teacher {
  id: string; username: string; firstName: string | null; lastName: string | null; email: string; bio?: string | null;
  _count: { courses: number };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`${API}/users/public/teachers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setTeachers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = teachers.filter((t) => {
    const name = t.firstName ? `${t.firstName} ${t.lastName || ""}`.trim() : t.username;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const totalCourses = teachers.reduce((s, t) => s + t._count.courses, 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative text-white pt-36 pb-28 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #051025 0%, #0A1A35 40%, #121E36 100%)" }}>
        <div className="absolute inset-0">
          <img src="/images/hero_star_light.png" alt="" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 relative z-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#F8B486" }}>Đội ngũ giảng viên</p>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: "#F8FAFC" }}>
              Gặp gỡ <span style={{ color: "#F8B486" }}>người dẫn đường</span> xuất sắc
            </h1>
            <p className="text-base mb-8" style={{ color: "#94A3B8" }}>
              Đội ngũ giáo viên chuyên nghiệp, giàu kinh nghiệm, truyền đạt tri thức với phương pháp hiện đại.
            </p>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm giảng viên..." className="w-full max-w-md px-4 py-3.5 rounded-lg text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.2)", color: "#F8FAFC" }} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="relative -mt-6 z-20 max-w-[1200px] mx-auto px-6 sm:px-10 w-full">
        <div className="glass-card rounded-2xl p-6 md:p-8 flex flex-wrap items-center justify-center gap-8">
          {[
            { v: `${teachers.length}`, l: "Giảng viên" },
            { v: `${totalCourses}`, l: "Khóa học" },
            { v: "4.8★", l: "Đánh giá" },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <p className="text-2xl font-extrabold" style={{ color: "var(--primary)" }}>{v}</p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teachers grid */}
      <section className="py-16 flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          {loading ? (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Đang tải...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-bold mb-1">Không tìm thấy giảng viên</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Thử từ khóa khác</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((teacher) => {
                const name = teacher.firstName ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() : teacher.username;
                const initial = name.charAt(0).toUpperCase();
                return (
                  <Link href={`/teachers/${teacher.id}`} key={teacher.id}
                    className="group card-base card-hover flex flex-col overflow-hidden">
                    {/* Banner */}
                    <div className="h-16 w-full" style={{ background: "linear-gradient(135deg, #051025, #121E36)" }} />
                    {/* Avatar + info */}
                    <div className="px-5 -mt-8 mb-3 flex items-end gap-3 relative z-10">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-extrabold shrink-0"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>{initial}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-[var(--primary)] transition-colors">{name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{teacher.email}</p>
                      </div>
                    </div>
                    <div className="px-5 pb-3 flex-1">
                      <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                        {teacher.bio || "Giảng viên tại LumiLearn"}
                      </p>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                      <span className="text-xs font-bold" style={{ color: "var(--primary)" }}>{teacher._count.courses} khóa học</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                        {teacher._count.courses > 2 ? "Chuyên gia" : "Giảng viên"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(160deg, #051025 0%, #0A1A35 50%, #121E36 100%)" }}>
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: "#F8FAFC" }}>Trở thành giảng viên</h2>
          <p className="text-base mb-8" style={{ color: "#94A3B8" }}>
            Chia sẻ kiến thức, tạo dựng uy tín và nhận thu nhập xứng đáng tại <span style={{ color: "#F8B486", fontWeight: 700 }}>LumiLearn</span>.
          </p>
          <a href="mailto:providminh24092004@gmail.com" className="px-10 py-4 rounded-lg font-bold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: "#F8B486", color: "#051025" }}>Liên hệ đăng ký →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
