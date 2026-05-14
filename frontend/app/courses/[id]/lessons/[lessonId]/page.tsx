"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-state";
import {
  Play, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Clock,
  MessageCircle, Send, List, X, Loader2, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

function AssignmentSubmit({ assignmentId, token, API, BASE_URL, onSuccess }: {
  assignmentId: string; token: string | null; API: string; BASE_URL: string; onSuccess?: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { const data = await res.json(); setImageUrl(data.url); toast.success("Đã tải ảnh!"); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.message || "Lỗi tải ảnh"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!imageUrl) { toast.error("Vui lòng chọn ảnh bài làm"); return; }
    try {
      const res = await fetch(`${API}/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileUrl: imageUrl, content: "Bài nộp bằng ảnh" }),
      });
      if (res.ok) {
        setSubmitted(true);
        toast.success("✅ Đã nộp bài! Giáo viên sẽ chấm điểm sớm.");
        onSuccess?.();
      } else { const d = await res.json(); toast.error(d.message || "Lỗi nộp bài"); }
    } catch { toast.error("Lỗi"); }
  };

  if (submitted) return (
    <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
      <CheckCircle2 className="w-4 h-4" /> Đã nộp bài! Chờ giáo viên chấm điểm.
    </div>
  );

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" ref={fileRef} className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])} />
      {imageUrl ? (
        <div className="relative">
          <img src={imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`}
            alt="Bài làm" className="max-w-full rounded-lg border" style={{ maxHeight: 300, borderColor: "var(--border)" }} />
          <button onClick={() => setImageUrl("")} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="btn-secondary w-full justify-center py-3">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {uploading ? "Đang tải..." : "Chọn ảnh bài làm (chụp bài hoặc ảnh giấy)"}
        </button>
      )}
      {imageUrl && (
        <button type="button" onClick={handleSubmit} className="btn-primary text-xs gap-1.5">
          <Send className="w-3 h-3" /> Nộp bài cho giáo viên
        </button>
      )}
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = API.replace("/api/v1", "");


function getYoutubeEmbedUrl(url: string): string | null {
  try {
    // Already an embed URL
    if (url.includes("/embed/")) return url;
    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = url.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    return null;
  } catch {
    return null;
  }
}

function isYoutubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export default function LessonPage() {
  const { id, lessonId } = useParams();
  const { user, token } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [canComplete, setCanComplete] = useState(true);
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
  const [videoWatched, setVideoWatched] = useState(true);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const lastSentPercent = useRef(0);
  const ytPlayerRef = useRef<any>(null);
  const ytIntervalRef = useRef<any>(null);
  const ytInitedRef = useRef<string | null>(null);
  // Use refs for tracking to avoid re-creating callbacks
  const watchedPctRef = useRef(0);
  const videoWatchedRef = useRef(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Keep refs in sync with state
  useEffect(() => { watchedPctRef.current = watchedPercentage; }, [watchedPercentage]);
  useEffect(() => { videoWatchedRef.current = videoWatched; }, [videoWatched]);

  // Stable YouTube progress tracking (uses refs, no deps)
  const trackYoutubeProgress = useCallback(() => {
    const player = ytPlayerRef.current;
    if (!player?.getDuration || !player?.getCurrentTime) return;
    const duration = player.getDuration();
    if (!duration || duration <= 0) return;
    const pct = Math.round((player.getCurrentTime() / duration) * 100);
    if (pct > watchedPctRef.current) {
      watchedPctRef.current = pct;
      setWatchedPercentage(pct);
    }
    if (pct >= 90 && !videoWatchedRef.current) {
      videoWatchedRef.current = true;
      setVideoWatched(true);
      checkCanComplete();
    }
    if (tokenRef.current && pct >= lastSentPercent.current + 10) {
      lastSentPercent.current = pct;
      fetch(`${API}/progress/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ lessonId, watchTime: Math.floor(player.getCurrentTime()), watchedPercentage: pct, completed: pct >= 95 }),
      }).then(() => checkCanComplete()).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!(window as any).YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  // Cleanup on lessonId change
  useEffect(() => {
    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} }
      ytPlayerRef.current = null;
      ytInitedRef.current = null;
    };
  }, [lessonId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [lessonId, id]);

  async function fetchData() {
    setLoading(true);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const [lessonR, courseR] = await Promise.all([
        fetch(`${API}/lessons/${lessonId}`, { headers }),
        fetch(`${API}/courses/${id}`, { headers }),
      ]);
      if (lessonR.ok) setLesson(await lessonR.json());
      if (courseR.ok) {
        const courseData = await courseR.json();
        setCourse(courseData);
        for (const sec of courseData.sections || []) {
          for (const les of sec.lessons || []) {
            if (les.id === lessonId) {
              if (les.materials?.length) setMaterials(les.materials);
              if (les.assignments?.length) setAssignments(les.assignments);
              break;
            }
          }
        }
      }
    } catch {} finally { setLoading(false); }
    fetchComments();
    fetchAssignmentsApi();
    checkCanComplete();
    if (token) {
      fetch(`${API}/progress/video/lesson/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  }

  async function checkCanComplete() {
    if (!token) return;
    try {
      // First sync video progress to server so it has latest data
      if (watchedPctRef.current > 0) {
        await fetch(`${API}/progress/video`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            lessonId,
            watchTime: 0,
            watchedPercentage: watchedPctRef.current,
            completed: watchedPctRef.current >= 95,
          }),
        }).catch(() => {});
      }
      const res = await fetch(`${API}/progress/lesson/${lessonId}/can-complete`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Backend returns: { canComplete, videoCompleted, assignmentsCompleted }
        // Trust backend state as source of truth
        const d = await res.json();
        setVideoWatched(d.videoCompleted);
        setHasAssignment(!d.assignmentsCompleted);
        setAssignmentSubmitted(d.assignmentsCompleted);
        setCanComplete(d.canComplete);
      }
    } catch {}
  }

  async function fetchComments() {
    try {
      const res = await fetch(`${API}/lessons/${lessonId}/comments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setComments(await res.json());
    } catch {}
  }

  async function fetchAssignmentsApi() {
    // Fallback: try fetching from API in case student is enrolled and has access
    try {
      const res = await fetch(`${API}/assignments?lessonId=${lessonId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setAssignments(data);
      }
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
    if (!canComplete) {
      if (!videoWatched) toast.error(`⚠️ Bạn cần xem ít nhất 90% video! (Hiện tại: ${watchedPercentage}%)`);
      else if (hasAssignment) toast.error("⚠️ Bạn cần nộp bài tập trước khi hoàn thành bài học!");
      return;
    }
    try {
      const res = await fetch(`${API}/progress/video`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lessonId, watchTime: 0, watchedPercentage, completed: true }),
      });
      if (res.ok) {
        toast.success("🎉 Hoàn thành bài học!");
        const allL = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
        const idx = allL.findIndex((l: any) => l.id === lessonId);
        if (idx < allL.length - 1) {
          window.location.href = `/courses/${id}/lessons/${allL[idx + 1].id}`;
        } else {
          toast.success("🏆 Chúc mừng! Bạn đã hoàn thành khóa học!");
          // Redirect to certificate page after a short delay
          setTimeout(() => {
            window.location.href = `/courses/${id}/certificate`;
          }, 1500);
        }
      } else {
        const d = await res.json();
        toast.error(d.message || "Lỗi cập nhật tiến độ");
      }
    } catch { toast.error("Lỗi kết nối"); }
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
        <div className="flex-1 overflow-y-auto" style={{ maxWidth: sidebarOpen ? 'calc(100% - 320px)' : '100%' }}>
          {/* Video player */}
          {lesson?.videoUrl ? (
            (() => {
              const embedUrl = isYoutubeUrl(lesson.videoUrl) ? getYoutubeEmbedUrl(lesson.videoUrl) : null;
              const ytVideoId = embedUrl?.split('/embed/')?.[1]?.split('?')?.[0];
              if (embedUrl && ytVideoId) {
                return (
                  <div className="aspect-video bg-black">
                    <div id={`yt-player-${lessonId}`} ref={(el) => {
                      if (!el || ytInitedRef.current === ytVideoId) return;
                      ytInitedRef.current = ytVideoId;
                      const initPlayer = () => {
                        if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} }
                        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                        ytPlayerRef.current = new (window as any).YT.Player(el, {
                          videoId: ytVideoId,
                          width: '100%', height: '100%',
                          playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
                          events: {
                            onStateChange: (e: any) => {
                              if (e.data === 1) {
                                if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                                ytIntervalRef.current = setInterval(trackYoutubeProgress, 3000);
                              } else {
                                if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                                trackYoutubeProgress();
                              }
                            },
                          },
                        });
                      };
                      if ((window as any).YT?.Player) { initPlayer(); }
                      else { (window as any).onYouTubeIframeAPIReady = initPlayer; }
                    }} className="w-full h-full" />
                  </div>
                );
              }
              // Local video file
              const videoSrc = lesson.videoUrl.startsWith("http") ? lesson.videoUrl : `${BASE_URL}${lesson.videoUrl}`;
              return (
                <div className="aspect-video bg-black relative">
                  <video
                    key={videoSrc}
                    src={videoSrc}
                    className="w-full h-full"
                    controls
                    controlsList="nodownload"
                    playsInline
                    onTimeUpdate={(e) => {
                      const video = e.target as HTMLVideoElement;
                      if (!video.duration) return;
                      const pct = Math.round((video.currentTime / video.duration) * 100);
                      const seconds = Math.floor(video.currentTime);
                      // Update local state
                      if (pct > watchedPercentage) setWatchedPercentage(pct);
                      if (pct >= 90 && !videoWatched) { setVideoWatched(true); checkCanComplete(); }
                      // Send to server every 10%
                      if (token && pct >= lastSentPercent.current + 10) {
                        lastSentPercent.current = pct;
                        fetch(`${API}/progress/video`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ lessonId, watchTime: seconds, watchedPercentage: pct, completed: pct >= 95 }),
                        }).then(() => checkCanComplete()).catch(() => {});
                      }
                    }}
                  />
                </div>
              );
            })()
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
            <div className="mb-8">
              {lesson?.section?.title && (
                <div className="section-tag mb-3 text-xs">
                  <BookOpen className="w-3.5 h-3.5" /> {lesson.section.title}
                </div>
              )}
              <h1 className="text-3xl font-extrabold mb-4">{lesson?.title || "Bài học"}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--foreground-muted)" }}>
                {lesson?.duration && (
                  <span className="flex items-center gap-1.5 badge" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                    <Clock className="w-3.5 h-3.5" /> {lesson.duration} phút
                  </span>
                )}
                <span className="flex items-center gap-1.5 badge" style={{ background: "rgba(8,145,178,0.1)", border: "1px solid rgba(8,145,178,0.2)", color: "#22d3ee" }}>
                  <Play className="w-3.5 h-3.5" /> Bài {currentIdx + 1}
                </span>
              </div>
            </div>

            <div className="gradient-line mb-8" />

            {lesson?.content && (
              <div className="card-base card-spotlight mb-8">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} /> Nội dung bài học
                </h3>
                <div className="text-base leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground)" }}>
                  {lesson.content}
                </div>
              </div>
            )}

            {/* Materials */}
            {materials.length > 0 && (
              <div className="card-base mb-8">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">📎 Tài liệu ({materials.length})</h3>
                <div className="space-y-2">
                  {materials.map((m: any) => {
                    const rawUrl = m.fileUrl || m.url || "";
                    const fileHref = rawUrl.startsWith("http") ? rawUrl : rawUrl ? `${BASE_URL}${rawUrl}` : "#";
                    const ext = rawUrl.split(".").pop()?.toUpperCase() || "FILE";
                    return (
                      <a key={m.id} href={fileHref} target="_blank" rel="noopener noreferrer" download
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--muted)]"
                        style={{ border: "1px solid var(--border)" }}>
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>{ext}</span>
                        <span className="text-sm font-medium flex-1">{m.title || m.name || "Tài liệu"}</span>
                        <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>Tải về</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Assignments */}
            {assignments.length > 0 && (
              <div className="card-base mb-8">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">📝 Bài tập ({assignments.length})</h3>
                <div className="space-y-3">
                  {assignments.map((a: any) => (
                    <div key={a.id} className="p-3 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--muted)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{a.title}</span>
                        <span className="badge text-[10px]" style={{ background: a.type === "quiz" ? "rgba(124,58,237,0.15)" : "rgba(245,158,11,0.15)" }}>
                          {a.type === "quiz" ? "Trắc nghiệm" : "Tự luận"}
                        </span>
                      </div>
                      {/* Show assignment image (đề bài) */}
                      {a.description && (a.description.startsWith("/uploads/") || a.description.startsWith("http")) ? (
                        <div className="mb-3">
                          <p className="text-xs mb-1 font-semibold" style={{ color: "var(--foreground-muted)" }}>📄 Đề bài:</p>
                          <img src={a.description.startsWith("http") ? a.description : `${BASE_URL}${a.description}`}
                            alt="Đề bài" className="max-w-full rounded-xl border" style={{ maxHeight: 400, borderColor: "var(--border)" }} />
                        </div>
                      ) : a.description ? (
                        <p className="text-xs mb-2" style={{ color: "var(--foreground-muted)" }}>{a.description}</p>
                      ) : null}
                      {(() => {
                        const mySub = a.submissions?.find((s: any) => s.studentId === user?.id);
                        const isGraded = mySub?.status === "graded";
                        const isSubmitted = !!mySub;

                        if (a.type === "quiz" && a.quizId) {
                          return <Link href={`/quiz/${a.quizId}`} className="btn-primary text-xs">Làm quiz</Link>;
                        }

                        return (
                          <div className="mt-2 space-y-3">
                            {/* Phiếu điểm - Score Card */}
                            {isGraded && (
                              <div id={`scorecard-${a.id}`} className="rounded-xl overflow-hidden" style={{ border: "2px solid rgba(16,185,129,0.4)", boxShadow: "0 4px 20px rgba(16,185,129,0.1)" }}>
                                <div className="px-4 py-2 flex items-center gap-2" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(8,145,178,0.1))" }}>
                                  <span className="text-sm">🏆</span>
                                  <span className="text-xs font-bold" style={{ color: "#10b981" }}>PHIẾU ĐIỂM</span>
                                </div>
                                <div className="p-4 space-y-3" style={{ background: "var(--muted)" }}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>Điểm số:</span>
                                    <span className="text-2xl font-extrabold" style={{ color: mySub.score >= (a.maxScore || 10) * 0.5 ? "#10b981" : "#ef4444" }}>
                                      {mySub.score}<span className="text-sm font-normal" style={{ color: "var(--foreground-muted)" }}>/{a.maxScore || 10}</span>
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="w-full h-2 rounded-full" style={{ background: "var(--border)" }}>
                                    <div className="h-full rounded-full transition-all" style={{
                                      width: `${Math.min(100, (mySub.score / (a.maxScore || 10)) * 100)}%`,
                                      background: mySub.score >= (a.maxScore || 10) * 0.5 ? "linear-gradient(to right, #10b981, #0891b2)" : "linear-gradient(to right, #ef4444, #f59e0b)"
                                    }} />
                                  </div>
                                  {mySub.feedback && (
                                    <div className="p-3 rounded-lg" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                                      <p className="text-[10px] font-bold mb-1" style={{ color: "var(--foreground-muted)" }}>💬 Nhận xét của giáo viên:</p>
                                      <p className="text-sm">{mySub.feedback}</p>
                                    </div>
                                  )}
                                  <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>
                                    Chấm lúc: {mySub.gradedAt ? new Date(mySub.gradedAt).toLocaleString("vi-VN") : "—"}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Show submitted but not yet graded */}
                            {isSubmitted && !isGraded && (
                              <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                                ⏳ Đã nộp bài — đang chờ giáo viên chấm điểm
                              </div>
                            )}

                            {/* Submit form if not submitted */}
                            {!isSubmitted && (
                              <>
                                <p className="text-xs mb-1 font-semibold" style={{ color: "var(--foreground-muted)" }}>Nộp bài (chụp ảnh bài làm):</p>
                                <AssignmentSubmit assignmentId={a.id} token={token} API={API} BASE_URL={BASE_URL} onSuccess={checkCanComplete} />
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            {/* Progress checklist */}
            <div className="card-base mb-8">
              <h3 className="font-bold text-base mb-4 flex items-center gap-2">📊 Tiến độ bài học</h3>
              <div className="space-y-2">
                {lesson?.videoUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: watchedPercentage >= 90 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: watchedPercentage >= 90 ? '#10b981' : 'var(--border)', color: '#fff' }}>
                      {watchedPercentage >= 90 ? '✓' : ''}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">Xem video ({watchedPercentage}% / 90%)</p>
                      <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, watchedPercentage)}%`, background: watchedPercentage >= 90 ? '#10b981' : '#f59e0b' }} />
                      </div>
                    </div>
                  </div>
                )}
                {hasAssignment && (
                  <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: assignmentSubmitted ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: assignmentSubmitted ? '#10b981' : 'var(--border)', color: '#fff' }}>
                      {assignmentSubmitted ? '✓' : ''}
                    </div>
                    <p className="text-xs font-medium">{assignmentSubmitted ? 'Đã nộp bài tập ✓' : 'Chưa nộp bài tập'}</p>
                  </div>
                )}
              </div>
            </div>
            {!canComplete && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
                ⚠️ {watchedPercentage < 90 && hasAssignment && !assignmentSubmitted
                  ? `Cần xem 90% video (${watchedPercentage}%) và nộp bài tập`
                  : watchedPercentage < 90
                    ? `Cần xem ít nhất 90% video (hiện tại: ${watchedPercentage}%)`
                    : 'Cần nộp bài tập'
                } trước khi hoàn thành
              </div>
            )}
            <div className="flex items-center justify-between mb-10">
              {prevLesson ? (
                <Link href={`/courses/${id}/lessons/${prevLesson.id}`} className="btn-secondary text-sm">
                  <ChevronLeft className="w-4 h-4" /> Bài trước
                </Link>
              ) : <div />}
              <button
                onClick={markComplete}
                disabled={!canComplete}
                className="btn-primary text-sm"
                style={!canComplete ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
                <CheckCircle2 className="w-4 h-4" />
                {!canComplete ? "🔒 Chưa đủ điều kiện" : "Hoàn thành & tiếp tục"}
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

        {/* Sidebar - always visible on desktop */}
        <div className="border-l overflow-y-auto flex-shrink-0 hidden md:block" style={{ width: sidebarOpen ? '320px' : '0px', background: "var(--card)", borderColor: "var(--border)", transition: 'width 0.3s' }}>
          {sidebarOpen && (
            <>
              <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="font-bold text-sm">📚 Nội dung khóa học</h3>
                <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" style={{ color: "var(--foreground-muted)" }} /></button>
              </div>
              <div className="p-2">
                {course?.sections?.sort((a: any, b: any) => a.order - b.order).map((sec: any, si: number) => (
                  <div key={sec.id} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase px-3 py-1.5" style={{ color: "var(--foreground-muted)" }}>Chương {si + 1}: {sec.title}</p>
                    {sec.lessons?.sort((a: any, b: any) => a.order - b.order).map((l: any, li: number) => {
                      const isCurrent = l.id === lessonId;
                      return (
                        <Link key={l.id} href={`/courses/${id}/lessons/${l.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs"
                          style={{
                            background: isCurrent ? "rgba(124,58,237,0.15)" : "transparent",
                            borderLeft: isCurrent ? "3px solid #7c3aed" : "3px solid transparent",
                          }}>
                          {isCurrent ? (
                            <Play className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#7c3aed" }} />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border flex-shrink-0" style={{ borderColor: "var(--border)" }} />
                          )}
                          <span className="font-medium truncate" style={{ color: isCurrent ? "var(--foreground)" : "var(--foreground-muted)" }}>{li + 1}. {l.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
