"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/components/auth/auth-state";
import {
  ArrowLeft, Plus, Trash2, BookOpen, Upload,
  FileText, Eye, Loader2, CheckCircle2, Film, X, Edit,
} from "lucide-react";
import { toast } from "sonner";
import { multipartUpload } from "@/lib/multipart-upload";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function TeacherCourseEditPage() {
  const { id } = useParams();
  const _router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New lesson form
  const [showNewLesson, setShowNewLesson] = useState<string | null>(null); // sectionId
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");
  const [newLessonVideo, setNewLessonVideo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<"uploading" | "processing">("uploading");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // New section form
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");

  // Edit lesson
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [_editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const editVideoRef = useRef<HTMLInputElement>(null);

  // Inline lesson edit
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (token && id) fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  async function fetchCourse() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourse(await res.json());
    } catch {} finally { setLoading(false); }
  }

  async function uploadVideo(file: File): Promise<{ url: string; mediaAssetId?: string } | null> {
    setUploading(true);
    setUploadPhase("uploading");
    setUploadProgress(0);
    try {
      const result = await multipartUpload(file, token!, (p) => {
        setUploadPhase(p.phase);
        setUploadProgress(p.progress);
      });
      setUploading(false);
      return { url: result.url, mediaAssetId: result.mediaAssetId };
    } catch (err: any) {
      setUploading(false);
      toast.error(err.message || "Lỗi upload");
      return null;
    }
  }

  async function waitForVideoJob(jobId: string): Promise<string | null> {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch(`${API}/upload/video/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;

      const data = await res.json();
      if (typeof data.progress === "number") {
        setUploadProgress(Math.max(0, Math.min(100, data.progress)));
      }

      if (data.status === "completed" && data.url) return data.url;
      if (data.status === "failed") {
        toast.error(data.error || "Lỗi xử lý video");
        return null;
      }
    }

    toast.error("Xử lý video quá lâu, vui lòng thử lại sau");
    return null;
  }

  async function addSection() {
    if (!newSectionTitle.trim()) return;
    try {
      const order = (course?.sections?.length || 0) + 1;
      const res = await fetch(`${API}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newSectionTitle.trim(), courseId: id, order }),
      });
      if (res.ok) {
        toast.success("Đã thêm chương!");
        setNewSectionTitle("");
        setShowNewSection(false);
        fetchCourse();
      } else {
        const d = await res.json(); toast.error(d.message || "Lỗi");
      }
    } catch { toast.error("Lỗi kết nối"); }
  }

  async function addLesson(sectionId: string) {
    if (!newLessonTitle.trim()) return;
    setSaving(true);
    try {
      let videoUrl: string | undefined;
      let mediaAssetId: string | undefined;
      if (newLessonVideo) {
        const upload = await uploadVideo(newLessonVideo);
        if (!upload) {
          setSaving(false);
          return;
        }
        videoUrl = upload.url;
        mediaAssetId = upload.mediaAssetId;
      }
      const res = await fetch(`${API}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newLessonTitle.trim(),
          content: newLessonContent.trim() || undefined,
          videoUrl,
          mediaAssetId,
          sectionId,
        }),
      });
      if (res.ok) {
        toast.success("Đã thêm bài học!");
        setNewLessonTitle("");
        setNewLessonContent("");
        setNewLessonVideo(null);
        setShowNewLesson(null);
        fetchCourse();
      } else {
        const d = await res.json(); toast.error(d.message || "Lỗi tạo bài");
      }
    } catch { toast.error("Lỗi"); } finally { setSaving(false); }
  }

  async function updateLessonVideo(lessonId: string, file: File) {
    setUploading(true);
    try {
      const upload = await uploadVideo(file);
      if (!upload) return;
      const res = await fetch(`${API}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ videoUrl: upload.url, mediaAssetId: upload.mediaAssetId }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật video!");
        setEditingLesson(null);
        setEditVideoFile(null);
        fetchCourse();
      } else {
        toast.error("Lỗi cập nhật");
      }
    } catch { toast.error("Lỗi"); } finally { setUploading(false); }
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm("Xóa bài học này?")) return;
    try {
      await fetch(`${API}/lessons/${lessonId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa");
      fetchCourse();
    } catch { toast.error("Lỗi"); }
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Xóa chương này và tất cả bài học?")) return;
    try {
      await fetch(`${API}/sections/${sectionId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Đã xóa chương");
      fetchCourse();
    } catch { toast.error("Lỗi"); }
  }

  function startEditLesson(lesson: any) {
    setEditLessonId(lesson.id);
    setEditLessonTitle(lesson.title || "");
    setEditLessonContent(lesson.content || "");
  }

  async function saveEditLesson() {
    if (!editLessonId || !editLessonTitle.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/lessons/${editLessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: editLessonTitle.trim(), content: editLessonContent.trim() || undefined }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật bài học!");
        setEditLessonId(null);
        fetchCourse();
      } else {
        const d = await res.json(); toast.error(d.message || "Lỗi cập nhật");
      }
    } catch { toast.error("Lỗi kết nối"); } finally { setEditSaving(false); }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#5624d0" }} />
      </div>
    );
  }

  const sections = course?.sections?.sort((a: any, b: any) => a.order - b.order) || [];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24 page-enter">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="flex items-center gap-1 text-sm hover:text-[#a78bfa] transition-colors" style={{ color: "#6a6f73" }}>
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-extrabold">{course?.title || "Khóa học"}</h1>
                <p className="text-xs" style={{ color: "#6a6f73" }}>Quản lý nội dung và video bài giảng</p>
              </div>
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-[var(--muted)] transition-colors"
                     style={{ borderColor: "var(--border)", color: course?.allowPlatformPromotions ? "#10b981" : "var(--foreground-muted)" }}>
                <input type="checkbox" checked={course?.allowPlatformPromotions ?? true} 
                       onChange={async (e) => {
                         const val = e.target.checked;
                         setCourse({ ...course, allowPlatformPromotions: val });
                         try {
                           await fetch(`${API}/courses/${id}`, {
                             method: "PUT",
                             headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                             body: JSON.stringify({ status: course?.status }),
                           });
                           toast.success(val ? "Đã bật chạy khuyến mãi nền tảng" : "Đã tắt khuyến mãi nền tảng");
                         } catch { toast.error("Lỗi cập nhật"); }
                       }} 
                       className="hidden" />
                {course?.allowPlatformPromotions ? "Khuyến mãi: Bật" : "Khuyến mãi: Tắt"}
              </label>
              <button onClick={() => window.open(`/courses/${id}`, '_blank')} className="btn-secondary text-sm"><Eye className="w-4 h-4" /> Xem trước</button>
            </div>
          </div>

          {/* Sections & Lessons */}
          <div className="space-y-4">
            {sections.map((sec: any) => (
              <div key={sec.id} className="card-base card-spotlight">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                    <BookOpen className="w-4 h-4" style={{ color: "#a435f0" }} />
                  </div>
                  <h3 className="font-bold flex-1">{sec.title}</h3>
                  <span className="text-xs" style={{ color: "#6a6f73" }}>{sec.lessons?.length || 0} bài</span>
                  <button onClick={() => deleteSection(sec.id)} className="btn-ghost px-2 py-1"><Trash2 className="w-3.5 h-3.5" style={{ color: "#ef4444" }} /></button>
                </div>

                {/* Lessons list */}
                <div className="space-y-2 ml-2">
                  {sec.lessons?.sort((a: any, b: any) => a.order - b.order).map((l: any) => (
                    <div key={l.id} className="rounded-xl transition-all group" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                      {editLessonId === l.id ? (
                        /* ─── Inline Edit Mode ─── */
                        <div className="p-4 space-y-3">
                          <input value={editLessonTitle} onChange={(e) => setEditLessonTitle(e.target.value)}
                            placeholder="Tên bài học" className="input-base text-sm w-full" />
                          <textarea value={editLessonContent} onChange={(e) => setEditLessonContent(e.target.value)}
                            placeholder="Nội dung bài học (tùy chọn)" rows={3} className="input-base text-sm resize-none w-full" />
                          <div className="flex gap-2">
                            <button onClick={saveEditLesson} disabled={editSaving || !editLessonTitle.trim()}
                              className="btn-primary text-xs" style={{ opacity: editSaving || !editLessonTitle.trim() ? 0.5 : 1 }}>
                              {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              Lưu
                            </button>
                            <button onClick={() => setEditLessonId(null)} className="btn-ghost text-xs">Hủy</button>
                          </div>
                        </div>
                      ) : (
                        /* ─── Normal Display Mode ─── */
                        <div className="flex items-center gap-3 px-4 py-3">
                          {l.videoUrl ? (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)" }}>
                              <Film className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                              <FileText className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                            </div>
                          )}
                          <span className="text-sm flex-1 font-medium">{l.title}</span>

                          {l.videoUrl ? (
                            <span className="badge text-[10px] badge-success">Có video</span>
                          ) : (
                            <span className="badge text-[10px] badge-warning">Chưa có video</span>
                          )}

                          {/* Edit lesson button */}
                          <button onClick={() => startEditLesson(l)}
                            className="btn-ghost px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#f59e0b" }}>
                            <Edit className="w-3 h-3" /> Sửa
                          </button>

                          {/* Upload/replace video button */}
                          <button onClick={() => { setEditingLesson(l.id); editVideoRef.current?.click(); }}
                            className="btn-ghost px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#0891b2" }}>
                            <Upload className="w-3 h-3" /> {l.videoUrl ? "Đổi video" : "Up video"}
                          </button>

                          <button onClick={() => _router.push(`/teacher/lessons/${l.id}/quiz`)} className="btn-ghost px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#a435f0" }}>
                            <FileText className="w-3 h-3" /> Bài tập/Quiz
                          </button>

                          <button onClick={() => deleteLesson(l.id)} className="btn-ghost px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add lesson button */}
                  {showNewLesson === sec.id ? (
                    <div className="p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-3.5 h-3.5" style={{ color: "#5624d0" }} /> Thêm bài học mới
                      </h4>
                      <div className="space-y-3">
                        <input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)}
                          placeholder="Tên bài học" className="input-base text-sm" />
                        <textarea value={newLessonContent} onChange={(e) => setNewLessonContent(e.target.value)}
                          placeholder="Nội dung bài học (tùy chọn)" rows={3} className="input-base text-sm resize-none" />

                        {/* Video upload */}
                        <div>
                          <label className="text-xs font-medium mb-1 block" style={{ color: "#6a6f73" }}>Video bài giảng</label>
                          {newLessonVideo ? (
                            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                              <Film className="w-5 h-5" style={{ color: "#10b981" }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{newLessonVideo.name}</p>
                                <p className="text-[10px]" style={{ color: "#6a6f73" }}>{(newLessonVideo.size / (1024 * 1024)).toFixed(1)} MB</p>
                              </div>
                              <button onClick={() => setNewLessonVideo(null)} className="btn-ghost px-1.5 py-1"><X className="w-3 h-3" style={{ color: "#ef4444" }} /></button>
                            </div>
                          ) : (
                            <button onClick={() => videoInputRef.current?.click()}
                              className="w-full py-4 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 transition-all hover:border-[#a435f0] hover:bg-[rgba(124,58,237,0.04)]"
                              style={{ borderColor: "var(--border)" }}>
                              <Upload className="w-6 h-6" style={{ color: "#6a6f73" }} />
                              <span className="text-xs font-medium" style={{ color: "#6a6f73" }}>Click để chọn video (MP4, WebM, MOV, tối đa 500MB)</span>
                            </button>
                          )}
                          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi" className="hidden"
                            onChange={(e) => { if (e.target.files?.[0]) setNewLessonVideo(e.target.files[0]); }} />
                        </div>

                        {/* Upload progress */}
                        {uploading && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: "#6a6f73" }}>
                                {uploadPhase === "processing" ? "Đang xử lý video..." : "Đang upload video..."}
                              </span>
                              <span className="font-bold" style={{ color: "#5624d0" }}>{uploadProgress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => addLesson(sec.id)} disabled={saving || uploading || !newLessonTitle.trim()}
                            className="btn-primary text-sm" style={{ opacity: saving || uploading || !newLessonTitle.trim() ? 0.5 : 1 }}>
                            {saving || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {uploading ? (uploadPhase === "processing" ? "Đang xử lý..." : "Đang upload...") : saving ? "Đang lưu..." : "Thêm bài học"}
                          </button>
                          <button onClick={() => { setShowNewLesson(null); setNewLessonTitle(""); setNewLessonContent(""); setNewLessonVideo(null); }}
                            className="btn-ghost text-sm">Hủy</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowNewLesson(sec.id)}
                      className="btn-ghost text-xs w-full justify-center py-2.5 mt-1" style={{ color: "#a435f0", border: "1px dashed rgba(124,58,237,0.3)", borderRadius: "12px" }}>
                      <Plus className="w-3 h-3" /> Thêm bài học
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add section */}
          {showNewSection ? (
            <div className="card-base mt-4">
              <h4 className="text-sm font-bold mb-3">Thêm chương mới</h4>
              <div className="flex gap-2">
                <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Tên chương" className="input-base text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addSection()} />
                <button onClick={addSection} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Thêm</button>
                <button onClick={() => { setShowNewSection(false); setNewSectionTitle(""); }} className="btn-ghost text-sm">Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewSection(true)} className="btn-secondary w-full justify-center mt-4">
              <Plus className="w-4 h-4" /> Thêm chương mới
            </button>
          )}

          {/* Hidden file input for editing lesson videos */}
          <input ref={editVideoRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi" className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0] && editingLesson) {
                updateLessonVideo(editingLesson, e.target.files[0]);
              }
              e.target.value = "";
            }} />
        </div>
      </div>
    </div>
  );
}
