"use client";
import { useState, useRef, useCallback, DragEvent } from "react";
import {
  Play, Plus, Trash2, Upload, FileText, Image as ImageIcon, Video,
  ChevronDown, ChevronUp, CheckCircle2, Loader2, CloudUpload, X,
  Film, File, AlertCircle, RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { multipartUpload } from "@/lib/multipart-upload";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface UploadState {
  status: "idle" | "uploading" | "processing" | "done" | "error";
  progress: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
  detail?: string; // e.g. "Phần 3/20"
}

/** Format file size to human readable */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Upload Zone Component ──────────────────────────────────────────────────

function UploadZone({
  lesId, type, token, onUploaded, accept, icon: Icon, title, subtitle, accentColor, accentBg,
}: {
  lesId: string; type: "video" | "image" | "file"; token: string;
  onUploaded: (url: string, mediaAssetId?: string) => void;
  accept: string; icon: any; title: string; subtitle: string;
  accentColor: string; accentBg: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>({ status: "idle", progress: 0 });

  const waitForVideoJob = async (jobId: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await fetch(`${API}/upload/video/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (typeof data.progress === "number") {
        setState(p => ({ ...p, progress: Math.max(0, Math.min(100, data.progress)) }));
      }
      if (data.status === "completed" && data.url) return data.url;
      if (data.status === "failed") {
        toast.error(data.error || "Lỗi xử lý video");
        return null;
      }
    }
    toast.error("Xử lý video quá lâu, vui lòng thử lại sau");
    return null;
  };

  const handleUpload = async (file: File) => {
    setState({ status: "uploading", progress: 0, fileName: file.name, fileSize: file.size });
    try {
      if (type === "video") {
        // ── S3 Multipart Chunked Upload (10MB/chunk, retry 3x) ──
        const result = await multipartUpload(file, token, (p) => {
          setState(prev => ({
            ...prev,
            status: p.phase,
            progress: p.progress,
            detail: p.phase === "uploading" ? `Phần ${p.currentPart}/${p.totalParts}` : "Đang chuyển đổi HLS...",
          }));
        });
        setState({ status: "done", progress: 100, fileName: file.name, fileSize: file.size });
        onUploaded(result.url, result.mediaAssetId);
        toast.success("Video đã tải lên và xử lý xong!");
      } else {
        // ── Legacy FormData for image/file (small files) ──
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API}/upload/${type}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Lỗi tải lên");
        }
        const data = await res.json();
        if (!data.url) throw new Error("Server không trả về URL");
        setState({ status: "done", progress: 100, fileName: file.name, fileSize: file.size });
        onUploaded(data.url, data.mediaAssetId);
        toast.success("Tải lên thành công!");
      }
    } catch (err: any) {
      setState(p => ({ ...p, status: "error", error: err.message || "Lỗi upload" }));
      toast.error(err.message || "Lỗi upload");
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const reset = () => setState({ status: "idle", progress: 0 });

  // ── Render states ──
  if (state.status === "done") {
    return (
      <div className="rounded-xl p-3 transition-all" style={{ background: accentBg, border: `1px solid ${accentColor}30` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}20` }}>
            <CheckCircle2 className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{state.fileName}</p>
            <p className="text-[10px]" style={{ color: "#6a6f73" }}>{state.fileSize ? formatSize(state.fileSize) : ""} • Đã tải lên</p>
          </div>
          <button type="button" onClick={reset} className="p-1 rounded-lg hover:bg-white/5 transition-colors" title="Thay thế file">
            <RotateCcw className="w-3.5 h-3.5" style={{ color: "#6a6f73" }} />
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
            <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>Tải lên thất bại</p>
            <p className="text-[10px]" style={{ color: "#6a6f73" }}>{state.error}</p>
          </div>
          <button type="button" onClick={reset} className="text-[10px] font-medium px-2 py-1 rounded-lg hover:bg-white/5" style={{ color: accentColor }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "uploading" || state.status === "processing") {
    return (
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: accentBg, border: `1px solid ${accentColor}20` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}20` }}>
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{state.fileName}</p>
            <p className="text-[10px]" style={{ color: "#6a6f73" }}>
              {state.status === "processing"
                ? (state.detail || "Đang chuyển đổi HLS...")
                : (state.detail || "Đang tải lên S3...")}
            </p>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>{state.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${accentColor}15` }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${state.progress}%`, background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)` }}
          />
        </div>
      </div>
    );
  }

  // ── Idle: Drop zone ──
  return (
    <>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFileSelect} />
      <div
        className="rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all group"
        style={{
          borderColor: dragOver ? accentColor : "var(--border)",
          background: dragOver ? `${accentColor}08` : "transparent",
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ background: accentBg }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold">{title}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#6a6f73" }}>{subtitle}</p>
          </div>
          <div
            className="flex items-center gap-1.5 text-[10px] font-medium px-3 py-1 rounded-lg transition-colors"
            style={{ color: accentColor, background: `${accentColor}10` }}
          >
            <CloudUpload className="w-3 h-3" /> Chọn file hoặc kéo thả
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

function isUploadedVideo(url: string): boolean {
  if (!url) return false;
  return !isYouTubeUrl(url);
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function Step3Lessons({ sections, setSections, token }: any) {
  const addLesson = (secId: string) => {
    setSections((prev: any[]) => prev.map(s => s.id === secId ? {
      ...s, expanded: true,
      lessons: [...s.lessons, { id: `les-${Date.now()}`, title: "", videoUrl: "", mediaAssetId: "", documentUrl: "", documentOriginalName: "", assignmentImageUrl: "" }]
    } : s));
  };

  const removeLesson = (secId: string, lesId: string) => {
    setSections((prev: any[]) => prev.map(s => s.id === secId ? {
      ...s, lessons: s.lessons.filter((l: any) => l.id !== lesId)
    } : s));
  };

  const updateLesson = useCallback((secId: string, lesId: string, updates: any) => {
    setSections((prev: any[]) => prev.map(s => s.id === secId ? {
      ...s, lessons: s.lessons.map((l: any) => l.id === lesId ? { ...l, ...updates } : l)
    } : s));
  }, [setSections]);

  const toggleSection = (secId: string) => {
    setSections((prev: any[]) => prev.map(s => s.id === secId ? { ...s, expanded: !s.expanded } : s));
  };

  if (sections.length === 0) {
    return (
      <div className="card-base text-center py-12">
        <p className="font-semibold">Vui lòng quay lại Bước 2 để thêm ít nhất 1 chương.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="px-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Play className="w-5 h-5" style={{ color: "#FFCCAA" }} /> Bước 3: Bài giảng & Nội dung
        </h3>
        <p className="text-xs mt-1" style={{ color: "#6a6f73" }}>
          Thêm video bài giảng, tài liệu đính kèm và ảnh đề bài cho mỗi bài học. Video sẽ được tải trực tiếp lên cloud.
        </p>
      </div>

      {sections.map((sec: any, si: number) => (
        <div key={sec.id} className="card-base transition-all" style={{ borderColor: sec.expanded ? "#FFCCAA40" : "var(--border)" }}>
          {/* Section header */}
          <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => toggleSection(sec.id)}>
            <h4 className="font-bold flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #FFCCAA, #F8B486)", color: "#1a1a2e" }}>
                {si + 1}
              </span>
              <span>{sec.title || "Chương chưa có tên"}</span>
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,204,170,0.1)", color: "#FFCCAA" }}>
                {sec.lessons.length} bài học
              </span>
              <span className="btn-ghost px-1.5 py-1.5 rounded-lg">
                {sec.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </div>

          {sec.expanded && (
            <div className="space-y-4 mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
              {sec.lessons.map((les: any, li: number) => (
                <div key={les.id} className="rounded-xl overflow-hidden" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  {/* Lesson header */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                      style={{ background: "rgba(255,204,170,0.15)", color: "#FFCCAA" }}>
                      {li + 1}
                    </span>
                    <input
                      value={les.title}
                      onChange={(e) => updateLesson(sec.id, les.id, { title: e.target.value })}
                      placeholder="Tên bài học (VD: Bài 1: Giới thiệu khóa học)"
                      className="flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--foreground-muted)] focus:outline-none"
                    />
                    <button type="button" onClick={() => removeLesson(sec.id, les.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors group/del">
                      <Trash2 className="w-3.5 h-3.5 transition-colors" style={{ color: "#6a6f73" }} />
                    </button>
                  </div>

                  {/* Upload zones */}
                  <div className="p-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      {/* ===== VIDEO ===== */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase" style={{ color: "#F8B486" }}>
                          <Film className="w-3.5 h-3.5" /> Video bài giảng
                        </label>

                        {/* YouTube input */}
                        <div className="relative">
                          <input
                            placeholder="Dán link YouTube..."
                            value={isUploadedVideo(les.videoUrl) ? "" : les.videoUrl}
                            onChange={(e) => updateLesson(sec.id, les.id, { videoUrl: e.target.value })}
                            className="input-base text-xs py-2 w-full pl-3 pr-8"
                            style={{ borderColor: "var(--border)" }}
                          />
                          <Video className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "#6a6f73" }} />
                        </div>

                        <div className="flex items-center gap-2 px-1">
                          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                          <span className="text-[9px] font-medium uppercase tracking-wider" style={{ color: "#6a6f73" }}>hoặc upload</span>
                          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        </div>

                        {isUploadedVideo(les.videoUrl) ? (
                          <div className="rounded-xl p-3" style={{ background: "rgba(248,180,134,0.06)", border: "1px solid rgba(248,180,134,0.2)" }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(248,180,134,0.15)" }}>
                                <CheckCircle2 className="w-4 h-4" style={{ color: "#F8B486" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: "#F8B486" }}>Video đã sẵn sàng</p>
                                <p className="text-[10px]" style={{ color: "#6a6f73" }}>Đã tải lên & xử lý HLS</p>
                              </div>
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { videoUrl: "", mediaAssetId: "" })}
                                className="p-1 rounded-lg hover:bg-white/5"><X className="w-3.5 h-3.5" style={{ color: "#6a6f73" }} /></button>
                            </div>
                          </div>
                        ) : (
                          <UploadZone
                            lesId={les.id} type="video" token={token}
                            onUploaded={(url, mediaAssetId) => updateLesson(sec.id, les.id, { videoUrl: url, mediaAssetId })}
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.avi"
                            icon={CloudUpload} title="Tải video lên" subtitle="MP4, WebM, MOV — tối đa 500MB"
                            accentColor="#F8B486" accentBg="rgba(248,180,134,0.06)"
                          />
                        )}
                      </div>

                      {/* ===== DOCUMENT ===== */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase" style={{ color: "#60a5fa" }}>
                          <FileText className="w-3.5 h-3.5" /> Tài liệu đính kèm
                        </label>

                        {les.documentUrl ? (
                          <div className="rounded-xl p-3" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.2)" }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.15)" }}>
                                <File className="w-4 h-4" style={{ color: "#60a5fa" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{les.documentOriginalName || "Tài liệu"}</p>
                                <p className="text-[10px]" style={{ color: "#6a6f73" }}>Đã tải lên</p>
                              </div>
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { documentUrl: "", documentOriginalName: "" })}
                                className="p-1 rounded-lg hover:bg-white/5"><X className="w-3.5 h-3.5" style={{ color: "#6a6f73" }} /></button>
                            </div>
                          </div>
                        ) : (
                          <UploadZone
                            lesId={les.id} type="file" token={token}
                            onUploaded={(url) => {
                              const name = url.split("/").pop() || "Tài liệu";
                              updateLesson(sec.id, les.id, { documentUrl: url, documentOriginalName: name });
                            }}
                            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
                            icon={FileText} title="Tải tài liệu lên" subtitle="PDF, Word, PPT, Excel — tối đa 50MB"
                            accentColor="#60a5fa" accentBg="rgba(96,165,250,0.06)"
                          />
                        )}
                      </div>

                      {/* ===== ASSIGNMENT IMAGE ===== */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase" style={{ color: "#a78bfa" }}>
                          <ImageIcon className="w-3.5 h-3.5" /> Ảnh đề bài tập
                        </label>

                        {les.assignmentImageUrl ? (
                          <div className="space-y-2">
                            <div className="relative w-full h-24 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(167,139,250,0.2)" }}>
                              <Image
                                src={les.assignmentImageUrl.startsWith("http") ? les.assignmentImageUrl : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace("/api/v1", "")}${les.assignmentImageUrl}`}
                                alt="Đề bài" fill unoptimized className="object-cover"
                              />
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { assignmentImageUrl: "" })}
                                className="absolute top-1.5 right-1.5 p-1 rounded-lg transition-colors"
                                style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <UploadZone
                            lesId={les.id} type="image" token={token}
                            onUploaded={(url) => updateLesson(sec.id, les.id, { assignmentImageUrl: url })}
                            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                            icon={ImageIcon} title="Tải ảnh đề bài" subtitle="JPG, PNG, WebP — tối đa 10MB"
                            accentColor="#a78bfa" accentBg="rgba(167,139,250,0.06)"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add lesson button */}
              <button type="button" onClick={() => addLesson(sec.id)}
                className="w-full py-3.5 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:border-[#FFCCAA] hover:bg-[rgba(255,204,170,0.04)]"
                style={{ borderColor: "var(--border)", color: "#FFCCAA" }}>
                <Plus className="w-4 h-4" /> Thêm bài học mới
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
