"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-state";
import { getAccessToken, lessonsApi, coursesApi, commentsApi, assignmentsApi, progressApi } from "@/lib/api-service";
import api from "@/lib/api-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Clock,
  MessageCircle, Send, List, X, Loader2, Image as ImageIcon,
  FileText, PenTool, Maximize2, Minimize2, Download, PlayCircle, FileQuestion, XCircle, Award, Lock, LogIn
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
    <div className="flex items-center gap-2 p-3 rounded text-sm bg-green-500/10 text-green-500 border border-green-500/20 font-bold">
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
            alt="Bài làm" className="max-w-full rounded border border-border" style={{ maxHeight: 300 }} />
          <button onClick={() => setImageUrl("")} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full py-3 border border-border font-bold text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {uploading ? "Đang tải..." : "Chọn ảnh bài làm (chụp bài hoặc ảnh giấy)"}
        </button>
      )}
      {imageUrl && (
        <button type="button" onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary/90 flex items-center gap-2 text-sm">
          <Send className="w-3 h-3" /> Nộp bài cho giáo viên
        </button>
      )}
    </div>
  );
}

function InlineQuiz({ quizId, token, onPassed }: { quizId: string; token: string | null; onPassed?: () => void }) {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const onPassedRef = useRef(onPassed);
  const passedNotifiedRef = useRef(false);

  useEffect(() => {
    onPassedRef.current = onPassed;
  }, [onPassed]);

  const notifyPassedOnce = useCallback(() => {
    if (passedNotifiedRef.current) return;
    passedNotifiedRef.current = true;
    onPassedRef.current?.();
  }, []);

  useEffect(() => {
    if (!token || !quizId) return;
    let active = true;
    async function loadQuiz() {
      setLoading(true);
      try {
        const quizRes = await fetch(`${API}/quizzes/${quizId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!active) return;
        if (quizRes.ok) {
          const raw = await quizRes.json();
          const data = raw?.data || raw;
          const quizQuestions = Array.isArray(data?.questions) ? data.questions : [];
          setQuiz(data);
          setQuestions(quizQuestions.map((question: any) => {
            let options: any[] = [];
            try {
              const raw = typeof question.options === "string" ? JSON.parse(question.options) : question.options;
              options = Array.isArray(raw)
                ? raw.map((option: any) => typeof option === "string" ? { id: option, text: option } : option)
                : [];
            } catch {}
            return { ...question, options };
          }));
        }

        const resultRes = await fetch(`${API}/quizzes/${quizId}/result`, { headers: { Authorization: `Bearer ${token}` } });
        if (resultRes.ok) {
          const raw = await resultRes.json();
          const data = raw?.data || raw;
          setResult(data);
          if (Number(data.percentage || 0) >= 80) notifyPassedOnce();
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadQuiz();
    return () => { active = false; };
  }, [quizId, token, notifyPassedOnce]);

  async function submitQuiz() {
    const formattedAnswers = Object.entries(answers).map(([questionId, answerId]) => ({ questionId, answerId }));
    if (formattedAnswers.length !== questions.length) {
      toast.error("Vui lòng trả lời đầy đủ các câu hỏi");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Lỗi nộp quiz");
      }
      const data = await res.json();
      const normalized = { ...data, percentage: data.maxScore > 0 ? (data.score / data.maxScore) * 100 : 0 };
      setResult(normalized);
      if (normalized.percentage >= 80) notifyPassedOnce();
      toast.success(`Đã nộp quiz: ${Math.round(normalized.percentage)}%`);
    } catch (error: any) {
      toast.error(error.message || "Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-foreground-muted"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải quiz...</div>;

  if (questions.length === 0) {
    return (
      <div className="p-5 border border-yellow-500/30 rounded-lg bg-yellow-500/10 text-yellow-200">
        <p className="font-bold">Quiz chưa có câu hỏi</p>
        <p className="text-sm mt-1">Giáo viên cần mở trang quản lý quiz của bài học này và lưu lại câu hỏi. Sau khi lưu, tải lại trang học sinh.</p>
      </div>
    );
  }

  if (result) {
    const passed = Number(result.percentage || 0) >= 80;
    return (
      <div className="p-5 border border-border rounded-lg bg-card">
        <div className="flex items-center gap-3 mb-4">
          {passed ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
          <div>
            <p className="font-bold">{passed ? "Quiz đã đạt yêu cầu" : "Quiz chưa đạt yêu cầu"}</p>
            <p className="text-sm text-foreground-muted">Kết quả: {Math.round(result.percentage || 0)}% ({result.score}/{result.maxScore} điểm). Yêu cầu tối thiểu 80%.</p>
          </div>
        </div>
        {!passed && (
          <button type="button" onClick={() => { setResult(null); setAnswers({}); }} className="btn-primary">
            Làm lại quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="p-5 border border-border rounded-lg bg-card">
        <h3 className="font-bold">{quiz?.assignment?.title || "Quiz bài học"}</h3>
        <p className="text-sm text-foreground-muted mt-1">Cần đạt tối thiểu 80% để chuyển sang bài học tiếp theo.</p>
      </div>
      {questions.map((question, index) => (
        <div key={question.id} className="p-5 border border-border rounded-lg bg-card">
          <p className="font-semibold mb-3">Câu {index + 1}: {question.content}</p>
          {question.imageUrl && <img src={question.imageUrl.startsWith("http") ? question.imageUrl : `${BASE_URL}${question.imageUrl}`} alt={`Câu ${index + 1}`} className="max-h-56 rounded border border-border mb-3" />}
          <div className="space-y-2">
            {question.options.map((option: any) => {
              const selected = answers[question.id] === option.id;
              return (
                <button key={option.id} type="button" onClick={() => setAnswers({ ...answers, [question.id]: option.id })} className="w-full text-left px-4 py-3 rounded border transition-colors" style={{ borderColor: selected ? "#a435f0" : "var(--border)", background: selected ? "rgba(164,53,240,0.1)" : "var(--muted)" }}>
                  {option.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={submitQuiz} disabled={submitting} className="btn-primary">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Nộp quiz
      </button>
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const BASE_URL = API.replace("/api/v1", "");

function getYoutubeEmbedUrl(url: string): string | null {
  try {
    if (url.includes("/embed/")) return url;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
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
  const router = useRouter();
  const { user, token, login, loading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [canComplete, setCanComplete] = useState(true);
  const [videoWatched, setVideoWatched] = useState(true);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [resumeWatchTime, setResumeWatchTime] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<Record<string, { completed: boolean; watchTime: number; watchedPercentage: number }>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  const lastSentPercent = useRef(0);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<any>(null);
  const canCompleteRequestRef = useRef(false);
  const canCompleteQueuedRef = useRef(false);
  const completionProgressSavedRef = useRef(false);
  const ytPlayerRef = useRef<any>(null);
  const ytIntervalRef = useRef<any>(null);
  const ytInitedRef = useRef<string | null>(null);
  const watchedPctRef = useRef(0);
  const videoWatchedRef = useRef(true);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const lessonVideoUrl = typeof lesson?.videoUrl === "string" ? lesson.videoUrl : "";
  const videoEmbedUrl = lessonVideoUrl && isYoutubeUrl(lessonVideoUrl) ? getYoutubeEmbedUrl(lessonVideoUrl) : null;
  const nativeVideoSrc = lessonVideoUrl && !videoEmbedUrl
    ? lessonVideoUrl.startsWith("http")
      ? lessonVideoUrl
      : `${BASE_URL}${lessonVideoUrl}`
    : "";
  const nativeVideoIsHls = nativeVideoSrc.includes(".m3u8");

  useEffect(() => { watchedPctRef.current = watchedPercentage; }, [watchedPercentage]);
  useEffect(() => { videoWatchedRef.current = videoWatched; }, [videoWatched]);

  useEffect(() => {
    watchedPctRef.current = 0;
    lastSentPercent.current = 0;
    completionProgressSavedRef.current = false;
    setWatchedPercentage(0);
    setResumeWatchTime(0);
  }, [lessonId]);

  async function persistVideoProgress(seconds: number, pct: number, checkAfter = false) {
    if (!tokenRef.current) return;
    try {
      await progressApi.updateVideo({
        lessonId: lessonId as string,
        watchTime: seconds,
        watchedPercentage: pct,
      });
      if (checkAfter) {
        await checkCanComplete();
      }
    } catch {}
  }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!(window as any).YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => { 
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchData(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, id, token, authLoading]);

  useEffect(() => {
    const video = videoElementRef.current;
    if (!video || !nativeVideoSrc) return;

    let active = true;
    let localHls: any = null;

    if (hlsInstanceRef.current) {
      try { hlsInstanceRef.current.destroy(); } catch {}
      hlsInstanceRef.current = null;
    }

    video.crossOrigin = "use-credentials";

    if (nativeVideoIsHls) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = nativeVideoSrc;
        video.load();
      } else {
        import("hls.js").then(({ default: Hls }) => {
          if (!active || !videoElementRef.current || !Hls.isSupported()) return;

          localHls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            xhrSetup: (xhr) => {
              xhr.withCredentials = true;
              const accessToken = getAccessToken();
              if (accessToken) {
                xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
              }
            },
          });

          localHls.loadSource(nativeVideoSrc);
          localHls.attachMedia(videoElementRef.current);
          hlsInstanceRef.current = localHls;
        }).catch(() => {
          toast.error("Không tải được trình phát video.");
        });
      }
    } else {
      video.src = nativeVideoSrc;
      video.load();
    }

    return () => {
      active = false;
      if (localHls) {
        try { localHls.destroy(); } catch {}
      }
      if (hlsInstanceRef.current === localHls) {
        hlsInstanceRef.current = null;
      }
    };
  }, [nativeVideoSrc, nativeVideoIsHls]);

  async function fetchData() {
    setLoading(true);
    setProgressLoaded(false);
    try {
      const [lessonData, courseData] = await Promise.all([
        lessonsApi.getById(lessonId as string),
        coursesApi.getById(id as string),
      ]);
      setLesson(lessonData);
      setCourse(courseData);
      if (token) {
        progressApi.getCourseVideos(id as string).then((rows: any) => {
          const map: Record<string, { completed: boolean; watchTime: number; watchedPercentage: number }> = {};
          if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
              map[row.lessonId] = {
                completed: Boolean(row.completed),
                watchTime: Number(row.watchTime || 0),
                watchedPercentage: Number(row.watchedPercentage || 0),
              };
            });
          }
          setLessonProgress(map);
          setProgressLoaded(true);
        }).catch(() => {
          setLessonProgress({});
          setProgressLoaded(true);
        });
      } else {
        setProgressLoaded(true);
      }
      for (const sec of courseData.sections || []) {
        for (const les of sec.lessons || []) {
          if (les.id === lessonId) {
            if (les.materials?.length) setMaterials(les.materials);
            if (les.assignments?.length) setAssignments(les.assignments);
            break;
          }
        }
      }
    } catch {} finally { setLoading(false); }
    fetchComments();
    fetchAssignmentsApi();
    checkCanComplete();
    if (token) {
      progressApi.getLesson(lessonId as string).then((progress: any) => {
        const pct = Math.max(0, Math.min(100, Math.round(Number(progress?.watchedPercentage || 0))));
        const watchTime = Math.max(0, Math.round(Number(progress?.watchTime || 0)));
        watchedPctRef.current = pct;
        lastSentPercent.current = pct;
        completionProgressSavedRef.current = pct >= 90;
        setWatchedPercentage(pct);
        setResumeWatchTime(watchTime);
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId as string]: {
            completed: Boolean(progress?.completed),
            watchTime,
            watchedPercentage: pct,
          },
        }));
      }).catch(() => {});
    }
  }

  async function checkCanComplete() {
    if (!token) return;
    if (canCompleteRequestRef.current) {
      canCompleteQueuedRef.current = true;
      return;
    }
    canCompleteRequestRef.current = true;
    try {
      const { data } = await api.get(`/progress/lesson/${lessonId}/can-complete`);
      videoWatchedRef.current = true;
      setVideoWatched(true);
      setCanComplete(data.canComplete);
    } catch {} finally {
      canCompleteRequestRef.current = false;
      if (canCompleteQueuedRef.current) {
        canCompleteQueuedRef.current = false;
        checkCanComplete();
      }
    }
  }

  async function fetchComments() {
    try {
      const data = await commentsApi.getByLesson(lessonId as string);
      setComments(data);
    } catch {}
  }

  async function fetchAssignmentsApi() {
    try {
      const data = await assignmentsApi.getByLesson(lessonId as string);
      if (Array.isArray(data) && data.length > 0) setAssignments(data);
    } catch {}
  }

  async function postComment() {
    if (!comment.trim()) return;
    try {
      await commentsApi.create(lessonId as string, { content: comment.trim() });
      setComment(""); fetchComments(); toast.success("Đã gửi bình luận");
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Lỗi kết nối"); 
    }
  }

  async function postReply(commentId: string) {
    const text = replyText[commentId];
    if (!text?.trim()) return;
    try {
      await commentsApi.reply(lessonId as string, commentId, { content: text.trim() });
      setReplyText({ ...replyText, [commentId]: "" }); fetchComments(); toast.success("Đã trả lời");
    } catch { toast.error("Lỗi"); }
  }

  async function markComplete() {
    if (!token) { toast.error("Cần đăng nhập"); return; }
    if (!canComplete) {
      if (hasEssayAssignment && !assignmentSubmitted) toast.error("Bạn cần nộp đầy đủ bài tập trước khi chuyển bài.");
      else if (hasQuizAssignment) toast.error("Bạn cần làm quiz đạt tối thiểu 80% trước khi chuyển bài.");
      else toast.error("Bài học chưa đủ điều kiện hoàn thành.");
      return;
    }
    try {
      const completeLesson = async (accessToken: string) => fetch(`${API}/progress/video`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ lessonId: lessonId as string, watchTime: 0, watchedPercentage: 100 }),
      });

      let res = await completeLesson(token);
      if (res.status === 401) {
        const refreshRes = await fetch(`${API}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) {
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return;
        }
        const refreshed = await refreshRes.json();
        if (!refreshed?.access_token) {
          toast.error("Không thể làm mới phiên đăng nhập.");
          return;
        }
        login(refreshed.access_token);
        res = await completeLesson(refreshed.access_token);
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Lỗi cập nhật tiến độ");
      }

      setLessonProgress((prev) => ({
        ...prev,
        [lessonId as string]: { completed: true, watchTime: prev[lessonId as string]?.watchTime ?? 0, watchedPercentage: 100 },
      }));
      toast.success("🎉 Hoàn thành bài học!");
      const allL = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
      const idx = allL.findIndex((l: any) => l.id === lessonId);
      if (idx < allL.length - 1) {
        router.push(`/courses/${id}/lessons/${allL[idx + 1].id}`);
      } else {
        toast.success("🏆 Chúc mừng! Bạn đã hoàn thành khóa học!");
        setTimeout(() => {
          router.push(`/courses/${id}/certificate`);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || err.response?.data?.message || "Lỗi cập nhật tiến độ");
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!token) return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-14 flex items-center justify-between px-4 bg-[#1c1d1f] text-white border-b border-gray-800">
        <Link href={`/courses/${id}`} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-white/10">
          <ChevronLeft className="w-5 h-5" /> Khóa học
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground-muted">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">Phiên đăng nhập không còn hợp lệ</h1>
          <p className="mt-3 text-sm text-foreground-muted">
            Vui lòng đăng nhập lại để tiếp tục học. Trang sẽ không tự chuyển hướng để tránh làm mất ngữ cảnh bài học.
          </p>
          <Link href="/auth/login" className="btn-primary mt-6 inline-flex">
            Đăng nhập lại
          </Link>
        </div>
      </div>
    </div>
  );

  const allLessons = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const canBypassLessonLock = user?.role === "teacher" || user?.role === "admin";
  const isLessonLocked = (targetIndex: number) => {
    if (canBypassLessonLock || targetIndex <= 0) return false;
    const previous = allLessons[targetIndex - 1];
    return !lessonProgress[previous?.id]?.completed;
  };
  const currentLessonLocked = progressLoaded && isLessonLocked(currentIdx);

  const completedLessons = allLessons.filter((l: any) => lessonProgress[l.id]?.completed).length;
  const courseProgressPct = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const initials = (user?.firstName?.charAt(0) || user?.username?.charAt(0) || "?").toUpperCase();

  const essayAssignments = assignments.filter((assignment: any) => assignment.type !== "quiz");
  const quizAssignments = assignments.filter((assignment: any) => assignment.type === "quiz" && assignment.quiz?.id);
  const hasEssayAssignment = essayAssignments.length > 0;
  const hasQuizAssignment = quizAssignments.length > 0;
  const assignmentSubmitted = essayAssignments.length > 0 && essayAssignments.every((a: any) => a.submissions?.some((s: any) => s.studentId === user?.id));

  async function downloadMaterial(material: any) {
    if (!token) {
      toast.error("Bạn cần đăng nhập để tải tài liệu.");
      return;
    }
    const rawUrl = material.fileUrl || material.url || "";
    if (!rawUrl) {
      toast.error("Tài liệu không có đường dẫn tải xuống.");
      return;
    }
    const fileHref = rawUrl.startsWith("http") ? rawUrl : `${BASE_URL}${rawUrl}`;
    try {
      const res = await fetch(fileHref, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Không tải được tài liệu.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = material.title || material.name || "tai-lieu";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || "Không tải được tài liệu.");
    }
  }

  if (currentLessonLocked) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="h-14 flex items-center justify-between px-4 bg-[#1c1d1f] text-white border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Link href={`/courses/${id}`} className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors text-white" title="Quay lại khóa học">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <span className="font-bold text-sm truncate max-w-md">{course?.title || ""}</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground-muted">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-extrabold">Bài học đang bị khóa</h1>
            <p className="mt-3 text-sm text-foreground-muted">
              Bạn cần hoàn thành bài học trước đó trước khi mở bài này.
            </p>
            {prevLesson && (
              <Link href={`/courses/${id}/lessons/${prevLesson.id}`} className="btn-primary mt-6 inline-flex">
                Quay lại bài trước
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      {/* ─── Udemy Style Dark Header ─────────────────────────────────────────── */}
      <div className="h-14 flex items-center justify-between px-4 bg-[#1c1d1f] text-white border-b border-gray-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href={`/courses/${id}`} className="flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 transition-colors text-white" title="Quay lại khóa học">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="w-px h-5 bg-gray-600 hidden sm:block" />
          <span className="font-bold text-sm truncate max-w-md hidden sm:block">{course?.title || ""}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
              <div className="bg-primary h-full" style={{ width: `${courseProgressPct}%` }} />
            </div>
            <span className="hidden text-xs font-bold text-white/70 sm:inline">{completedLessons}/{allLessons.length} bài</span>
          </div>
          <button onClick={() => setTheaterMode(!theaterMode)} className="p-1.5 rounded hover:bg-white/10 transition-colors text-white" title={theaterMode ? "Thu nhỏ" : "Mở rộng"}>
            {theaterMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded hover:bg-white/10 transition-colors text-white hidden md:block">
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Main Content Grid (70-30) ───────────────────────────────── */}
      <div className={`flex flex-1 overflow-hidden relative ${theaterMode ? 'flex-col' : ''}`}>
        
        {/* Left Column: Player & Info */}
        <div className="flex-1 overflow-y-auto" style={{ maxWidth: !theaterMode && sidebarOpen ? 'calc(100% - 380px)' : '100%', transition: 'max-width 0.3s ease' }}>
          
          {/* Video player */}
          {lesson?.videoUrl ? (
            (() => {
              const ytVideoId = videoEmbedUrl?.split('/embed/')?.[1]?.split('?')?.[0];
              if (videoEmbedUrl && ytVideoId) {
                return (
                  <div className="aspect-video bg-black w-full">
                    <div id={`yt-player-${lessonId}`} ref={(el) => {
                      if (!el) {
                        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                        if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} }
                        ytPlayerRef.current = null;
                        ytInitedRef.current = null;
                        return;
                      }
                      if (ytInitedRef.current === ytVideoId) return;
                      ytInitedRef.current = ytVideoId;
                      const initPlayer = () => {
                        if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} }
                        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
                        ytPlayerRef.current = new (window as any).YT.Player(el, {
                          videoId: ytVideoId,
                          width: '100%', height: '100%',
                          playerVars: { autoplay: 0, rel: 0, modestbranding: 1, start: resumeWatchTime > 5 ? Math.max(0, resumeWatchTime - 3) : 0 },
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
              return (
                <div className="bg-black w-full">
                  <div className="aspect-video w-full relative">
                    <video
                      key={nativeVideoSrc}
                      ref={videoElementRef}
                      className="w-full h-full"
                      controls
                      controlsList="nodownload"
                      playsInline
                      onLoadedMetadata={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (resumeWatchTime > 5 && resumeWatchTime < video.duration - 5) {
                          video.currentTime = resumeWatchTime;
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (!video.duration) return;
                        const pct = Math.round((video.currentTime / video.duration) * 100);
                        if (pct > watchedPctRef.current) {
                          watchedPctRef.current = pct;
                          setWatchedPercentage(pct);
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })()
          ) : null}


          {/* ─── Lesson Info & Tabs ─────────────────────────── */}
          <div className={`w-full p-6 md:p-10 ${!lesson?.videoUrl ? "mx-auto max-w-5xl pt-8 md:pt-10" : "max-w-5xl"}`}>
            {!lesson?.videoUrl ? (
              <div className="mb-8 rounded-xl border border-border bg-[var(--card)] p-6 shadow-sm">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)] text-[var(--primary)]">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                        Bài học lý thuyết
                      </span>
                      <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">{lesson?.title || "Bài học"}</h1>
                      <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
                        Đọc nội dung bài học, xem tài liệu liên quan và hoàn thành bài tập hoặc quiz để mở bài tiếp theo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setVideoWatched(true);
                      checkCanComplete();
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Đã đọc xong
                  </button>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-[var(--background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Tài liệu</p>
                    <p className="mt-1 text-xl font-extrabold">{materials.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-[var(--background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Bài tập</p>
                    <p className="mt-1 text-xl font-extrabold">{essayAssignments.length}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-[var(--background)] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Quiz</p>
                    <p className="mt-1 text-xl font-extrabold">{quizAssignments.length}</p>
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-extrabold mb-8 pb-4 border-b border-border">{lesson?.title || "Bài học"}</h1>
            )}
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start gap-6 bg-transparent border-b border-border rounded-none px-0 h-auto pb-0">
                <TabsTrigger value="overview" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <BookOpen className="w-4 h-4" /> Tổng quan
                </TabsTrigger>
                <TabsTrigger value="resources" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <FileText className="w-4 h-4" /> Tài liệu {materials.length > 0 && `(${materials.length})`}
                </TabsTrigger>
                <TabsTrigger value="assignments" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <PenTool className="w-4 h-4" /> Bài tập {essayAssignments.length > 0 && `(${essayAssignments.length})`}
                </TabsTrigger>
                <TabsTrigger value="quiz" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <FileQuestion className="w-4 h-4" /> Quiz {quizAssignments.length > 0 && `(${quizAssignments.length})`}
                </TabsTrigger>
                <TabsTrigger value="discussion" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <MessageCircle className="w-4 h-4" /> Hỏi đáp theo bài ({comments.length})
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="mt-8">
                {lesson?.content ? (
                  <div className="prose dark:prose-invert max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(lesson.content) }} />
                  </div>
                ) : (
                  <p className="text-foreground-muted">Không có mô tả cho bài học này.</p>
                )}
              </TabsContent>

              {/* RESOURCES */}
              <TabsContent value="resources" className="mt-8">
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((m: any) => (
                        <button key={m.id} type="button" onClick={() => downloadMaterial(m)}
                          className="flex w-full items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors group text-left">
                          <Download className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-colors" />
                          <span className="font-bold text-sm flex-1">{m.title || m.name || "Tài liệu"}</span>
                        </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">Bài học này chưa có tài liệu đính kèm.</p>
                )}
              </TabsContent>

              {/* ASSIGNMENTS */}
              <TabsContent value="assignments" className="mt-8">
                {essayAssignments.length > 0 ? (
                  <div className="space-y-6">
                    {essayAssignments.map((a: any) => (
                      <div key={a.id} className="p-6 border border-border rounded-lg bg-card">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                           <h3 className="font-bold">{a.title}</h3>
                           <span className="text-xs font-bold px-2 py-1 bg-muted rounded">{a.type === "quiz" ? "Trắc nghiệm" : "Tự luận"}</span>
                        </div>
                        
                        {a.description && (a.description.startsWith("/uploads/") || a.description.startsWith("http")) ? (
                          <div className="mb-6">
                            <img src={a.description.startsWith("http") ? a.description : `${BASE_URL}${a.description}`} alt="Đề bài" className="max-w-full rounded border border-border" />
                          </div>
                        ) : a.description ? (
                          <p className="text-sm mb-6 whitespace-pre-line">{a.description}</p>
                        ) : null}

                        {(() => {
                          const mySub = a.submissions?.find((s: any) => s.studentId === user?.id);
                          const isGraded = mySub?.status === "graded";
                          const isSubmitted = !!mySub;

                          return (
                            <div className="space-y-4">
                              {isGraded && (
                                <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4">
                                  <div className="flex justify-between items-center mb-4 border-b border-green-500/20 pb-2">
                                     <span className="font-bold text-green-500">Kết quả chấm điểm</span>
                                     <span className="text-2xl font-black text-green-500">{mySub.score}<span className="text-sm text-green-500/70">/{a.maxScore || 10}</span></span>
                                  </div>
                                  {mySub.feedback && (
                                    <div>
                                       <p className="text-xs font-bold text-green-500 mb-1">Nhận xét của giáo viên:</p>
                                       <p className="text-sm">{mySub.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {isSubmitted && !isGraded && (
                                <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 p-4 rounded-lg text-sm font-bold flex items-center gap-2">
                                  ⏳ Bài làm của bạn đang chờ giáo viên chấm điểm.
                                </div>
                              )}

                              {!isSubmitted && (
                                <div>
                                  <p className="font-bold mb-2">Nộp bài làm</p>
                                  <AssignmentSubmit assignmentId={a.id} token={token} API={API} BASE_URL={BASE_URL} onSuccess={() => { fetchAssignmentsApi(); checkCanComplete(); }} />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">Bài học này chưa có bài tập.</p>
                )}
              </TabsContent>

              <TabsContent value="quiz" className="mt-8">
                {quizAssignments.length > 0 ? (
                  <div className="space-y-6">
                    {quizAssignments.map((assignment: any) => (
                      <InlineQuiz key={assignment.id} quizId={assignment.quiz.id} token={token} onPassed={() => { checkCanComplete(); fetchAssignmentsApi(); }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">Bài học này chưa có quiz.</p>
                )}
              </TabsContent>

              {/* DISCUSSION */}
              <TabsContent value="discussion" className="mt-8">
                {token && (
                  <div className="flex gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-white bg-primary">{initials}</div>
                    <div className="flex-1 flex gap-2">
                      <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={e => e.key === "Enter" && postComment()} placeholder="Đặt câu hỏi hoặc chia sẻ ý kiến của bạn..." className="w-full px-4 py-2 border border-border bg-background focus:border-primary focus:outline-none text-sm transition-colors rounded" />
                      <button onClick={postComment} className="bg-primary text-white px-4 rounded font-bold hover:bg-primary/90 transition-colors"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <p className="text-foreground-muted">Hãy là người đầu tiên thảo luận về bài học này.</p>
                  ) : comments.map((c: any) => (
                    <div key={c.id} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-bold text-white" style={{ background: c.user?.role === "teacher" ? "linear-gradient(135deg, #a435f0, #0891b2)" : "#a78bfa" }}>
                        {(c.user?.firstName || c.user?.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{c.user?.firstName || c.user?.username}</span>
                          {c.user?.role === "teacher" && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Giáo viên</span>}
                          <span className="text-xs text-foreground-muted">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                        </div>
                        <p className="text-sm mb-2">{c.content}</p>
                        
                        {/* Replies */}
                        {c.replies?.map((r: any) => (
                          <div key={r.id} className="flex gap-3 mt-4 ml-4 pl-4 border-l-2 border-border">
                            <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-white text-xs" style={{ background: r.user?.role === "teacher" ? "linear-gradient(135deg, #a435f0, #0891b2)" : "#a78bfa" }}>
                              {(r.user?.firstName || r.user?.username || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm">{r.user?.firstName || r.user?.username}</span>
                                {r.user?.role === "teacher" && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">GV</span>}
                              </div>
                              <p className="text-sm">{r.content}</p>
                            </div>
                          </div>
                        ))}
                        
                        {/* Reply input */}
                        {token && (
                          <div className="flex gap-2 mt-4 ml-4">
                            <input value={replyText[c.id] || ""} onChange={e => setReplyText({ ...replyText, [c.id]: e.target.value })}
                              onKeyDown={e => e.key === "Enter" && postReply(c.id)}
                              placeholder="Trả lời bình luận..." className="flex-1 px-3 py-1.5 border border-border bg-background focus:border-primary focus:outline-none text-sm transition-colors rounded" />
                            <button onClick={() => postReply(c.id)} className="bg-muted px-3 rounded hover:bg-border transition-colors font-bold text-sm">Gửi</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            {/* ─── Bottom Navigation ──────────────── */}
            <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevLesson ? (
                <Link href={`/courses/${id}/lessons/${prevLesson.id}`} className="px-6 py-3 border border-border font-bold rounded hover:bg-muted transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                  <ChevronLeft className="w-4 h-4" /> Bài trước
                </Link>
              ) : <div className="hidden sm:block w-32" />}
              
              <button
                onClick={markComplete}
                disabled={!canComplete}
                className={`w-full sm:w-auto px-8 py-3 font-bold rounded flex items-center justify-center gap-2 ${canComplete ? "bg-primary text-white hover:bg-primary/90" : "bg-muted text-foreground-muted cursor-not-allowed"}`}
              >
                {!canComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Chờ hoàn thành
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Hoàn thành & tiếp tục
                  </>
                )}
              </button>

              {nextLesson && canComplete ? (
                <Link href={`/courses/${id}/lessons/${nextLesson.id}`} className="px-6 py-3 border border-border font-bold rounded hover:bg-muted transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                  Bài tiếp <ChevronRight className="w-4 h-4" />
                </Link>
              ) : nextLesson ? (
                <button disabled className="px-6 py-3 border border-border font-bold rounded bg-muted text-foreground-muted flex items-center gap-2 w-full sm:w-auto justify-center cursor-not-allowed">
                  Bài tiếp <ChevronRight className="w-4 h-4" />
                </button>
              ) : <div className="hidden sm:block w-32" />}
            </div>
          </div>
        </div>

        {/* ─── Udemy Style Right Sidebar Curriculum ────────────────────────────────── */}
        <div className={`border-l border-border bg-background flex-shrink-0 flex flex-col transition-all duration-300 ${theaterMode ? 'hidden' : 'hidden md:flex'}`} style={{ width: sidebarOpen ? '380px' : '0px', overflow: 'hidden' }}>
          <div className="p-4 border-b border-border flex items-center justify-between bg-card">
             <h3 className="font-bold">Nội dung khóa học</h3>
             <button onClick={() => setSidebarOpen(false)} className="hover:text-primary transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
             {course?.sections?.sort((a: any, b: any) => a.order - b.order).map((sec: any, si: number) => (
               <div key={sec.id} className="border-b border-border">
                 <div className="p-4 bg-muted/30">
                    <p className="font-bold text-sm">Chương {si + 1}: {sec.title}</p>
                    <p className="text-xs text-foreground-muted mt-1">{sec.lessons?.length || 0} bài học</p>
                 </div>
                 <div>
                    {sec.lessons?.sort((a: any, b: any) => a.order - b.order).map((l: any, li: number) => {
                       const isCurrent = l.id === lessonId;
                       const progress = lessonProgress[l.id];
                       const lessonIndex = allLessons.findIndex((lessonItem: any) => lessonItem.id === l.id);
                       const locked = progressLoaded && isLessonLocked(lessonIndex);
                       const itemClass = `flex items-start gap-3 p-4 transition-colors ${locked ? 'cursor-not-allowed opacity-45 bg-muted/30' : isCurrent ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`;
                       const itemContent = (
                         <>
                            <div className="mt-0.5">
                               {locked ? <Lock className="w-4 h-4 text-foreground-muted" /> : progress?.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : isCurrent ? <PlayCircle className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border border-foreground-muted" />}
                            </div>
                            <div>
                               <p className={`text-sm ${isCurrent ? 'font-bold' : ''}`}>{li + 1}. {l.title}</p>
                               <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1">
                                 <Clock className="w-3 h-3"/>
                                 {locked ? "Hoàn thành bài trước để mở" : progress?.completed ? "Đã hoàn thành" : l.duration ? `${l.duration} phút` : "Chưa hoàn thành"}
                               </p>
                            </div>
                         </>
                       );
                       if (locked) {
                         return (
                           <div key={l.id} className={itemClass} aria-disabled="true">
                             {itemContent}
                           </div>
                         );
                       }
                       return (
                         <Link key={l.id} href={`/courses/${id}/lessons/${l.id}`} className={itemClass}>
                            {itemContent}
                         </Link>
                       );
                    })}
                 </div>
               </div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
