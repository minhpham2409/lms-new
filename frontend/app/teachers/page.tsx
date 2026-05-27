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
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Teacher {
  id: string; username: string; firstName: string | null; lastName: string | null; email: string; bio?: string | null;
  _count: { courses: number };
}

// Color palette for avatar gradients - gives each card a unique feel
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

function parseBioShort(bio: string | null | undefined): string {
  if (!bio) return "";
  // Remove structured lines (SĐT, Chuyên môn, Kinh nghiệm, etc.) and return only intro text
  const structured = /^(SĐT|SDT|Số điện thoại|Chuyên môn|Kinh nghiệm|Thành tích|Định hướng|Giải thưởng)[:\s]/im;
  const lines = bio.split("\n").filter(l => l.trim() && !structured.test(l.trim()));
  return lines.join(" ").slice(0, 120);
}

function parseSpecialties(bio: string | null | undefined): string[] {
  if (!bio) return [];
  const match = bio.match(/(?:Chuyên môn|Chuyên ngành)[:\s]+(.+)/i);
  if (!match) return [];
  return match[1].split(/[,、;]+/).map(s => s.trim()).filter(Boolean).slice(0, 4);
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

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section className="pt-28 pb-12 border-b border-border relative overflow-hidden" style={{ background: "var(--background-2)" }}>
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 80% 50%, var(--primary) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }} />
        
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10 relative z-10">
          <div className="grid lg:grid-cols-[1fr_400px] gap-10 items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-[var(--primary)] mb-6">
                <GraduationCap className="w-4 h-4" />
                LumiLearn Faculty
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
                Đội ngũ giảng viên
              </h1>
              <p className="text-base md:text-lg text-foreground-muted max-w-xl leading-relaxed">
                Được tuyển chọn và xác thực bởi LumiLearn. Mỗi giảng viên đều có kinh nghiệm thực tế và phương pháp giảng dạy hiệu quả.
              </p>
            </div>

            {/* Search & Stats Card */}
            <div className="rounded-2xl border border-border bg-[var(--card)] p-5 shadow-lg">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm giảng viên theo tên, email..."
                  className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { v: `${teachers.length}`, l: "Giảng viên", color: "var(--primary)" },
                  { v: `${totalCourses}`, l: "Khóa học", color: "#10b981" },
                  { v: "4.9", l: "Đánh giá TB", color: "#f59e0b" },
                ].map(({ v, l, color }) => (
                  <div key={l} className="rounded-xl border border-border bg-[var(--background)] px-3 py-3 text-center transition-all hover:border-primary/30">
                    <p className="text-xl font-extrabold" style={{ color }}>{v}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-foreground-muted mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TEACHER GRID ═══════════════ */}
      <section className="py-10 flex-1">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">Danh sách giảng viên</h2>
              <p className="text-sm text-foreground-muted mt-1">
                {filtered.length} hồ sơ{searchQuery ? ` phù hợp với "${searchQuery}"` : " đã xác thực"}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-2 text-sm font-bold text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Đã xác thực bởi LumiLearn
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-[var(--card)] py-20">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
              <p className="text-sm text-foreground-muted">Đang tải danh sách giảng viên...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-border bg-[var(--card)]">
              <Users className="w-12 h-12 mx-auto text-foreground-muted mb-4 opacity-40" />
              <p className="text-lg font-bold mb-1">Không tìm thấy giảng viên</p>
              <p className="text-sm text-foreground-muted mb-4">Thử từ khóa khác hoặc xóa nội dung tìm kiếm.</p>
              <button onClick={() => setSearchQuery("")} className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-bold text-[var(--primary-foreground)]">
                Xóa tìm kiếm
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((teacher, index) => {
                const name = teacher.firstName ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() : teacher.username;
                const initial = name.charAt(0).toUpperCase();
                const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
                const bioPreview = parseBioShort(teacher.bio);
                const specialties = parseSpecialties(teacher.bio);
                const courseCount = teacher._count.courses;
                
                return (
                  <Link href={`/teachers/${teacher.id}`} key={teacher.id}
                    className="group relative overflow-hidden rounded-2xl border border-border bg-[var(--card)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/30">
                    
                    {/* Top decorative band */}
                    <div className="h-24 relative overflow-hidden">
                      <div className="absolute inset-0" style={{ background: gradient, opacity: 0.15 }} />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--card)]" />
                      {/* Floating decorative circles */}
                      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full" style={{ background: gradient, opacity: 0.08 }} />
                      <div className="absolute right-10 top-6 w-8 h-8 rounded-full" style={{ background: gradient, opacity: 0.06 }} />
                    </div>

                    {/* Avatar overlapping the band */}
                    <div className="px-5 -mt-10 relative z-10">
                      <div className="flex items-end gap-4">
                        <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0 shadow-lg ring-4 ring-[var(--card)] transition-transform duration-300 group-hover:scale-105"
                          style={{ background: gradient }}>
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-lg font-extrabold truncate group-hover:text-[var(--primary)] transition-colors leading-tight">{name}</p>
                          <p className="text-xs text-foreground-muted truncate mt-0.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bio preview */}
                    <div className="px-5 mt-4">
                      {bioPreview ? (
                        <p className="text-sm text-foreground-muted line-clamp-2 leading-relaxed">{bioPreview}</p>
                      ) : (
                        <p className="text-sm text-foreground-muted italic opacity-60">Giảng viên tại LumiLearn</p>
                      )}
                    </div>

                    {/* Specialty tags */}
                    {specialties.length > 0 && (
                      <div className="px-5 mt-3 flex flex-wrap gap-1.5">
                        {specialties.map((tag, i) => (
                          <span key={i} className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold border"
                            style={{ borderColor: "var(--border)", color: "var(--primary)", background: "var(--background)" }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats footer */}
                    <div className="px-5 pb-5 mt-5">
                      <div className="flex items-center justify-between rounded-xl border border-border bg-[var(--background)] px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                          <span className="text-sm font-extrabold">{courseCount}</span>
                          <span className="text-xs text-foreground-muted">khóa học</span>
                        </div>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-foreground-muted" />
                          <span className="text-xs font-bold text-foreground-muted">{courseCount > 2 ? "Chuyên gia" : "Giảng viên"}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-foreground-muted transition-transform group-hover:translate-x-1 group-hover:text-[var(--primary)]" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ CTA SECTION ═══════════════ */}
      <section className="py-14 border-t border-border" style={{ background: "var(--background-2)" }}>
        <div className="max-w-[1200px] mx-auto px-6 sm:px-10">
          <div className="rounded-2xl border border-border bg-[var(--card)] overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-[1fr_auto] items-center">
              <div className="p-8 md:p-10">
                <div className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
                  <Sparkles className="w-4 h-4" />
                  Cộng tác cùng LumiLearn
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Trở thành giảng viên</h2>
                <p className="text-sm md:text-base text-foreground-muted max-w-lg">
                  Chia sẻ kiến thức, xây dựng khóa học và tạo thu nhập bền vững. Gửi thông tin để admin liên hệ xét duyệt.
                </p>
              </div>
              <div className="px-8 pb-8 md:pb-0 md:pr-10">
                <button onClick={() => { setApplicationOpen(true); setApplicationSent(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 py-3.5 text-sm font-bold text-[var(--primary-foreground)] transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Đăng ký ngay <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ APPLICATION MODAL ═══════════════ */}
      {applicationOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" onClick={() => setApplicationOpen(false)}>
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-[var(--card)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
