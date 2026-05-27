"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  _count: { enrollments: number };
  sections: Array<{ _count: { lessons: number } }>;
}

interface Teacher {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  bio: string | null;
  createdAt: string;
  courses: Course[];
}

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`${API}/users/public/teachers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Teacher not found");
        return res.json();
      })
      .then((data) => {
        setTeacher(data);
        setBioInput(data.bio || "");
      })
      .catch((err) => {
        console.error("Error fetching teacher:", err);
        router.push("/teachers");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSaveBio = async () => {
    if (!token) return;
    setSavingBio(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: bioInput }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật giới thiệu!");
        setTeacher(prev => prev ? { ...prev, bio: bioInput } : null);
        setIsEditingBio(false);
      } else {
        toast.error("Không thể lưu thay đổi");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSavingBio(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="font-bold text-xl animate-pulse" style={{ color: "var(--primary)" }}>ĐANG TẢI...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!teacher) return null;

  const fullName = teacher.firstName
    ? `${teacher.firstName} ${teacher.lastName || ""}`.trim()
    : teacher.username;
  const initial = fullName.charAt(0).toUpperCase();
  const totalStudents = teacher.courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const totalLessons = teacher.courses.reduce((sum, c) => c.sections.reduce((s, sec) => s + sec._count.lessons, sum), 0);
  const isOwner = user?.id === teacher.id;

  // Parse bio into structured fields
  const parseBio = (bio: string) => {
    const fields: { key: string; value: string; icon: string }[] = [];
    let phone = "";
    const lines = bio.split("\n").map(l => l.trim()).filter(Boolean);
    const keyMap: Record<string, { label: string; icon: string }> = {
      "chuyên môn": { label: "Chuyên môn", icon: "book" },
      "chuyên ngành": { label: "Chuyên môn", icon: "book" },
      "kinh nghiệm": { label: "Kinh nghiệm", icon: "briefcase" },
      "thành tích": { label: "Thành tích & Giải thưởng", icon: "star" },
      "định hướng": { label: "Định hướng giảng dạy", icon: "target" },
      "mục tiêu": { label: "Mục tiêu", icon: "target" },
      "học vấn": { label: "Học vấn", icon: "graduation" },
    };
    const others: string[] = [];
    for (const line of lines) {
      const cleanLine = line.replace(/^[\u{1F4DE}\u{260E}\u{1F4F1}\u{1F3AF}\u{1F393}\u{1F4DD}\u{1F4BC}\u{1F3C6}\u{1F947}\u{1F4AC}\u{2728}\u{1F680}]\s*/u, "");
      const phoneM = cleanLine.match(/^(?:SĐT|SDT|Số điện thoại|Điện thoại|Phone)\s*[:：]\s*(.+)/i);
      if (phoneM) { phone = phoneM[1].trim(); continue; }
      let matched = false;
      for (const [k, meta] of Object.entries(keyMap)) {
        const re = new RegExp(`^${k}\\s*[:：]\\s*(.+)`, "i");
        const m = cleanLine.match(re);
        if (m) { fields.push({ key: meta.label, value: m[1].trim(), icon: meta.icon }); matched = true; break; }
      }
      if (!matched) others.push(line);
    }
    return { phone, fields, others: others.join("\n").trim() };
  };

  const bioData = teacher.bio ? parseBio(teacher.bio) : null;
  const introText = bioData?.others || (!bioData?.fields.length ? teacher.bio : "");
  const highlightedFields = bioData?.fields || [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <Navbar />

      {/* Hero Cover */}
      <div className="pt-16 relative">
        <div className="h-48 sm:h-64 relative overflow-hidden" style={{ background: "var(--background-2)" }}>
          <Image src="/images/hero_star_light.png" alt="Cover" fill className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent opacity-90" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative pb-8 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/teachers" className="absolute top-[-200px] left-4 sm:left-8 inline-block text-sm font-medium transition-colors z-10 px-3 py-1.5 rounded bg-black/30 backdrop-blur-sm" style={{ color: "var(--primary)" }}>
            ← QUAY LẠI
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 flex items-center justify-center text-5xl sm:text-6xl font-bold shadow-2xl relative z-10 rounded-2xl border-4"
              style={{ background: "var(--card)", borderColor: "var(--background)", color: "var(--primary)" }}>
              {initial}
            </div>

            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold">{fullName}</h1>
                <span className="text-xs font-bold uppercase tracking-widest rounded px-3 py-1" style={{ color: "var(--primary)", background: "var(--primary-bg, rgba(248,180,134,0.1))" }}>
                  GIẢNG VIÊN
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-sm mb-6 text-foreground-muted">
                {bioData?.phone && (<><span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{bioData.phone}</span><span>•</span></>)}
                <span>{teacher.email}</span>
                <span>•</span>
                <span>Tham gia {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {[
                  { label: "KHÓA HỌC", value: teacher.courses.length },
                  { label: "HỌC VIÊN", value: totalStudents },
                  { label: "BÀI GIẢNG", value: totalLessons },
                  { label: "ĐÁNH GIÁ", value: "4.9/5" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-start px-5 py-3 rounded-lg border border-border" style={{ background: "var(--card)" }}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-1">{stat.label}</span>
                    <span className="text-lg font-extrabold" style={{ color: "var(--primary)" }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "var(--card)" }}>
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>TRUNG TÂM GIẢNG DẠY</h2>
                  <p className="text-xs text-foreground-muted mt-1">Thông tin nhanh về hoạt động đào tạo</p>
                </div>
                <div className="p-6 grid grid-cols-2 gap-3">
                  {[
                    { label: "Khóa học", value: teacher.courses.length },
                    { label: "Học viên", value: totalStudents },
                    { label: "Bài giảng", value: totalLessons },
                    { label: "Năm tham gia", value: new Date(teacher.createdAt).getFullYear() },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border p-4" style={{ background: "var(--background)" }}>
                      <p className="text-xl font-extrabold" style={{ color: "var(--primary)" }}>{item.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Support Card */}
              <div className="rounded-xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "var(--primary)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  LIÊN HỆ HỖ TRỢ
                </h3>
                <p className="text-xs mb-5 text-foreground-muted leading-relaxed">
                  Nếu bạn cần tư vấn khóa học hoặc hỗ trợ, hãy liên hệ:
                </p>
                <div className="space-y-3">
                  <a href="tel:0916869648" className="flex items-center gap-3 text-sm font-semibold hover:text-[var(--primary)] transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "var(--muted)" }}>
                      <svg className="w-4 h-4 text-foreground-muted group-hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                    0916 869 648
                  </a>
                  <a href="mailto:providminh24092004@gmail.com" className="flex items-center gap-3 text-sm font-semibold hover:text-[var(--primary)] transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "var(--muted)" }}>
                      <svg className="w-4 h-4 text-foreground-muted group-hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="truncate">providminh24092004@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Content - Bio & Courses */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-border overflow-hidden mb-8" style={{ background: "var(--card)" }}>
                <div className="px-6 py-5 border-b border-border flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>HỒ SƠ GIẢNG DẠY</p>
                    <h2 className="text-xl font-extrabold mt-1">Giới thiệu & năng lực chuyên môn</h2>
                  </div>
                  {isOwner && !isEditingBio && (
                    <button onClick={() => setIsEditingBio(true)} className="shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                      SỬA HỒ SƠ
                    </button>
                  )}
                </div>

                {isEditingBio ? (
                  <div className="p-6">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full p-4 rounded-lg border outline-none text-sm resize-none mb-3 transition-colors"
                      style={{ background: "var(--background)", color: "var(--foreground)", borderColor: "var(--border)" }}
                      rows={10}
                      placeholder={"Viết giới thiệu theo từng dòng để hệ thống tự tách mục.\n\nVí dụ:\nSĐT: 0978102929\nChuyên môn: Vật lý, Hóa học\nKinh nghiệm: 23 năm bồi dưỡng học sinh giỏi\nThành tích: Giáo viên giỏi cấp tỉnh\nĐịnh hướng: Học chắc nền tảng, luyện tư duy giải đề"}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setIsEditingBio(false); setBioInput(teacher.bio || ""); }}
                              className="px-4 py-2 rounded text-xs font-bold text-foreground-muted hover:bg-[var(--muted)] transition-colors">
                        HỦY
                      </button>
                      <button onClick={handleSaveBio} disabled={savingBio}
                              className="px-4 py-2 rounded text-xs font-bold transition-colors disabled:opacity-60" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        {savingBio ? "ĐANG LƯU..." : "LƯU"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {introText ? (
                      <div className="rounded-xl border p-5" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--primary)" }}>Giới thiệu</p>
                        <p className="text-sm leading-7 whitespace-pre-wrap text-foreground-muted">{introText}</p>
                      </div>
                    ) : highlightedFields.length === 0 ? (
                      <div className="rounded-xl border border-border p-5 text-sm italic text-foreground-muted" style={{ background: "var(--background)" }}>
                        Chưa có thông tin giới thiệu.
                      </div>
                    ) : null}

                    {highlightedFields.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {highlightedFields.map((field, index) => {
                          const isSpecialty = field.key === "Chuyên môn";
                          return (
                            <div key={`${field.key}-${index}`} className="rounded-xl border border-border p-5" style={{ background: "var(--background-2, var(--background))" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "var(--primary)" }}>{field.key}</p>
                              {isSpecialty ? (
                                <div className="flex flex-wrap gap-2">
                                  {field.value.split(/[,、;]+/).filter(Boolean).map((item, itemIndex) => (
                                    <span key={itemIndex} className="inline-flex px-3 py-1.5 rounded-md text-xs font-bold border" style={{ background: "var(--primary-bg, rgba(248,180,134,0.1))", color: "var(--primary)", borderColor: "var(--primary-border, rgba(248,180,134,0.2))" }}>
                                      {item.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm leading-6 whitespace-pre-wrap">{field.value}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider">
                  KHÓA HỌC <span style={{ color: "var(--primary)" }}>({teacher.courses.length})</span>
                </h2>
              </div>

              {teacher.courses.length === 0 ? (
                <div className="border border-border rounded-xl text-center py-16" style={{ background: "var(--card)" }}>
                  <div className="text-4xl mb-4 opacity-30">📚</div>
                  <h3 className="font-bold text-lg mb-2">Chưa có khóa học</h3>
                  <p className="text-sm text-foreground-muted">Giáo viên này hiện chưa xuất bản khóa học nào.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {teacher.courses.map(course => {
                    const lessonCount = course.sections.reduce((sum, sec) => sum + sec._count.lessons, 0);

                    return (
                      <Link href={`/courses/${course.id}`} key={course.id}
                            className="flex flex-col sm:flex-row rounded-xl border border-border overflow-hidden group hover:border-[var(--primary)] transition-colors" style={{ background: "var(--card)" }}>
                        {/* Thumbnail */}
                        <div className="sm:w-56 md:w-64 flex-shrink-0 aspect-video sm:aspect-auto relative overflow-hidden" style={{ background: "var(--background)" }}>
                          {course.thumbnail ? (
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              fill
                              className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center min-h-[140px]">
                              <Image src="/images/hero_star_light.png" alt="Cover" fill className="object-cover opacity-20" />
                              <span className="text-xs font-bold text-foreground-muted relative z-10">CHƯA CÓ ẢNH BÌA</span>
                            </div>
                          )}
                          {/* Price badge */}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded text-[10px] font-bold tracking-widest" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                            {course.price > 0 ? `${course.price.toLocaleString()}Đ` : "MIỄN PHÍ"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm mb-4 line-clamp-2 leading-relaxed text-foreground-muted">
                                {course.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold text-foreground-muted">
                            <span>{course._count.enrollments} HỌC VIÊN</span>
                            <span>•</span>
                            <span>{lessonCount} BÀI HỌC</span>
                            <span>•</span>
                            <span>{course.sections.length} CHƯƠNG</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
