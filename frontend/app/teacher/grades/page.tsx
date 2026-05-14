"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/auth-state";
import { Navbar } from "@/components/layout/navbar";
import { toast } from "sonner";
import { CheckCircle2, BookOpen, Loader2, Star, ChevronDown, ChevronUp, ArrowLeft, Bell } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = API.replace("/api/v1", "");

function imgUrl(url: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

interface CourseGroup {
  courseId: string;
  courseTitle: string;
  submissions: any[];
}

export default function TeacherGradesPage() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => { if (token) fetchSubmissions(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/assignments/teacher/all-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSubmissions(await res.json());
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  async function gradeSubmission(submissionId: string, maxScore: number) {
    const g = grading[submissionId];
    const score = parseFloat(g?.score ?? "");
    if (isNaN(score) || score < 0 || score > maxScore) {
      toast.error(`Điểm phải từ 0 đến ${maxScore}`);
      return;
    }
    setSubmitting(submissionId);
    try {
      const res = await fetch(`${API}/assignments/submissions/${submissionId}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score, feedback: g?.feedback || "" }),
      });
      if (res.ok) {
        toast.success("✅ Đã chấm điểm & gửi thông báo!");
        // Remove graded submission from list immediately
        setSubmissions(prev => prev.filter(s => s.id !== submissionId));
        setExpanded(null);
        setGrading(prev => { const n = { ...prev }; delete n[submissionId]; return n; });
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi chấm điểm");
      }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSubmitting(null); }
  }

  // Only show ungraded submissions
  const pending = submissions.filter(s => s.status !== "graded");

  // Group by course
  const courseGroups: CourseGroup[] = [];
  const courseMap = new Map<string, CourseGroup>();
  for (const sub of pending) {
    const courseId = sub.assignment?.lesson?.section?.course?.id || "unknown";
    const courseTitle = sub.assignment?.lesson?.section?.course?.title || "Không rõ khóa học";
    if (!courseMap.has(courseId)) {
      const group = { courseId, courseTitle, submissions: [] };
      courseMap.set(courseId, group);
      courseGroups.push(group);
    }
    courseMap.get(courseId)!.submissions.push(sub);
  }

  const activeCourse = selectedCourse ? courseMap.get(selectedCourse) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link href="/teacher" className="btn-ghost px-2 py-2"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="text-2xl font-extrabold">📝 Chấm bài tập</h1>
        </div>
        <p className="text-sm mb-8 ml-11" style={{ color: "var(--foreground-muted)" }}>
          Chọn khóa học để xem và chấm bài nộp của học sinh
        </p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} /></div>
        ) : !selectedCourse ? (
          /* ===== COURSE LIST ===== */
          <>
            {courseGroups.length === 0 ? (
              <div className="card-base text-center py-16">
                <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: "#10b981", opacity: 0.4 }} />
                <h3 className="font-bold text-lg mb-1">Không có bài nào cần chấm</h3>
                <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Tất cả bài nộp đã được chấm điểm 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>
                  {courseGroups.length} khóa học có bài chờ chấm · Tổng {pending.length} bài
                </p>
                {courseGroups.map(group => (
                  <button key={group.courseId}
                    onClick={() => setSelectedCourse(group.courseId)}
                    className="card-base card-hover w-full text-left flex items-center gap-4 transition-all"
                    style={{ borderLeft: "3px solid #7c3aed" }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(124,58,237,0.12)" }}>
                      <BookOpen className="w-6 h-6" style={{ color: "#7c3aed" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{group.courseTitle}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>
                        {group.submissions.length} bài chờ chấm
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                        <Bell className="w-3 h-3" /> {group.submissions.length}
                      </span>
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* ===== SUBMISSIONS FOR SELECTED COURSE ===== */
          <>
            <button onClick={() => { setSelectedCourse(null); setExpanded(null); }}
              className="btn-secondary text-sm mb-6 gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} />
                {activeCourse?.courseTitle || "Khóa học"}
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>
                {activeCourse?.submissions.length || 0} bài chờ chấm điểm
              </p>
            </div>

            {(!activeCourse || activeCourse.submissions.length === 0) ? (
              <div className="card-base text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#10b981", opacity: 0.4 }} />
                <p className="font-semibold">Đã chấm hết bài của khóa này! 🎉</p>
                <button onClick={() => setSelectedCourse(null)} className="btn-secondary text-sm mt-4">
                  Quay lại
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCourse.submissions.map((sub: any) => {
                  const isOpen = expanded === sub.id;
                  const g = grading[sub.id] || { score: "", feedback: "" };
                  const name = sub.student?.firstName
                    ? `${sub.student.firstName} ${sub.student.lastName || ""}`.trim()
                    : sub.student?.username || "Học sinh";
                  const aTitle = sub.assignment?.title || "Bài tập";
                  const lTitle = sub.assignment?.lesson?.title || "";
                  const maxScore = sub.assignment?.maxScore || 10;
                  const descUrl = sub.assignment?.description;

                  return (
                    <div key={sub.id} className="card-base overflow-hidden">
                      {/* Row header */}
                      <div className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : sub.id)}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                                ⏳ Chờ chấm
                              </span>
                            </div>
                            <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>
                              {aTitle} {lTitle ? `· ${lTitle}` : ""}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                              Nộp: {new Date(sub.createdAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                      </div>

                      {/* Detail panel */}
                      {isOpen && (
                        <div className="mt-4 pt-4 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                          {/* Assignment image */}
                          {descUrl && (descUrl.startsWith("/uploads") || descUrl.startsWith("http")) && (
                            <div>
                              <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>📄 Đề bài:</p>
                              <div className="relative w-full max-w-lg h-64 border border-white/10 rounded-xl overflow-hidden">
                                <Image src={imgUrl(descUrl)} alt="Đề" fill className="object-contain" />
                              </div>
                            </div>
                          )}
                          {/* Student work */}
                          {sub.fileUrl && (
                            <div>
                              <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground-muted)" }}>🖼️ Bài làm:</p>
                              <div className="relative w-full max-w-lg h-80 border border-white/10 rounded-xl overflow-hidden">
                                <Image src={imgUrl(sub.fileUrl)} alt="Bài làm" fill className="object-contain" />
                              </div>
                            </div>
                          )}
                          {sub.content && sub.content !== "Bài nộp bằng ảnh" && (
                            <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                              <p className="text-xs font-semibold mb-1">Nội dung:</p>
                              <p className="text-sm">{sub.content}</p>
                            </div>
                          )}

                          {/* Grading form */}
                          <div className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                            <p className="text-sm font-bold mb-3 flex items-center gap-2">
                              <Star className="w-4 h-4" style={{ color: "#f59e0b" }} /> Chấm điểm (tối đa {maxScore})
                            </p>
                            <div className="flex gap-3 mb-3">
                              <input type="number" min={0} max={maxScore} step={0.5}
                                value={g.score}
                                onChange={e => setGrading(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], score: e.target.value } }))}
                                placeholder={`0 – ${maxScore}`}
                                className="input-base w-32 text-center text-lg font-bold" />
                              <span className="text-sm self-center" style={{ color: "var(--foreground-muted)" }}>/ {maxScore} điểm</span>
                            </div>
                            <textarea
                              value={g.feedback}
                              onChange={e => setGrading(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], feedback: e.target.value } }))}
                              placeholder="Nhận xét cho học sinh..."
                              rows={2} className="input-base w-full resize-none text-sm mb-3" />
                            <button
                              onClick={() => gradeSubmission(sub.id, maxScore)}
                              disabled={submitting === sub.id || !g.score}
                              className="btn-primary gap-2">
                              {submitting === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              Chấm điểm & Gửi thông báo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
