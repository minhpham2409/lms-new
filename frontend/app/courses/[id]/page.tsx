"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  Play, Clock, Users, Star, BookOpen, ChevronDown, ChevronRight,
  CheckCircle2, ShoppingCart, Lock, Award, BarChart3, Globe,
  MessageCircle, ArrowLeft, Loader2, PlayCircle,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface CourseData {
  id: string; title: string; description: string; price: number; status: string;
  author: { id: string; username: string; firstName?: string; lastName?: string };
  sections: { id: string; title: string; order: number; lessons: { id: string; title: string; duration?: number; order: number }[] }[];
  _count: { enrollments: number };
  reviews?: { rating: number }[];
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuth();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (token && course) checkEnrollment();
  }, [token, course]);

  async function fetchCourse() {
    try {
      const res = await fetch(`${API}/courses/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourse(data);
      if (data.sections?.length > 0) setOpenSections([data.sections[0].id]);
    } catch { toast.error("Không tìm thấy khóa học"); }
    finally { setLoading(false); }
  }

  async function checkEnrollment() {
    try {
      const res = await fetch(`${API}/enrollments/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const enrollments = await res.json();
        const found = enrollments.find?.((e: any) => e.courseId === id);
        if (found) { setEnrolled(true); setEnrollProgress(found.progress || 0); }
      }
    } catch {}
  }

  async function handleEnroll() {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      });
      if (res.ok || res.status === 201) {
        setEnrolled(true);
        toast.success("Đã đăng ký khóa học thành công!");
      } else {
        const data = await res.json();
        // If already enrolled
        if (res.status === 409 || data.message?.includes("already")) {
          setEnrolled(true);
        } else {
          throw new Error(data.message);
        }
      }
    } catch (e: any) { toast.error(e.message || "Không thể đăng ký"); }
    finally { setActionLoading(false); }
  }

  async function handleAddToCart() {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      });
      if (res.ok || res.status === 201) {
        toast.success("Đã thêm vào giỏ hàng!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Không thể thêm vào giỏ");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setActionLoading(false); }
  }

  const toggleSection = (sId: string) => {
    setOpenSections((prev) => prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24 max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold mt-20">Không tìm thấy khóa học</h1>
        <Link href="/courses" className="btn-primary mt-4 inline-flex">← Quay lại</Link>
      </div>
    </div>
  );

  const totalLessons = course.sections?.reduce((s, sec) => s + (sec.lessons?.length || 0), 0) || 0;
  const authorName = course.author?.firstName ? `${course.author.firstName} ${course.author.lastName || ""}`.trim() : course.author?.username || "Giáo viên";
  const avgRating = course.reviews?.length ? (course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length).toFixed(1) : "Mới";
  const firstLessonId = course.sections?.[0]?.lessons?.[0]?.id;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            <Link href="/courses" className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Khóa học
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--foreground)" }}>{course.title}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl aspect-video mb-8 flex items-center justify-center relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(8,145,178,0.1))" }}>
                <button className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}>
                  <Play className="w-7 h-7 text-white ml-1" />
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">{course.title}</h1>
              <p className="text-base leading-relaxed mb-6" style={{ color: "var(--foreground-muted)" }}>{course.description}</p>

              <div className="flex flex-wrap items-center gap-4 mb-8 text-sm" style={{ color: "var(--foreground-muted)" }}>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {avgRating}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {course._count?.enrollments || 0} học sinh</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {totalLessons} bài học</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Tiếng Việt</span>
              </div>

              <div className="divider mb-8" />

              {/* Curriculum */}
              <h2 className="text-xl font-bold mb-4">Nội dung khóa học</h2>
              <div className="space-y-3 mb-8">
                {course.sections?.sort((a, b) => a.order - b.order).map((sec) => (
                  <div key={sec.id} className="card-base overflow-hidden">
                    <button onClick={() => toggleSection(sec.id)} className="w-full flex items-center justify-between p-4 text-left">
                      <div className="flex items-center gap-3">
                        <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes(sec.id) ? "rotate-0" : "-rotate-90"}`} style={{ color: "var(--foreground-muted)" }} />
                        <span className="font-semibold text-sm">{sec.title}</span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{sec.lessons?.length || 0} bài</span>
                    </button>
                    {openSections.includes(sec.id) && (
                      <div style={{ borderTop: "1px solid var(--border)" }}>
                        {sec.lessons?.sort((a, b) => a.order - b.order).map((lesson, li) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]">
                            {enrolled ? (
                              <Link href={`/courses/${id}/lessons/${lesson.id}`} className="flex items-center gap-3 flex-1">
                                <PlayCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                                <span className="text-sm flex-1">{lesson.title}</span>
                                {lesson.duration && <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{Math.round(lesson.duration / 60)} phút</span>}
                              </Link>
                            ) : (
                              <>
                                {li === 0 && sec.order === 1 ? (
                                  <Play className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                                ) : (
                                  <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
                                )}
                                <span className="text-sm flex-1">{lesson.title}</span>
                                {li === 0 && sec.order === 1 && <span className="badge badge-success text-[10px]">Miễn phí</span>}
                                {lesson.duration && <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{Math.round(lesson.duration / 60)} phút</span>}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <h2 className="text-xl font-bold mb-4">Bạn sẽ học được gì</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {["Nắm vững kiến thức cơ bản", "Giải bài tập nhanh chóng", "Tư duy logic", "Chuẩn bị cho kỳ thi", "Phương pháp học hiệu quả", "Ứng dụng thực tế"].map((t) => (
                  <div key={t} className="flex items-start gap-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#10b981" }} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="glass-card rounded-2xl p-6 sticky top-24" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                {enrolled ? (
                  /* ===== ENROLLED UI ===== */
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                      <span className="font-bold" style={{ color: "#10b981" }}>Đã tham gia khóa học</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Tiến độ</span>
                        <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>{enrollProgress}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${enrollProgress}%` }} /></div>
                    </div>

                    {firstLessonId && (
                      <Link href={`/courses/${id}/lessons/${firstLessonId}`}
                        className="btn-primary w-full justify-center py-3.5 text-base mb-3">
                        <PlayCircle className="w-5 h-5" /> {enrollProgress > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                      </Link>
                    )}

                    <Link href="/dashboard" className="btn-secondary w-full justify-center py-3 text-sm">
                      <BarChart3 className="w-4 h-4" /> Xem tiến độ
                    </Link>
                  </>
                ) : (
                  /* ===== NOT ENROLLED UI ===== */
                  <>
                    <p className="text-3xl font-extrabold mb-1 gradient-text">
                      {course.price > 0 ? `${(course.price / 1000).toFixed(0)}k ₫` : "Miễn phí"}
                    </p>
                    <p className="text-xs mb-6" style={{ color: "var(--foreground-muted)" }}>
                      {course.price > 0 ? "Thanh toán một lần, học trọn đời" : "Truy cập toàn bộ nội dung"}
                    </p>

                    <button onClick={handleEnroll} disabled={actionLoading}
                      className="btn-primary w-full justify-center py-3.5 text-base mb-3 disabled:opacity-50">
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {course.price > 0 ? "Mua ngay" : "Đăng ký miễn phí"}
                    </button>

                    {course.price > 0 && (
                      <button onClick={handleAddToCart} disabled={actionLoading}
                        className="btn-secondary w-full justify-center py-3 text-sm mb-6 disabled:opacity-50">
                        <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
                      </button>
                    )}
                  </>
                )}

                <div className="divider my-5" />

                <div className="space-y-3 text-sm">
                  {[
                    { icon: BookOpen, label: `${totalLessons} bài học` },
                    { icon: BarChart3, label: "Cơ bản đến nâng cao" },
                    { icon: Award, label: "Chứng chỉ hoàn thành" },
                    { icon: MessageCircle, label: "Hỗ trợ qua bình luận" },
                    { icon: Globe, label: "Truy cập trọn đời" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3" style={{ color: "var(--foreground-muted)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#7c3aed" }} /> <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="divider my-5" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                    {authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{authorName}</p>
                    <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Giáo viên</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
