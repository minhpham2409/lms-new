"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-state";
import {
  Play, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Clock,
  MessageCircle, Send, List, X, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function LessonPage() {
  const { id, lessonId } = useParams();
  const { user, token } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { fetchData(); }, [lessonId, id]);

  async function fetchData() {
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [lessonR, courseR] = await Promise.all([
        fetch(`${API}/lessons/${lessonId}`, { headers }),
        fetch(`${API}/courses/${id}`, { headers }),
      ]);
      if (lessonR.ok) setLesson(await lessonR.json());
      if (courseR.ok) setCourse(await courseR.json());
    } catch {} finally { setLoading(false); }
    fetchComments();
    fetchMaterials();
    fetchAssignments();
    // Track video progress
    if (token) {
      fetch(`${API}/progress/video/lesson/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`${API}/lessons/${lessonId}/comments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setComments(await res.json());
    } catch {}
  }

  async function fetchMaterials() {
    try {
      const res = await fetch(`${API}/materials?lessonId=${lessonId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setMaterials(await res.json());
    } catch {}
  }

  async function fetchAssignments() {
    try {
      const res = await fetch(`${API}/assignments?lessonId=${lessonId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setAssignments(await res.json());
    } catch {}
  }

  async function postComment() {
    if (!comment.trim()) return;
    try {
      const res = await fetch(`${API}/lessons/${lessonId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (res.ok) { setComment(""); fetchComments(); toast.success("Đã gửi bình luận"); }
      else { const d = await res.json(); toast.error(d.message || "Lỗi gửi bình luận"); }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function postReply(commentId: string) {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    try {
      const res = await fetch(`${API}/lessons/${lessonId}/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) { setReplyText({ ...replyText, [commentId]: "" }); fetchComments(); toast.success("Đã trả lời"); }
    } catch { toast.error("Lỗi"); }
  }

  async function markComplete() {
    if (!token) { toast.error("Cần đăng nhập"); return; }
    try {
      // PUT /progress/video automatically recalculates enrollment progress
      const res = await fetch(`${API}/progress/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId, watchTime: 0, completed: true }),
      });
      if (res.ok) {
        toast.success("Đã hoàn thành bài học!");
        // Navigate to next lesson if available
        const allL = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
        const idx = allL.findIndex((l: any) => l.id === lessonId);
        if (idx < allL.length - 1) {
          window.location.href = `/courses/${id}/lessons/${allL[idx + 1].id}`;
        } else {
          toast.success("🎉 Bạn đã hoàn thành tất cả bài học!");
        }
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi cập nhật tiến độ");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function submitAssignment(assignmentId: string, content: string) {
    try {
      const res = await fetch(`${API}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      if (res.ok) toast.success("Đã nộp bài!");
      else { const d = await res.json(); toast.error(d.message || "Lỗi nộp bài"); }
    } catch { toast.error("Lỗi"); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
    </div>
  );

  // Find current lesson index for prev/next navigation
  const allLessons = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const initials = (user?.firstName?.charAt(0) || user?.username?.charAt(0) || "?").toUpperCase();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 glass-strong sticky top-0 z-40" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href={`/courses/${id}`} className="flex items-center gap-1 text-sm hover:text-[#a78bfa] transition-colors" style={{ color: "var(--foreground-muted)" }}>
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </Link>
          <div className="w-px h-5" style={{ background: "var(--border)" }} />
          <span className="text-sm font-medium truncate max-w-xs">{course?.title || ""}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--foreground-muted)" }}>Bài {currentIdx + 1}/{allLessons.length}</span>
          <div className="w-24 progress-bar">
            <div className="progress-fill" style={{ width: `${allLessons.length ? ((currentIdx + 1) / allLessons.length) * 100 : 0}%` }} />
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg transition-colors btn-ghost">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {/* Video player */}
          {lesson?.videoUrl ? (
            lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be") ? (
              <div className="aspect-video bg-black">
                <iframe
                  src={lesson.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                  className="w-full h-full" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-black relative">
                <video
                  src={`${lesson.videoUrl.startsWith("http") ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace("/api/v1", "")}${lesson.videoUrl}`}
                  className="w-full h-full"
                  controls
                  controlsList="nodownload"
                  playsInline
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    const seconds = Math.floor(video.currentTime);
                    // Track progress every 15 seconds
                    if (token && seconds > 0 && seconds % 15 === 0) {
                      fetch(`${API}/progress/video`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ lessonId, watchTime: seconds, completed: video.currentTime >= video.duration - 2 }),
                      }).catch(() => {});
                    }
                  }}
                />
              </div>
            )
          ) : (
            <div className="relative overflow-hidden" style={{ height: "200px", background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(8,145,178,0.06))" }}>
              <div className="absolute inset-0 dot-pattern opacity-30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <BookOpen className="w-8 h-8" style={{ color: "rgba(124,58,237,0.5)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>Bài học văn bản</p>
              </div>
            </div>
          )}

          {/* Lesson info */}
          <div className="max-w-4xl mx-auto px-6 py-8 page-enter">
            {/* Lesson header */}
            <div className="mb-6">
              {lesson?.section?.title && (
                <div className="section-tag mb-3 text-[10px]">
                  <BookOpen className="w-3 h-3" /> {lesson.section.title}
                </div>
              )}
              <h1 className="text-2xl font-extrabold mb-3">{lesson?.title || "Bài học"}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                {lesson?.duration && (
                  <span className="flex items-center gap-1.5 badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                    <Clock className="w-3 h-3" /> {lesson.duration} phút
                  </span>
                )}
                <span className="flex items-center gap-1.5 badge" style={{ background: "rgba(8,145,178,0.1)", border: "1px solid rgba(8,145,178,0.2)", color: "#22d3ee" }}>
                  <Play className="w-3 h-3" /> Bài {currentIdx + 1}
                </span>
              </div>
            </div>

            <div className="gradient-line mb-6" />

            {lesson?.content && (
              <div className="card-base card-spotlight mb-8">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} /> Nội dung bài học
                </h3>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground-muted)" }}>
                  {lesson.content}
                </div>
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <div className="card-base mb-6">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">📎 Tài liệu ({materials.length})</h3>
                <div className="space-y-2">
                  {materials.map((m: any) => (
                    <a key={m.id} href={m.fileUrl || m.url || "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--muted)]"
                      style={{ border: "1px solid var(--border)" }}>
                      <span className="text-sm font-medium flex-1">{m.title || m.name}</span>
                      <span className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>{m.type || "PDF"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Assignments */}
            {assignments.length > 0 && (
              <div className="card-base mb-6">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">📝 Bài tập ({assignments.length})</h3>
                <div className="space-y-3">
                  {assignments.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{a.title}</span>
                        <span className="badge text-[10px]" style={{ background: a.type === "quiz" ? "rgba(124,58,237,0.15)" : "rgba(245,158,11,0.15)" }}>
                          {a.type === "quiz" ? "Trắc nghiệm" : "Tự luận"}
                        </span>
                      </div>
                      {a.description && <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>{a.description}</p>}
                      {a.type === "quiz" && a.quizId ? (
                        <Link href={`/quiz/${a.quizId}`} className="btn-primary text-xs">Làm quiz</Link>
                      ) : (
                        <div className="mt-2">
                          <textarea placeholder="Nhập bài làm..." rows={2} className="input-base resize-none text-sm mb-2"
                            id={`assignment-${a.id}`} />
                          <button onClick={() => {
                            const el = document.getElementById(`assignment-${a.id}`) as HTMLTextAreaElement;
                            if (el) submitAssignment(a.id, el.value);
                          }} className="btn-primary text-xs">Nộp bài</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mb-10">
              {prevLesson ? (
                <Link href={`/courses/${id}/lessons/${prevLesson.id}`} className="btn-secondary text-sm">
                  <ChevronLeft className="w-4 h-4" /> Bài trước
                </Link>
              ) : <div />}
              <button onClick={markComplete} className="btn-primary text-sm">
                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & tiếp tục
              </button>
              {nextLesson ? (
                <Link href={`/courses/${id}/lessons/${nextLesson.id}`} className="btn-secondary text-sm">
                  Bài tiếp <ChevronRight className="w-4 h-4" />
                </Link>
              ) : <div />}
            </div>

            {/* Comments */}
            <div className="divider mb-6" />
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: "#7c3aed" }} /> Thảo luận ({comments.length})
            </h3>

            {token && (
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: "#7c3aed" }}>{initials}</div>
                <div className="flex-1 flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && postComment()} placeholder="Viết bình luận..." className="input-base text-sm flex-1" />
                  <button onClick={postComment} className="btn-primary px-3"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--foreground-muted)" }}>Chưa có bình luận nào</p>
              ) : comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: c.user?.role === "teacher" ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(124,58,237,0.4)" }}>
                    {(c.user?.firstName || c.user?.username || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{c.user?.firstName || c.user?.username}</span>
                      {c.user?.role === "teacher" && <span className="badge badge-primary text-[9px]">Giáo viên</span>}
                      <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{c.content}</p>
                    {/* Replies */}
                    {c.replies?.map((r: any) => (
                      <div key={r.id} className="flex gap-2 mt-3 ml-4 p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: r.user?.role === "teacher" ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(124,58,237,0.3)" }}>
                          {(r.user?.firstName || r.user?.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-semibold">{r.user?.firstName || r.user?.username}</span>
                          {r.user?.role === "teacher" && <span className="badge badge-primary text-[8px] ml-1">GV</span>}
                          <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{r.content}</p>
                        </div>
                      </div>
                    ))}
                    {/* Reply input */}
                    {token && (
                      <div className="flex gap-2 mt-2 ml-4">
                        <input value={replyText[c.id] || ""} onChange={e => setReplyText({ ...replyText, [c.id]: e.target.value })}
                          onKeyDown={e => e.key === "Enter" && postReply(c.id)}
                          placeholder="Trả lời..." className="input-base text-xs flex-1 py-1.5" />
                        <button onClick={() => postReply(c.id)} className="btn-ghost text-xs px-2 py-1"><Send className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l overflow-y-auto flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="font-bold text-sm">Danh sách bài</h3>
              <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} /></button>
            </div>
            <div className="p-2">
              {course?.sections?.sort((a: any, b: any) => a.order - b.order).map((sec: any) => (
                <div key={sec.id} className="mb-3">
                  <p className="text-[10px] font-semibold uppercase px-3 py-1" style={{ color: "var(--foreground-muted)" }}>{sec.title}</p>
                  {sec.lessons?.sort((a: any, b: any) => a.order - b.order).map((l: any) => (
                    <Link key={l.id} href={`/courses/${id}/lessons/${l.id}`}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                      style={{
                        background: l.id === lessonId ? "rgba(124,58,237,0.15)" : "transparent",
                        borderLeft: l.id === lessonId ? "3px solid #7c3aed" : "3px solid transparent",
                      }}>
                      {l.id === lessonId ? (
                        <Play className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: "var(--border)" }} />
                      )}
                      <span className="text-xs font-medium truncate" style={{ color: l.id === lessonId ? "var(--foreground)" : "var(--foreground-muted)" }}>{l.title}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
