"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-state";
import { getAccessToken, lessonsApi, coursesApi, commentsApi, assignmentsApi, progressApi } from "@/lib/api-service";
import api from "@/lib/api-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Clock,
  MessageCircle, Send, List, X, Loader2, Image as ImageIcon,
  FileText, PenTool, Maximize2, Minimize2, Download, PlayCircle
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
  const { user, token } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [canComplete, setCanComplete] = useState(true);
  const [videoWatched, setVideoWatched] = useState(true);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
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
    if (pct >= 90 && !videoWatchedRef.current) {
      videoWatchedRef.current = true;
      setVideoWatched(true);
    }
    if (tokenRef.current && pct >= lastSentPercent.current + 10) {
      lastSentPercent.current = pct;
      if (pct >= 90) completionProgressSavedRef.current = true;
      persistVideoProgress(Math.floor(player.getCurrentTime()), pct, pct >= 90);
    } else if (tokenRef.current && pct >= 90 && !completionProgressSavedRef.current) {
      completionProgressSavedRef.current = true;
      lastSentPercent.current = Math.max(lastSentPercent.current, pct);
      persistVideoProgress(Math.floor(player.getCurrentTime()), pct, true);
    }
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
    if (token !== undefined) {
      fetchData(); 
    }
  }, [lessonId, id, token]);

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
    try {
      const [lessonData, courseData] = await Promise.all([
        lessonsApi.getById(lessonId as string),
        coursesApi.getById(id as string),
      ]);
      setLesson(lessonData);
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
    } catch {} finally { setLoading(false); }
    fetchComments();
    fetchAssignmentsApi();
    checkCanComplete();
    if (token) {
      progressApi.getLesson(lessonId as string).then((progress: any) => {
        const pct = Math.max(0, Math.min(100, Math.round(Number(progress?.watchedPercentage || 0))));
        watchedPctRef.current = pct;
        lastSentPercent.current = pct;
        completionProgressSavedRef.current = pct >= 90;
        setWatchedPercentage(pct);
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
      const videoCompleted = Boolean(data.videoCompleted) || watchedPctRef.current >= 90;
      videoWatchedRef.current = videoCompleted;
      setVideoWatched(videoCompleted);
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
      if (!videoWatched) toast.error(`⚠️ Bạn cần xem ít nhất 90% video! (Hiện tại: ${watchedPercentage}%)`);
      else if (hasAssignment) toast.error("⚠️ Bạn cần nộp bài tập trước khi hoàn thành bài học!");
      return;
    }
    try {
      await progressApi.updateVideo({ lessonId: lessonId as string, watchTime: 0, watchedPercentage: 100 });
      toast.success("🎉 Hoàn thành bài học!");
      const allL = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
      const idx = allL.findIndex((l: any) => l.id === lessonId);
      if (idx < allL.length - 1) {
        window.location.href = `/courses/${id}/lessons/${allL[idx + 1].id}`;
      } else {
        toast.success("🏆 Chúc mừng! Bạn đã hoàn thành khóa học!");
        setTimeout(() => {
          window.location.href = `/courses/${id}/certificate`;
        }, 1500);
      }
    } catch (err: any) { 
      toast.error(err.response?.data?.message || "Lỗi cập nhật tiến độ"); 
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const allLessons = course?.sections?.flatMap((s: any) => s.lessons?.sort((a: any, b: any) => a.order - b.order) || []) || [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const initials = (user?.firstName?.charAt(0) || user?.username?.charAt(0) || "?").toUpperCase();

  const hasAssignment = assignments.length > 0;
  const assignmentSubmitted = assignments.length > 0 && assignments.every(a => a.submissions?.some((s: any) => s.studentId === user?.id));

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
              <div className="bg-primary h-full" style={{ width: `${allLessons.length ? ((currentIdx + 1) / allLessons.length) * 100 : 0}%` }} />
            </div>
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
                      onTimeUpdate={(e) => {
                        const video = e.target as HTMLVideoElement;
                        if (!video.duration) return;
                        const pct = Math.round((video.currentTime / video.duration) * 100);
                        const seconds = Math.floor(video.currentTime);
                        if (pct > watchedPctRef.current) {
                          watchedPctRef.current = pct;
                          setWatchedPercentage(pct);
                        }
                        if (pct >= 90 && !videoWatchedRef.current) {
                          videoWatchedRef.current = true;
                          setVideoWatched(true);
                        }
                        if (tokenRef.current && pct >= lastSentPercent.current + 10) {
                          lastSentPercent.current = pct;
                          if (pct >= 90) completionProgressSavedRef.current = true;
                          persistVideoProgress(seconds, pct, pct >= 90);
                        } else if (tokenRef.current && pct >= 90 && !completionProgressSavedRef.current) {
                          completionProgressSavedRef.current = true;
                          lastSentPercent.current = Math.max(lastSentPercent.current, pct);
                          persistVideoProgress(seconds, pct, true);
                        }
                      }}
                    />
                  </div>
                  <div className="border-t border-white/10 bg-[#111113] px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white/80 mb-2">
                      <span>Tiến độ xem bài</span>
                      <span>{watchedPercentage}% / yêu cầu 90%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#a435f0] transition-[width] duration-300"
                        style={{ width: `${Math.min(watchedPercentage, 100)}%` }}
                      />
                    </div>
                    {!videoWatched && (
                      <p className="mt-2 text-xs text-white/55">
                        Xem tối thiểu 90% video để được hoàn thành bài học.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* ─── Text/Reading Lesson (No Video) ─── */
            <div className="w-full bg-[#f7f9fa] dark:bg-[#2d2f31] border-b border-[#d1d7dc] dark:border-[#3e4143]">
              <div className="max-w-3xl mx-auto px-6 py-10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-[#5624d0] dark:text-[#c0a5f7]" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-[#f3f0ff] dark:bg-[rgba(164,53,240,0.15)] text-[#5624d0] dark:text-[#c0a5f7] text-xs font-bold rounded mb-2">
                      Bài học lý thuyết
                    </span>
                    <h2 className="text-xl font-bold text-[#2d2f31] dark:text-white">{lesson?.title || "Bài học"}</h2>
                    <p className="text-sm text-[#6a6f73] mt-1">Đọc và nắm vững nội dung bài học bên dưới, sau đó hoàn thành bài tập để tiếp tục.</p>
                  </div>
                </div>

                {/* Reading progress indicator */}
                <div className="mt-6 flex items-center gap-3 p-4 bg-white dark:bg-[#1c1d1f] border border-[#d1d7dc] dark:border-[#3e4143] rounded">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-[#6a6f73]">Tiến độ đọc bài</span>
                      <span className="text-[#5624d0]">Cuộn xuống để đọc toàn bộ</span>
                    </div>
                    <div className="h-1.5 bg-[#f7f9fa] dark:bg-[#3e4143] rounded-full overflow-hidden">
                      <div className="h-full bg-[#a435f0] rounded-full w-0 transition-all duration-500" id="reading-progress" />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setVideoWatched(true);
                      const bar = document.getElementById("reading-progress");
                      if (bar) bar.style.width = "100%";
                      checkCanComplete();
                    }}
                    className="flex-shrink-0 px-4 py-1.5 bg-[#a435f0] hover:bg-[#8710d8] text-white text-xs font-bold rounded transition-colors"
                  >
                    ✓ Đã đọc xong
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ─── Lesson Info & Tabs ─────────────────────────── */}
          <div className="p-6 md:p-10 max-w-5xl">
            
            <h1 className="text-2xl md:text-3xl font-extrabold mb-8 pb-4 border-b border-border">{lesson?.title || "Bài học"}</h1>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start gap-6 bg-transparent border-b border-border rounded-none px-0 h-auto pb-0">
                <TabsTrigger value="overview" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <BookOpen className="w-4 h-4" /> Tổng quan
                </TabsTrigger>
                <TabsTrigger value="resources" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <FileText className="w-4 h-4" /> Tài liệu {materials.length > 0 && `(${materials.length})`}
                </TabsTrigger>
                <TabsTrigger value="assignments" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <PenTool className="w-4 h-4" /> Bài tập {assignments.length > 0 && `(${assignments.length})`}
                </TabsTrigger>
                <TabsTrigger value="discussion" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 py-3 text-sm font-bold gap-2">
                  <MessageCircle className="w-4 h-4" /> Hỏi đáp ({comments.length})
                </TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="mt-8">
                {lesson?.content ? (
                  <div className="prose dark:prose-invert max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                  </div>
                ) : (
                  <p className="text-foreground-muted">Không có mô tả cho bài học này.</p>
                )}
              </TabsContent>

              {/* RESOURCES */}
              <TabsContent value="resources" className="mt-8">
                {materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((m: any) => {
                      const rawUrl = m.fileUrl || m.url || "";
                      const fileHref = rawUrl.startsWith("http") ? rawUrl : rawUrl ? `${BASE_URL}${rawUrl}` : "#";
                      return (
                        <a key={m.id} href={fileHref} target="_blank" rel="noopener noreferrer" download
                          className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors group">
                          <Download className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-colors" />
                          <span className="font-bold text-sm flex-1">{m.title || m.name || "Tài liệu"}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-foreground-muted">Bài học này chưa có tài liệu đính kèm.</p>
                )}
              </TabsContent>

              {/* ASSIGNMENTS */}
              <TabsContent value="assignments" className="mt-8">
                {assignments.length > 0 ? (
                  <div className="space-y-6">
                    {assignments.map((a: any) => (
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

                          if (a.type === "quiz" && a.quizId) {
                            return <Link href={`/quiz/${a.quizId}`} className="bg-primary text-white px-6 py-2 rounded font-bold text-sm inline-block hover:bg-primary/90">Làm bài trắc nghiệm</Link>;
                          }

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

              {nextLesson ? (
                <Link href={`/courses/${id}/lessons/${nextLesson.id}`} className="px-6 py-3 border border-border font-bold rounded hover:bg-muted transition-colors flex items-center gap-2 w-full sm:w-auto justify-center">
                  Bài tiếp <ChevronRight className="w-4 h-4" />
                </Link>
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
                       return (
                         <Link key={l.id} href={`/courses/${id}/lessons/${l.id}`} className={`flex items-start gap-3 p-4 transition-colors ${isCurrent ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`}>
                            <div className="mt-0.5">
                               {isCurrent ? <PlayCircle className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border border-foreground-muted" />}
                            </div>
                            <div>
                               <p className={`text-sm ${isCurrent ? 'font-bold' : ''}`}>{li + 1}. {l.title}</p>
                               {l.duration && <p className="text-xs text-foreground-muted mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {l.duration} phút</p>}
                            </div>
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
