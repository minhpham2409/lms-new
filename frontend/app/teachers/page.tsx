"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Search,
  Send,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Teacher {
  id: string; username: string; firstName: string | null; lastName: string | null; email: string; bio?: string | null;
  _count: { courses: number };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    expertise: "",
    experience: "",
    message: "",
  });

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

  async function submitApplication(e: FormEvent) {
    e.preventDefault();
    if (!applicationForm.fullName.trim() || !applicationForm.email.trim()) {
      toast.error("Vui lòng nhập họ tên và email");
      return;
    }
    setApplicationSubmitting(true);
    try {
      const res = await fetch(`${API}/users/public/teacher-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.message || "Không gửi được đăng ký");
      setApplicationSent(true);
      toast.success("Đã gửi đăng ký cho admin");
    } catch (error: any) {
      toast.error(error.message || "Lỗi kết nối");
    } finally {
      setApplicationSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      <section className="pt-28 pb-10 border-b border-border bg-[var(--background-2)]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)] mb-5">
                <GraduationCap className="w-4 h-4" />
                LumiLearn Faculty
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
                Đội ngũ giảng viên
              </h1>
              <p className="text-base md:text-lg text-foreground-muted max-w-xl">Chọn giảng viên phù hợp với mục tiêu học tập.</p>
            </div>
            <div className="rounded-xl border border-border bg-[var(--card)] p-4 shadow-sm">
              <label className="text-xs font-bold uppercase tracking-wide text-foreground-muted mb-2 block">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tên hoặc email..."
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  { v: `${teachers.length}`, l: "Giảng viên" },
                  { v: `${totalCourses}`, l: "Khóa học" },
                  { v: "4.8", l: "Đánh giá" },
                ].map(({ v, l }) => (
                  <div key={l} className="rounded-lg bg-[var(--muted)] px-3 py-2">
                    <p className="text-lg font-extrabold">{v}</p>
                    <p className="text-[10px] text-foreground-muted">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Danh sách giảng viên</h2>
              <p className="text-sm text-foreground-muted">
                {filtered.length} hồ sơ{searchQuery ? ` · "${searchQuery}"` : ""}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--card)] px-3 py-2 text-sm font-bold text-foreground-muted">
              <Award className="w-4 h-4 text-[var(--primary)]" />
              Hồ sơ đã xác thực
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-[var(--card)] py-20">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-foreground-muted">Đang tải danh sách giảng viên...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-border bg-[var(--card)]">
              <p className="text-lg font-bold mb-1">Không tìm thấy giảng viên</p>
              <p className="text-sm text-foreground-muted mb-4">Thử từ khóa khác hoặc xóa nội dung tìm kiếm.</p>
              <button onClick={() => setSearchQuery("")} className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)]">
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((teacher) => {
                const name = teacher.firstName ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() : teacher.username;
                const initial = name.charAt(0).toUpperCase();
                return (
                  <Link href={`/teachers/${teacher.id}`} key={teacher.id}
                    className="group rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-extrabold shrink-0 ring-4 ring-[var(--muted)]"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-base font-extrabold truncate group-hover:text-[var(--primary)] transition-colors">{name}</p>
                            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 text-xs text-foreground-muted">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{teacher.email}</span>
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
                        </div>
                      </div>
                    </div>

                    {teacher.bio && <p className="mt-5 min-h-[44px] text-sm line-clamp-2 text-foreground-muted">{teacher.bio}</p>}

                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4">
                      <div>
                        <p className="flex items-center gap-1 text-xs text-foreground-muted"><BookOpen className="w-3.5 h-3.5" /> Khóa</p>
                        <p className="font-extrabold">{teacher._count.courses}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs text-foreground-muted"><Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" /> Rating</p>
                        <p className="font-extrabold">4.8</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs text-foreground-muted"><Users className="w-3.5 h-3.5" /> Cấp</p>
                        <p className="font-extrabold truncate">{teacher._count.courses > 2 ? "Expert" : "Teacher"}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-14 border-t border-border bg-[var(--background-2)]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="rounded-xl border border-border bg-[var(--card)] p-6 md:p-8 shadow-sm flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                <Sparkles className="w-4 h-4" />
                Cộng tác cùng LumiLearn
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Trở thành giảng viên</h2>
              <p className="text-sm md:text-base text-foreground-muted">Gửi thông tin để admin liên hệ xét duyệt.</p>
            </div>
            <button onClick={() => { setApplicationOpen(true); setApplicationSent(false); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-bold text-[var(--primary-foreground)] transition-all hover:-translate-y-0.5">
              Liên hệ đăng ký <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {applicationOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={() => setApplicationOpen(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-border bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">Đăng ký giảng viên</p>
                <h3 className="text-xl font-extrabold">Gửi thông tin cho admin</h3>
              </div>
              <button onClick={() => setApplicationOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {applicationSent ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-2xl font-extrabold">Đã gửi đăng ký</h4>
                <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
                  Admin đã nhận được thông tin của bạn và sẽ liên hệ lại qua email hoặc số điện thoại đã cung cấp.
                </p>
                <button onClick={() => setApplicationOpen(false)} className="mt-6 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)]">
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={submitApplication} className="px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-sm font-bold"><User className="h-4 w-4 text-[var(--primary)]" /> Họ tên *</span>
                    <input required value={applicationForm.fullName} onChange={(e) => setApplicationForm({ ...applicationForm, fullName: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="Nguyễn Văn A" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Mail className="h-4 w-4 text-[var(--primary)]" /> Email *</span>
                    <input required type="email" value={applicationForm.email} onChange={(e) => setApplicationForm({ ...applicationForm, email: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="email@example.com" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-sm font-bold"><Phone className="h-4 w-4 text-[var(--primary)]" /> Số điện thoại</span>
                    <input value={applicationForm.phone} onChange={(e) => setApplicationForm({ ...applicationForm, phone: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="0912 345 678" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold">Chuyên môn</span>
                    <input value={applicationForm.expertise} onChange={(e) => setApplicationForm({ ...applicationForm, expertise: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="Toán, Tiếng Anh, Lập trình..." />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold">Kinh nghiệm giảng dạy</span>
                    <input value={applicationForm.experience} onChange={(e) => setApplicationForm({ ...applicationForm, experience: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="Ví dụ: 3 năm luyện thi THPT, đã có khóa học online..." />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-bold">Nội dung muốn trao đổi</span>
                    <textarea value={applicationForm.message} onChange={(e) => setApplicationForm({ ...applicationForm, message: e.target.value })} rows={4} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" placeholder="Giới thiệu ngắn về bạn, môn muốn dạy, link portfolio nếu có..." />
                  </label>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setApplicationOpen(false)} className="rounded-lg border border-border px-5 py-2.5 text-sm font-bold hover:bg-muted">
                    Hủy
                  </button>
                  <button type="submit" disabled={applicationSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-60">
                    {applicationSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {applicationSubmitting ? "Đang gửi..." : "Gửi cho admin"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
