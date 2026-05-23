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
  MessageCircle, ArrowLeft, Loader2, PlayCircle, QrCode, X, Send, AlertCircle, Laptop,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface CourseData {
  id: string; title: string; description: string; price: number; status: string;
  allowPlatformPromotions?: boolean;
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
  const [buyNowCoupon, setBuyNowCoupon] = useState("");
  const [buyNowCouponPreview, setBuyNowCouponPreview] = useState<any | null>(null);
  const [buyNowCouponLoading, setBuyNowCouponLoading] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (token && course) checkEnrollment();
    if (token && user?.role === "student") checkParentLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, course]);

  async function checkParentLink() {
    try {
      const res = await fetch(`${API}/parents/link-requests/incoming`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) { setHasParent(true); return; }
      }
      const profileRes = await fetch(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.childLinks?.length > 0 || profile.parentChild?.length > 0) {
          setHasParent(true); return;
        }
      }
      setHasParent(false);
    } catch { setHasParent(false); }
  }

  useEffect(() => {
    if (course) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (data.isEnrolled && data.enrollment) {
          setEnrolled(true);
          setEnrollProgress(data.enrollment.progress || 0);
          setEnrollStatus(data.enrollment.status || "active");
          return;
        }
        if (data.courseId) {
          setEnrolled(true);
          setEnrollProgress(data.progress || 0);
          setEnrollStatus(data.status || "active");
          return;
        }
      }
    } catch {}
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
    setShowQR(true);
    setSendingQR(true);
    setBuyNowCouponPreview(null);
    setCourseQrData(null);
    try {
      await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      }).catch(() => {});

      const orderRes = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buyNowCoupon.trim() ? { couponCode: buyNowCoupon.trim().toUpperCase() } : {}),
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

      const qrRes = await fetch(`${API}/payments/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (qrRes.ok) {
        const qr = await qrRes.json();
        await fetch(`${API}/enrollments/pending`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseId: id }),
        }).catch(() => null);
        setCourseQrData({ vietQrUrl: qr.vietQrUrl, txnRef: qr.txnRef, addInfo: qr.addInfo, amount: Number(qr.amount) });
      } else {
        toast.error("Không thể tạo mã QR");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSendingQR(false); }
  }

  async function previewBuyNowCoupon() {
    if (!buyNowCoupon.trim()) return;
    setBuyNowCouponLoading(true);
    setBuyNowCouponPreview(null);
    try {
      const addRes = await fetch(`${API}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      });
      if (!addRes.ok && addRes.status !== 409) {
        const data = await addRes.json().catch(() => ({}));
        toast.error(data.message || "Không thể kiểm tra mã giảm giá");
        return;
      }

      const res = await fetch(`${API}/cart/apply-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: buyNowCoupon.trim().toUpperCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setBuyNowCouponPreview(data);
        toast.success("Mã giảm giá hợp lệ");
      } else {
        toast.error(data.message || "Mã giảm giá không hợp lệ");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setBuyNowCouponLoading(false);
    }
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
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
  const avgRating = course.reviews?.length ? (course.reviews.reduce((s, r) => s + r.rating, 0) / course.reviews.length).toFixed(1) : "4.8";
  const firstLessonId = course.sections?.[0]?.lessons?.[0]?.id;
  const isPending = enrollStatus === "pending";
  const canAccess = enrolled && !isPending;
  const formatMoney = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      
      {/* ===== UDEMY STYLE HEADER (Dark Mode Background) ===== */}
      <section className="bg-[#f7f9fa] dark:bg-[#2d2f31] pt-24 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1d1f] to-transparent opacity-90 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 min-w-0">
            {/* Breadcrumb */}
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold mb-6 text-[#a1a7b3]">
              <Link href="/courses" className="hover:text-white transition-colors">Khóa học</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="truncate text-white">{course.title}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold mb-4 text-white break-words">{course.title}</h1>
            <p className="text-base sm:text-lg mb-6 max-w-2xl text-[#d1d7dc] break-words">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              <span className="flex items-center gap-1.5 text-yellow-500 font-bold">
                {avgRating} <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              </span>
              <span className="text-[#a1a7b3]">({course.reviews?.length || 124} đánh giá)</span>
              <span className="text-white font-medium">{course._count?.enrollments || 0} học sinh</span>
            </div>

            <div className="text-sm text-[#d1d7dc]">
               Được tạo bởi <span className="text-[#a78bfa] underline cursor-pointer">{authorName}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[#d1d7dc]">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Cập nhật lần cuối 11/2026</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Tiếng Việt</span>
            </div>
          </div>
          
          {/* Mobile Video Placeholder */}
          <div className="block lg:hidden mt-6 mb-2">
             <div className="rounded-xl overflow-hidden relative border border-gray-700 bg-black aspect-video">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors">
                       <Play className="w-8 h-8 text-white ml-1" />
                    </button>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* Mobile purchase / learning actions */}
      <section className="block lg:hidden border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            {isPending ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xl font-extrabold">{course.price > 0 ? formatMoney(course.price) : "Miễn phí"}</p>
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-500">Chờ thanh toán</span>
                </div>
                <Link href="/dashboard" className="btn-secondary w-full justify-center">Đi tới Dashboard</Link>
              </>
            ) : canAccess ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-bold text-green-500"><CheckCircle2 className="h-4 w-4" /> Đã đăng ký</p>
                  <span className="text-sm font-bold text-primary">{enrollProgress}%</span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${enrollProgress}%` }} />
                </div>
                <Link href={`/courses/${id}/lessons/${firstLessonId}`} className="btn-primary w-full justify-center">Tiếp tục học</Link>
              </>
            ) : (
              <>
                <p className="mb-4 text-2xl font-extrabold">{course.price > 0 ? formatMoney(course.price) : "Miễn phí"}</p>
                {course.price > 0 && hasParent !== true && user?.role === "student" && (
                  <p className="mb-3 text-xs text-yellow-500">Cần liên kết phụ huynh để mua khóa học.</p>
                )}
                <div className="space-y-2">
                  <button onClick={course.price > 0 ? handleAddToCart : handleEnrollFree} disabled={actionLoading} className="btn-primary w-full justify-center">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (course.price > 0 ? "Thêm vào giỏ" : "Đăng ký miễn phí")}
                  </button>
                  {course.price > 0 && (
                    <>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          value={buyNowCoupon}
                          onChange={(e) => {
                            setBuyNowCoupon(e.target.value.toUpperCase());
                            setBuyNowCouponPreview(null);
                          }}
                          placeholder="Mã giảm giá"
                          disabled={course.allowPlatformPromotions === false}
                          className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
                        />
                        <button
                          onClick={previewBuyNowCoupon}
                          disabled={buyNowCouponLoading || !buyNowCoupon.trim() || course.allowPlatformPromotions === false}
                          className="rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
                        >
                          {buyNowCouponLoading ? "..." : "Áp dụng"}
                        </button>
                      </div>
                      <button onClick={handleBuyNow} disabled={actionLoading} className="btn-secondary w-full justify-center">Mua ngay</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Left Content */}
            <div className="lg:col-span-2 min-w-0">
              
              {/* What you'll learn - Udemy style box */}
              <div className="border border-border p-6 rounded-lg bg-card mb-10">
                <h2 className="text-2xl font-bold mb-6">Bạn sẽ học được gì</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {["Nắm vững kiến thức cơ bản một cách hệ thống", "Giải nhanh các dạng bài tập phức tạp", "Tư duy logic, nền tảng cho lớp học cao hơn", "Chuẩn bị tốt nhất cho kỳ thi quan trọng", "Phương pháp tự học hiệu quả tại nhà", "Ứng dụng kiến thức vào thực tế cuộc sống"].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-foreground" />
                      <span className="text-sm text-foreground-muted">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <h2 className="text-2xl font-bold mb-6">Nội dung khóa học</h2>
              <div className="flex flex-col gap-2 text-sm text-foreground-muted mb-4 sm:flex-row sm:items-center sm:justify-between">
                 <span>{course.sections?.length || 0} chương • {totalLessons} bài học</span>
                 <button className="text-primary hover:text-primary/80 font-bold" onClick={() => setOpenSections(course.sections.map(s => s.id))}>Mở rộng tất cả</button>
              </div>

              <div className="border border-border rounded-lg bg-card mb-10 overflow-hidden">
                {course.sections?.sort((a, b) => a.order - b.order).map((sec, i) => (
                  <div key={sec.id} className={`${i !== 0 ? 'border-t border-border' : ''}`}>
                    <button 
                      onClick={() => toggleSection(sec.id)} 
                      className="w-full flex items-start justify-between gap-3 p-4 text-left hover:bg-muted/50 transition-colors bg-background"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openSections.includes(sec.id) ? "rotate-180" : ""}`} />
                        <span className="font-bold break-words">{sec.title}</span>
                      </div>
                      <span className="shrink-0 text-sm text-foreground-muted">{sec.lessons?.length || 0} bài</span>
                    </button>
                    {openSections.includes(sec.id) && (
                      <div className="bg-card">
                        {sec.lessons?.sort((a, b) => a.order - b.order).map((lesson, li) => (
                          <div key={lesson.id} className="flex items-start gap-3 px-4 py-3 border-t border-border/50 hover:bg-muted/30 sm:px-6">
                            {canAccess ? (
                              <Link href={`/courses/${id}/lessons/${lesson.id}`} className="flex min-w-0 flex-1 items-start gap-3">
                                <PlayCircle className="w-4 h-4 shrink-0 text-foreground" />
                                <span className="text-sm text-foreground-muted hover:text-primary transition-colors break-words">{lesson.title}</span>
                              </Link>
                            ) : (
                              <div className="flex min-w-0 flex-1 items-start gap-3">
                                {li === 0 && sec.order === 1 ? (
                                  <PlayCircle className="w-4 h-4 shrink-0 text-primary" />
                                ) : (
                                  <Lock className="w-4 h-4 shrink-0 text-foreground-muted" />
                                )}
                                <span className="text-sm text-foreground-muted break-words">{lesson.title}</span>
                                {li === 0 && sec.order === 1 && <span className="ml-2 text-xs text-primary font-bold">Xem trước</span>}
                              </div>
                            )}
                            {lesson.duration && <span className="shrink-0 text-sm text-foreground-muted">{Math.round(lesson.duration / 60)}:00</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Requirements */}
              <h2 className="text-2xl font-bold mb-4">Yêu cầu</h2>
              <ul className="list-disc pl-5 mb-10 text-sm text-foreground-muted space-y-2">
                 <li>Máy tính hoặc điện thoại có kết nối Internet.</li>
                 <li>Tinh thần học hỏi và sẵn sàng hoàn thành bài tập đầy đủ.</li>
                 <li>Không yêu cầu kiến thức nâng cao từ trước.</li>
              </ul>

              {/* Instructor */}
              <h2 className="text-2xl font-bold mb-4">Giáo viên</h2>
              <div className="mb-10">
                 <Link href={`/teachers`} className="text-xl font-bold text-primary underline">{authorName}</Link>
                 <p className="text-sm text-foreground-muted mb-4">Chuyên gia Giáo dục</p>
                 <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:gap-6">
                    <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #a435f0, #0891b2)" }}>
                      {authorName.charAt(0)}
                    </div>
                    <div className="space-y-2 text-sm text-foreground-muted">
                       <p className="flex items-center gap-2"><Star className="w-4 h-4 fill-yellow-500 text-yellow-500" /> 4.8 Xếp hạng</p>
                       <p className="flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> 1,230 Đánh giá</p>
                       <p className="flex items-center gap-2"><Users className="w-4 h-4 text-cyan-500" /> 15,400 Học sinh</p>
                       <p className="flex items-center gap-2"><PlayCircle className="w-4 h-4 text-red-500" /> 5 Khóa học</p>
                    </div>
                 </div>
                 <p className="text-sm text-foreground-muted">Giáo viên với nhiều năm kinh nghiệm luyện thi, giúp hàng ngàn học sinh đỗ đạt điểm cao. Phương pháp giảng dạy trực quan, sinh động, truyền cảm hứng học tập mạnh mẽ.</p>
              </div>

              {/* Reviews section */}
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                 <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" /> {avgRating} xếp hạng khóa học
              </h2>

              {canAccess && user?.role === "student" && (
                <div className="border border-border p-6 rounded-lg mb-8 bg-card">
                  <h3 className="font-bold mb-3">Viết đánh giá của bạn</h3>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} onClick={() => setReviewRating(s)}>
                        <Star className="w-6 h-6" style={{ color: s <= reviewRating ? "#f59e0b" : "var(--border)", fill: s <= reviewRating ? "#f59e0b" : "none" }} />
                      </button>
                    ))}
                  </div>
                  <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Chia sẻ trải nghiệm học tập của bạn..." rows={3} className="w-full bg-background border border-border rounded-md p-3 mb-4 focus:ring-1 focus:ring-primary focus:outline-none" />
                  <button onClick={submitReview} disabled={reviewSubmitting} className="btn-primary text-sm px-6 py-2">
                    {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : "Gửi đánh giá"}
                  </button>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                {reviews.length === 0 ? (
                  <p className="text-sm text-foreground-muted col-span-2">Chưa có đánh giá nào.</p>
                ) : (
                  reviews.map((r: any) => (
                    <div key={r.id} className="border-t border-border pt-6">
                      <div className="flex items-center gap-4 mb-3">
                         <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg text-primary shrink-0">
                           {(r.user?.firstName || r.user?.username || "?").charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-bold text-sm">{r.user?.firstName || r.user?.username}</p>
                            <div className="flex items-center gap-2">
                               <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, j) => <Star key={j} className="w-3 h-3" style={{ color: j < r.rating ? "#f59e0b" : "var(--border)", fill: j < r.rating ? "#f59e0b" : "none" }} />)}</div>
                               <span className="text-xs text-foreground-muted">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                         </div>
                      </div>
                      <p className="text-sm text-foreground-muted">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Udemy Floating Card */}
            <div className="hidden lg:block relative">
              <div className="bg-card border border-border shadow-xl rounded-lg overflow-hidden absolute top-[-300px] w-full z-20">
                 
                 {/* Video Preview */}
                 <div className="aspect-video bg-black relative border-b border-border group cursor-pointer">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                       <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
                          <Play className="w-8 h-8 text-white ml-1" />
                       </div>
                       <span className="text-white font-bold text-sm">Xem trước khóa học</span>
                    </div>
                 </div>

                 {/* Purchase Actions */}
                 <div className="p-6">
                    {isPending ? (
                      <>
                        <p className="text-3xl font-bold mb-4">{course.price > 0 ? formatMoney(course.price) : "Miễn phí"}</p>
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4 text-center">
                           <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                           <p className="font-bold text-yellow-500 text-sm">Đang chờ duyệt thanh toán</p>
                        </div>
                        <Link href="/dashboard" className="w-full block text-center border border-border font-bold py-3 hover:bg-muted transition-colors rounded-none mb-4">Đi tới Dashboard</Link>
                      </>
                    ) : canAccess ? (
                      <>
                        <p className="text-sm text-green-500 font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Đã đăng ký</p>
                        <div className="mb-4">
                           <div className="flex justify-between text-sm mb-1 text-foreground-muted"><span>Tiến độ</span> <span className="text-primary font-bold">{enrollProgress}%</span></div>
                           <div className="w-full bg-muted h-2 rounded-full overflow-hidden"><div className="bg-primary h-full" style={{ width: `${enrollProgress}%`}}/></div>
                        </div>
                        <Link href={`/courses/${id}/lessons/${firstLessonId}`} className="w-full block text-center bg-primary text-white font-bold py-4 hover:bg-primary/90 transition-colors rounded-none mb-4">Tiếp tục học</Link>
                      </>
                    ) : (
                      <>
                        <p className="text-4xl font-extrabold mb-4">{course.price > 0 ? formatMoney(course.price) : "Miễn phí"}</p>
                        
                        {course.price > 0 && hasParent !== true && user?.role === "student" && (
                          <p className="text-xs text-yellow-500 mb-4">Cần liên kết phụ huynh để mua khóa học.</p>
                        )}

                        <div className="space-y-2 mb-4">
                           <button onClick={course.price > 0 ? handleAddToCart : handleEnrollFree} disabled={actionLoading} className="w-full bg-primary text-white font-bold py-3.5 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center">
                              {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (course.price > 0 ? "Thêm vào giỏ" : "Đăng ký miễn phí")}
                           </button>
                           {course.price > 0 && (
                             <div className="flex gap-2">
                               <input
                                 value={buyNowCoupon}
                                 onChange={(e) => {
                                   setBuyNowCoupon(e.target.value.toUpperCase());
                                   setBuyNowCouponPreview(null);
                                 }}
                                 placeholder="Mã giảm giá"
                                 disabled={course.allowPlatformPromotions === false}
                                 className="flex-1 px-3 py-2 border border-border bg-background text-sm outline-none focus:border-primary disabled:opacity-60"
                               />
                               <button
                                 onClick={previewBuyNowCoupon}
                                 disabled={buyNowCouponLoading || !buyNowCoupon.trim() || course.allowPlatformPromotions === false}
                                 className="px-3 py-2 border border-border text-xs font-bold hover:bg-muted disabled:opacity-50 whitespace-nowrap shrink-0"
                               >
                                 {buyNowCouponLoading ? "..." : "Áp dụng"}
                               </button>
                             </div>
                           )}
                           {course.price > 0 && course.allowPlatformPromotions === false && (
                             <p className="text-[11px] text-yellow-500">Khóa học này không áp dụng mã giảm giá.</p>
                           )}
                           {buyNowCouponPreview && (
                             <p className="text-[11px] text-emerald-500">
                               Đã áp dụng {buyNowCouponPreview.code}: giảm {Number(buyNowCouponPreview.savings || 0).toLocaleString("vi-VN")} ₫
                             </p>
                           )}
                           {course.price > 0 && (
                             <button onClick={handleBuyNow} disabled={actionLoading} className="w-full border border-border font-bold py-3 hover:bg-muted transition-colors disabled:opacity-50">
                               Mua ngay
                             </button>
                           )}
                        </div>
                        <p className="text-xs text-center text-foreground-muted mb-6">Đảm bảo hoàn tiền trong 30 ngày</p>
                      </>
                    )}

                    {/* Includes */}
                    <div>
                       <p className="font-bold mb-2">Khóa học này bao gồm:</p>
                       <ul className="text-sm text-foreground-muted space-y-2">
                          <li className="flex items-center gap-3"><PlayCircle className="w-4 h-4" /> 20 giờ video bài giảng</li>
                          <li className="flex items-center gap-3"><BookOpen className="w-4 h-4" /> {totalLessons} bài tập thực hành</li>
                          <li className="flex items-center gap-3"><Laptop className="w-4 h-4" /> Truy cập trên điện thoại & máy tính</li>
                          <li className="flex items-center gap-3"><Award className="w-4 h-4" /> Chứng chỉ hoàn thành</li>
                       </ul>
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* QR Payment Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="card-base w-full max-w-md animate-scale-in" style={{ background: "var(--popover)" }}>
            {!qrSent ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    <QrCode className="w-5 h-5" style={{ color: "#5624d0" }} /> Thanh toán
                  </h2>
                  <button onClick={() => setShowQR(false)} className="btn-ghost px-2 py-2"><X className="w-5 h-5" /></button>
                </div>

                {sendingQR ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#5624d0" }} />
                    <p className="text-sm font-semibold">Đang tạo đơn hàng & mã QR...</p>
                  </div>
                ) : courseQrData ? (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-sm font-semibold mb-4">{course.title}</p>
                      <div className="w-56 h-56 mx-auto rounded-xl flex items-center justify-center mb-4 bg-white border border-border">
                        <img src={courseQrData.vietQrUrl} alt="VietQR Payment" className="w-52 h-52 object-contain" />
                      </div>
                      <p className="text-xs mb-1 font-mono px-3 py-2 rounded-lg inline-block bg-muted">
                        Nội dung CK: <span className="font-bold">{courseQrData.addInfo}</span>
                      </p>
                      <div className="mt-4 flex justify-between px-4 py-3 rounded-lg bg-muted text-sm">
                        <span className="text-foreground-muted">Số tiền</span>
                        <span className="font-bold gradient-text">{formatMoney(courseQrData.amount)}</span>
                      </div>
                    </div>
                    <button onClick={handleConfirmSentToParent} className="btn-primary w-full justify-center py-3">
                      Gửi cho phụ huynh thanh toán
                    </button>
                  </>
                ) : (
                  <p className="text-center text-red-500 py-4">Lỗi tạo QR.</p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Đã gửi mã QR</h2>
                <p className="text-sm text-foreground-muted mb-6">Phụ huynh thanh toán xong hệ thống sẽ duyệt tự động.</p>
                <button onClick={() => { setShowQR(false); setQrSent(false); }} className="btn-secondary w-full">Đóng</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
