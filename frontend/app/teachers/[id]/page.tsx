"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Users, BookOpen, Star, Loader2, ArrowLeft, Mail, Calendar, GraduationCap, Video, Edit2, Save, X, Phone, MapPin, Award, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  _count: {
    enrollments: number;
  };
  sections: Array<{
    _count: {
      lessons: number;
    }
  }>;
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
          <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "#7c3aed" }} />
          <p style={{ color: "var(--foreground-muted)" }}>Đang tải thông tin giáo viên...</p>
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

  const gradients = [
    "linear-gradient(135deg, #7c3aed, #0891b2)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #0891b2)",
    "linear-gradient(135deg, #ec4899, #7c3aed)",
  ];
  const charCode = teacher.id.charCodeAt(0) || 0;
  const bgGradient = gradients[charCode % gradients.length];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Cover Banner */}
      <div className="pt-20 relative">
        <div className="h-48 sm:h-64 relative overflow-hidden" style={{ background: bgGradient }}>
          {/* Decorative pattern */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)" }} />
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)", backgroundSize: "100px 100px" }} />
          {/* Floating shapes */}
          <div className="absolute top-8 right-12 w-20 h-20 rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-12 right-32 w-12 h-12 rounded-full opacity-10 bg-white" />
          <div className="absolute top-16 left-[30%] w-8 h-8 rounded-lg opacity-10 bg-white rotate-45" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative pb-8" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/teachers" className="absolute top-[-220px] sm:top-[-250px] left-4 sm:left-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors z-10 backdrop-blur-sm px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(0,0,0,0.2)" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 rounded-3xl flex items-center justify-center text-5xl sm:text-6xl font-bold text-white shadow-2xl relative z-10"
                 style={{ background: bgGradient, border: "5px solid var(--card)", boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
              {initial}
            </div>

            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold">{fullName}</h1>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
                  Giảng viên
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-sm mb-5" style={{ color: "var(--foreground-muted)" }}>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {teacher.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Tham gia {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {[
                  { icon: BookOpen, label: "Khóa học", value: teacher.courses.length, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
                  { icon: Users, label: "Học viên", value: totalStudents, color: "#0891b2", bg: "rgba(8,145,178,0.08)" },
                  { icon: Video, label: "Bài giảng", value: totalLessons, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
                  { icon: Star, label: "Đánh giá", value: "4.9/5", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-colors"
                       style={{ background: stat.bg }}>
                    <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                    <div className="text-left">
                      <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--foreground-muted)" }}>{stat.label}</p>
                      <p className="font-extrabold text-sm leading-tight">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bio Card */}
              <div className="card-base p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Award className="w-5 h-5" style={{ color: "#7c3aed" }} /> Giới thiệu
                  </h2>
                  {isOwner && !isEditingBio && (
                    <button onClick={() => setIsEditingBio(true)} className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                            style={{ background: "var(--muted)" }}>
                      <Edit2 className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    </button>
                  )}
                </div>

                {isEditingBio ? (
                  <div>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="input-base resize-none mb-3 text-sm"
                      rows={5}
                      placeholder="Viết một vài điều về bản thân bạn..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setIsEditingBio(false); setBioInput(teacher.bio || ""); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--muted)", color: "var(--foreground-muted)" }}>
                        Hủy
                      </button>
                      <button onClick={handleSaveBio} disabled={savingBio}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex items-center gap-1.5"
                              style={{ background: "#7c3aed" }}>
                        {savingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Lưu
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground-muted)" }}>
                    {teacher.bio || <span className="italic opacity-60">Chưa có thông tin giới thiệu.</span>}
                  </p>
                )}
              </div>

              {/* Quick Info Card */}
              <div className="card-base p-6">
                <h3 className="font-bold text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>THÔNG TIN</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(124,58,237,0.08)" }}>
                      <GraduationCap className="w-4 h-4" style={{ color: "#7c3aed" }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>Vai trò</p>
                      <p className="text-sm font-semibold">Giảng viên</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.08)" }}>
                      <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>Tổng bài giảng</p>
                      <p className="text-sm font-semibold">{totalLessons} bài học</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.08)" }}>
                      <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>Ngày tham gia</p>
                      <p className="text-sm font-semibold">{new Date(teacher.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Admin Card */}
              <div className="card-base p-6" style={{ border: "1px solid rgba(124,58,237,0.15)" }}>
                <h3 className="font-bold text-sm mb-3">Liên hệ hỗ trợ</h3>
                <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>
                  Nếu bạn cần tư vấn khóa học hoặc hỗ trợ, hãy liên hệ:
                </p>
                <div className="space-y-2.5">
                  <a href="tel:0916869648" className="flex items-center gap-2.5 text-sm font-medium hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                      <Phone className="w-4 h-4" style={{ color: "#7c3aed" }} />
                    </div>
                    <span>0916 869 648</span>
                  </a>
                  <a href="mailto:providminh24092004@gmail.com" className="flex items-center gap-2.5 text-sm font-medium hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                      <Mail className="w-4 h-4" style={{ color: "#7c3aed" }} />
                    </div>
                    <span className="truncate">providminh24092004@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Content - Courses */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
                    <BookOpen className="w-4.5 h-4.5" style={{ color: "#7c3aed" }} />
                  </div>
                  Khóa học ({teacher.courses.length})
                </h2>
              </div>

              {teacher.courses.length === 0 ? (
                <div className="card-base text-center py-16">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: "var(--foreground-muted)" }} />
                  <h3 className="font-bold text-lg mb-2">Chưa có khóa học</h3>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    Giáo viên này hiện chưa xuất bản khóa học nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {teacher.courses.map(course => {
                    const lessonCount = course.sections.reduce((sum, sec) => sum + sec._count.lessons, 0);

                    return (
                      <Link href={`/courses/${course.id}`} key={course.id}
                            className="card-base card-hover flex flex-col sm:flex-row p-0 overflow-hidden group">
                        {/* Thumbnail */}
                        <div className="sm:w-56 md:w-64 flex-shrink-0 aspect-video sm:aspect-auto relative overflow-hidden"
                             style={{ background: "var(--muted)" }}>
                          {course.thumbnail ? (
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 min-h-[140px]" style={{ color: "var(--foreground-muted)" }}>
                              <BookOpen className="w-8 h-8 opacity-40" />
                              <span className="text-xs opacity-60">Chưa có ảnh bìa</span>
                            </div>
                          )}
                          {/* Price badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white backdrop-blur-md"
                               style={{ background: course.price > 0 ? "rgba(124,58,237,0.85)" : "rgba(16,185,129,0.85)" }}>
                            {course.price > 0 ? `${course.price.toLocaleString()}đ` : "Miễn phí"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-xs mb-4 line-clamp-2 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
                                {course.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--foreground-muted)" }}>
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" /> {course._count.enrollments} học viên
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5" /> {lessonCount} bài học
                            </span>
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" /> {course.sections.length} chương
                            </span>
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
