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
  MessageCircle, ArrowLeft, Loader2, PlayCircle, QrCode, X, Send, AlertCircle,
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
  const [enrollStatus, setEnrollStatus] = useState<string>("");
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrSent, setQrSent] = useState(false);
  const [hasParent, setHasParent] = useState<boolean | null>(null);
  const [sendingQR, setSendingQR] = useState(false);
  const [courseQrData, setCourseQrData] = useState<{ vietQrUrl: string; txnRef: string; addInfo: string; amount: number } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (token && course) checkEnrollment();
    if (token && user?.role === "student") checkParentLink();
  }, [token, course]);

  async function checkParentLink() {
    try {
      // Check incoming link requests (pending or accepted)
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) { setHasParent(true); return; }
      }
      // Try to check if any parent already linked (accepted links won't show in incoming)
      // Use enrollments endpoint to infer — if student has completed paid courses, parent was linked
      const profileRes = await fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.childLinks?.length > 0 || profile.parentChild?.length > 0) {
          setHasParent(true); return;
        }
      }
      setHasParent(false); // No parent found — block
    } catch { setHasParent(false); }
  }

  useEffect(() => {
    if (course) fetchReviews();
  }, [course]);

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
      const res = await fetch(`${API}/enrollments/${id}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // API returns { isEnrolled: boolean, enrollment: {...} | null }
        if (data.isEnrolled && data.enrollment) {
          setEnrolled(true);
          setEnrollProgress(data.enrollment.progress || 0);
          setEnrollStatus(data.enrollment.status || "active");
          return;
        }
        // Fallback: direct enrollment object (older format)
        if (data.courseId) {
          setEnrolled(true);
          setEnrollProgress(data.progress || 0);
          setEnrollStatus(data.status || "active");
          return;
        }
      }
    } catch {}
    // Final fallback: check from my-courses list
    try {
      const res2 = await fetch(`${API}/enrollments/my-courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res2.ok) {
        const enrollments = await res2.json();
        const found = enrollments.find?.((e: any) => e.courseId === id);
        if (found) { setEnrolled(true); setEnrollProgress(found.progress || 0); setEnrollStatus(found.status || "active"); }
      }
    } catch {}
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API}/courses/${id}/reviews`);
      if (res.ok) setReviews(await res.json());
    } catch {}
  }

  async function submitReview() {
    if (!reviewText.trim()) { toast.error("Vui lòng nhập nội dung đánh giá"); return; }
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id, rating: reviewRating, comment: reviewText }),
      });
      if (res.ok) { toast.success("Đã gửi đánh giá!"); setReviewText(""); fetchReviews(); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi gửi đánh giá"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setReviewSubmitting(false); }
  }

  async function handleEnrollFree() {
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
        setEnrollStatus("active");
        toast.success("Đã đăng ký khóa học thành công!");
      } else {
        const data = await res.json();
        if (res.status === 409 || data.message?.includes("already")) {
          setEnrolled(true);
        } else {
          throw new Error(data.message);
        }
      }
    } catch (e: any) { toast.error(e.message || "Không thể đăng ký"); }
    finally { setActionLoading(false); }
  }

  async function handleBuyNow() {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role === "student" && hasParent !== true) {
      toast.error("Bạn cần liên kết tài khoản phụ huynh trước khi mua khóa học!");
      return;
    }
    // Show modal with loading state, create order + QR
    setShowQR(true);
    setSendingQR(true);
    setCourseQrData(null);
    try {
      // Add to cart first
      await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      }).catch(() => {});

      // Create order atomically (order + items + pending enrollments)
      const orderRes = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        if (!err.message?.includes("already enrolled")) {
          toast.error(err.message || "Không thể tạo đơn hàng");
          setShowQR(false); setSendingQR(false);
          return;
        }
      }
      const order = await orderRes.json();

      // Generate QR from API
      const qrRes = await fetch(`${API}/payments/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (qrRes.ok) {
        const qr = await qrRes.json();
        setCourseQrData({ vietQrUrl: qr.vietQrUrl, txnRef: qr.txnRef, addInfo: qr.addInfo, amount: Number(qr.amount) });
      } else {
        toast.error("Không thể tạo mã QR");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSendingQR(false); }
  }

  async function handleAddToCart() {
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      });
      if (res.ok || res.status === 201) {
        toast.success("Đã thêm vào giỏ hàng!");
      } else {
        const data = await res.json();
        if (data.message?.includes("already") || res.status === 409) {
          toast.info("Khóa học đã có trong giỏ hàng");
        } else {
          toast.error(data.message || "Không thể thêm vào giỏ");
        }
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setActionLoading(false); }
  }

  function handleConfirmSentToParent() {
    // Order + QR already created in handleBuyNow
    setEnrolled(true);
    setEnrollStatus("pending");
    setQrSent(true);
    toast.success("Đã gửi mã QR đến phụ huynh!");
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
  const isPending = enrollStatus === "pending";
  const canAccess = enrolled && !isPending;

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
                            {canAccess ? (
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

              {/* Reviews section */}
              <div className="divider mb-8" />
              <h2 className="text-xl font-bold mb-4">Đánh giá ({reviews.length})</h2>

              {/* Review form - only for enrolled students */}
              {canAccess && user?.role === "student" && (
                <div className="card-base mb-6">
                  <h3 className="font-semibold text-sm mb-3">Viết đánh giá</h3>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star className="w-5 h-5" style={{ color: s <= reviewRating ? "#f59e0b" : "var(--border)", fill: s <= reviewRating ? "#f59e0b" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Chia sẻ trải nghiệm học tập..." rows={3} className="input-base resize-none mb-3" />
                  <button onClick={submitReview} disabled={reviewSubmitting} className="btn-primary text-sm">
                    {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi đánh giá
                  </button>
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="card-base text-center py-8">
                  <Star className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--foreground-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="card-base flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: "rgba(124,58,237,0.4)" }}>
                        {(r.user?.firstName || r.user?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold">{r.user?.firstName || r.user?.username}</span>
                          <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <div className="flex gap-0.5 mb-1">{Array.from({ length: 5 }, (_, j) => <Star key={j} className="w-3 h-3" style={{ color: j < r.rating ? "#f59e0b" : "var(--border)", fill: j < r.rating ? "#f59e0b" : "none" }} />)}</div>
                        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{r.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="glass-card rounded-2xl p-6 sticky top-24" style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
                {isPending ? (
                  /* ===== PENDING APPROVAL UI ===== */
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5" style={{ color: "#f59e0b" }} />
                      <span className="font-bold" style={{ color: "#f59e0b" }}>Đang chờ duyệt</span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                      Mã QR đã được gửi cho phụ huynh. Sau khi chuyển tiền, hệ thống sẽ tự kích hoạt khóa học.
                    </p>
                    <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#f59e0b" }}>
                        <Clock className="w-4 h-4" /> Chờ phụ huynh thanh toán & hệ thống xác nhận
                      </div>
                    </div>
                    <Link href="/dashboard" className="btn-secondary w-full justify-center py-3 text-sm">
                      <BarChart3 className="w-4 h-4" /> Về Dashboard
                    </Link>
                  </>
                ) : canAccess ? (
                  /* ===== ENROLLED UI ===== */
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981" }} />
                      <span className="font-bold" style={{ color: "#10b981" }}>Đã tham gia khóa học</span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Tiến độ</span>
                        <span className="text-sm font-bold" style={{ color: "#a78bfa" }}>{Number(enrollProgress).toFixed(2)}%</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(100, enrollProgress)}%` }} /></div>
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
                      {course.price > 0 ? `${course.price.toLocaleString()} ₫` : "Miễn phí"}
                    </p>
                    <p className="text-xs mb-6" style={{ color: "var(--foreground-muted)" }}>
                      {course.price > 0 ? "Thanh toán một lần, học trọn đời" : "Truy cập toàn bộ nội dung"}
                    </p>

                    {course.price > 0 && hasParent !== true && user?.role === "student" && (
                      <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Chưa liên kết phụ huynh</p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--foreground-muted)" }}>Liên kết tài khoản phụ huynh để được thanh toán</p>
                        </div>
                      </div>
                    )}

                    {course.price > 0 ? (
                      <>
                        <button onClick={handleBuyNow} disabled={actionLoading}
                          className="btn-primary w-full justify-center py-3.5 text-base mb-3 disabled:opacity-50">
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                          Mua ngay
                        </button>
                        {user?.role === "student" && (
                          <button onClick={handleAddToCart} disabled={actionLoading}
                            className="btn-secondary w-full justify-center py-3 text-sm mb-6 disabled:opacity-50">
                            <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
                          </button>
                        )}
                      </>
                    ) : (
                      <button onClick={handleEnrollFree} disabled={actionLoading}
                        className="btn-primary w-full justify-center py-3.5 text-base mb-3 disabled:opacity-50">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Đăng ký miễn phí
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

      {/* QR Payment Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card-base w-full max-w-md animate-scale-in" style={{ background: "var(--popover)" }}>
            {!qrSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    <QrCode className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thanh toán
                  </h2>
                  <button onClick={() => setShowQR(false)} className="btn-ghost px-2 py-2"><X className="w-5 h-5" /></button>
                </div>

                {sendingQR ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#7c3aed" }} />
                    <p className="text-sm font-semibold">Đang tạo đơn hàng & mã QR...</p>
                    <p className="text-xs mt-2" style={{ color: "var(--foreground-muted)" }}>Vui lòng chờ trong giây lát</p>
                  </div>
                ) : courseQrData ? (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-sm font-semibold mb-1">{course.title}</p>
                      <p className="text-xs mb-4" style={{ color: "var(--foreground-muted)" }}>Quét mã QR bên dưới để thanh toán</p>
                      <div className="w-56 h-56 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: "white", border: "2px solid var(--border)" }}>
                        <img src={courseQrData.vietQrUrl} alt="VietQR Payment" className="w-52 h-52 object-contain" />
                      </div>
                      <p className="text-xs mb-1 font-mono px-2 py-1.5 rounded-lg inline-block" style={{ background: "var(--muted)" }}>
                        Nội dung CK: <span className="font-bold">{courseQrData.addInfo}</span>
                      </p>
                      <p className="text-[10px] mt-2 mb-3" style={{ color: "var(--foreground-muted)" }}>
                        ⚠️ Nội dung chuyển khoản phải chứa đúng mã trên để hệ thống tự xác nhận
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between px-4 py-2 rounded-lg" style={{ background: "var(--muted)" }}>
                          <span style={{ color: "var(--foreground-muted)" }}>Số tiền</span>
                          <span className="font-bold gradient-text">{courseQrData.amount.toLocaleString()} ₫</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button onClick={handleConfirmSentToParent} className="btn-primary w-full justify-center py-3">
                        <Send className="w-4 h-4" /> Gửi cho phụ huynh thanh toán
                      </button>
                      <p className="text-xs text-center" style={{ color: "var(--foreground-muted)" }}>
                        Hệ thống sẽ tự kích hoạt khóa học sau khi nhận được thanh toán
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: "#ef4444" }}>Không thể tạo mã QR. Vui lòng đóng và thử lại.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(16,185,129,0.15)" }}>
                  <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
                </div>
                <h2 className="text-xl font-extrabold mb-2">Đã gửi thành công!</h2>
                <p className="text-sm mb-2" style={{ color: "var(--foreground-muted)" }}>
                  Mã QR thanh toán đã được gửi đến phụ huynh.
                </p>
                <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                  Sau khi thanh toán, hệ thống sẽ tự xác nhận và kích hoạt khóa học.
                </p>
                <div className="flex items-center gap-2 justify-center mb-6 px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <Clock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                  <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>Đang chờ thanh toán & duyệt</span>
                </div>
                <button onClick={() => { setShowQR(false); setQrSent(false); }} className="btn-secondary w-full justify-center">
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
