"use client";
import { useState, useRef, useCallback } from "react";
import { Play, Plus, Trash2, Upload, FileText, Image as ImageIcon, Video, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function UploadButton({
  lesId, type, token, onUploaded, uploading, setUploading, accept, label, color
}: {
  lesId: string; type: "video" | "image" | "file"; token: string;
  onUploaded: (url: string) => void; uploading: Record<string, boolean>;
  setUploading: (fn: (prev: any) => any) => void;
  accept: string; label: string; color: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const key = `${lesId}-${type}`;
  const isUploading = uploading[key];

  const waitForVideoJob = async (jobId: string): Promise<string | null> => {
    for (let attempt = 0; attempt < 180; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const res = await fetch(`${API}/upload/video/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) continue;

      const data = await res.json();
      if (data.status === "completed" && data.url) return data.url;
      if (data.status === "failed") {
        toast.error(data.error || "Lỗi xử lý video");
        return null;
      }
    }

    toast.error("Xử lý video quá lâu, vui lòng thử lại sau");
    return null;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((prev: any) => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/upload/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || (data.jobId ? await waitForVideoJob(data.jobId) : null);
        if (!url) {
          toast.error("Server không trả về URL file");
          return;
        }

        onUploaded(url);
        toast.success(type === "video" ? "Video đã xử lý xong!" : "Tải lên thành công!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Lỗi tải lên — kiểm tra định dạng file");
      }
    } catch {
      toast.error("Lỗi kết nối đến server");
    } finally {
      setUploading((prev: any) => ({ ...prev, [key]: false }));
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="btn-secondary w-full text-xs py-2 justify-center gap-1.5"
        style={{ borderColor: color, color: isUploading ? undefined : color, opacity: isUploading ? 0.7 : 1 }}
      >
        {isUploading ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Đang tải lên...</>
        ) : (
          <><Upload className="w-3 h-3" /> {label}</>
        )}
      </button>
    </>
  );
}

/** Check if a videoUrl is a YouTube link */
function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url);
}

/** Check if a videoUrl was set by the upload callback (not a YouTube link) */
function isUploadedVideo(url: string): boolean {
  if (!url) return false;
  return !isYouTubeUrl(url);
}

export function Step3Lessons({ sections, setSections, token }: any) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const addLesson = (secId: string) => {
    setSections((prev: any[]) => prev.map(s => s.id === secId ? {
      ...s, expanded: true,
      lessons: [...s.lessons, { id: `les-${Date.now()}`, title: "", videoUrl: "", documentUrl: "", documentOriginalName: "", assignmentImageUrl: "" }]
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
      <h3 className="font-bold text-lg flex items-center gap-2 px-2">
        <Play className="w-5 h-5" style={{ color: "#f59e0b" }} /> Bước 3: Bài giảng & Nội dung
      </h3>

      {sections.map((sec: any, si: number) => (
        <div key={sec.id} className="card-base" style={{ borderColor: sec.expanded ? "#f59e0b" : "var(--border)" }}>
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection(sec.id)}>
            <h4 className="font-bold flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ background: "#f59e0b" }}>{si + 1}</span>
              {sec.title || "Chương chưa có tên"}
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{sec.lessons.length} bài học</span>
              <span className="btn-ghost px-1 py-1">{sec.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
            </div>
          </div>

          {sec.expanded && (
            <div className="space-y-4 mt-4 pt-4" style={{ borderTop: "1px dashed var(--border)" }}>
              {sec.lessons.map((les: any, li: number) => (
                <div key={les.id} className="p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start gap-3">
                    <span className="font-bold text-sm mt-3 min-w-[20px]">{li + 1}.</span>
                    <div className="flex-1 space-y-3">
                      <input
                        value={les.title}
                        onChange={(e) => updateLesson(sec.id, les.id, { title: e.target.value })}
                        placeholder="Tên bài học (VD: Bài 1: Giới thiệu)"
                        className="input-base w-full"
                      />

                      <div className="grid md:grid-cols-3 gap-3">
                        {/* ===== VIDEO ===== */}
                        <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <label className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#ef4444" }}>
                            <Video className="w-3.5 h-3.5" /> Video bài giảng
                          </label>

                          {/* YouTube input */}
                          <input
                            placeholder="Link YouTube (https://youtube.com/...)"
                            value={isUploadedVideo(les.videoUrl) ? "" : les.videoUrl}
                            onChange={(e) => updateLesson(sec.id, les.id, { videoUrl: e.target.value })}
                            className="input-base text-xs py-1.5 w-full"
                          />

                          <div className="text-[10px] text-center" style={{ color: "var(--foreground-muted)" }}>— hoặc —</div>

                          {/* File upload */}
                          {isUploadedVideo(les.videoUrl) ? (
                            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />
                              <span className="text-[10px] truncate flex-1" style={{ color: "#ef4444" }}>Video đã tải lên</span>
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { videoUrl: "" })}
                                className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Xóa</button>
                            </div>
                          ) : (
                            <UploadButton
                              lesId={les.id} type="video" token={token}
                              onUploaded={(url) => updateLesson(sec.id, les.id, { videoUrl: url })}
                              uploading={uploading} setUploading={setUploading}
                              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,.mp4,.webm,.mov,.avi"
                              label="Tải video từ máy" color="#ef4444"
                            />
                          )}
                        </div>

                        {/* ===== DOCUMENT ===== */}
                        <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <label className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#3b82f6" }}>
                            <FileText className="w-3.5 h-3.5" /> Tài liệu đính kèm
                          </label>
                          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>PDF, Word, Text (tối đa 50MB)</p>

                          {les.documentUrl ? (
                            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#3b82f6" }} />
                              <span className="text-[10px] truncate flex-1" style={{ color: "#3b82f6" }}>
                                {les.documentOriginalName || "Tài liệu đã tải lên"}
                              </span>
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { documentUrl: "", documentOriginalName: "" })}
                                className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Xóa</button>
                            </div>
                          ) : (
                            <UploadButton
                              lesId={les.id} type="file" token={token}
                              onUploaded={(url) => {
                                // Extract filename from URL
                                const name = url.split("/").pop() || "Tài liệu";
                                updateLesson(sec.id, les.id, { documentUrl: url, documentOriginalName: name });
                              }}
                              uploading={uploading} setUploading={setUploading}
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              label="Chọn file tài liệu" color="#3b82f6"
                            />
                          )}
                        </div>

                        {/* ===== ASSIGNMENT IMAGE ===== */}
                        <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                          <label className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#10b981" }}>
                            <ImageIcon className="w-3.5 h-3.5" /> Ảnh đề bài tập
                          </label>
                          <p className="text-[10px]" style={{ color: "var(--foreground-muted)" }}>Học sinh nộp bài bằng ảnh chụp</p>

                          {les.assignmentImageUrl ? (
                            <div className="space-y-1.5">
                              <div className="relative w-full h-20 rounded-lg overflow-hidden border border-white/10">
                                <Image
                                  src={les.assignmentImageUrl.startsWith("http") ? les.assignmentImageUrl : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace("/api/v1", "")}${les.assignmentImageUrl}`}
                                  alt="Đề bài" fill className="object-cover"
                                />
                              </div>
                              <button type="button" onClick={() => updateLesson(sec.id, les.id, { assignmentImageUrl: "" })}
                                className="text-[10px] w-full text-center" style={{ color: "#ef4444" }}>Xóa ảnh</button>
                            </div>
                          ) : (
                            <UploadButton
                              lesId={les.id} type="image" token={token}
                              onUploaded={(url) => updateLesson(sec.id, les.id, { assignmentImageUrl: url })}
                              uploading={uploading} setUploading={setUploading}
                              accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                              label="Chọn ảnh đề bài" color="#10b981"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => removeLesson(sec.id, les.id)} className="btn-ghost px-2 py-2 mt-2">
                      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => addLesson(sec.id)}
                className="btn-ghost w-full justify-center border-2 border-dashed py-3" style={{ borderColor: "var(--border)" }}>
                <Plus className="w-4 h-4" /> Thêm bài học mới
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
