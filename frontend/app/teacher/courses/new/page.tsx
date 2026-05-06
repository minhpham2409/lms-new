"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ArrowLeft, Save, Plus, Trash2, BookOpen, Play,
  FileText, ChevronDown, ChevronUp, DollarSign,
  Upload, Layers, CheckCircle2, Loader2, Youtube, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const categories = ["Toán", "Lý", "Hóa", "Anh văn", "Ngữ văn", "Tin học", "Sinh học", "Lịch sử"];
const levels = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Tất cả"];
const lessonTypes = [
  { value: "video" as const, label: "Video (YouTube)", icon: Youtube, color: "#ef4444" },
  { value: "reading" as const, label: "Tài liệu đọc", icon: FileText, color: "#f59e0b" },
  { value: "quiz" as const, label: "Trắc nghiệm", icon: HelpCircle, color: "#10b981" },
  { value: "essay" as const, label: "Bài tập tự luận", icon: BookOpen, color: "#0891b2" },
];

interface QuizQuestion {
  content: string;
  options: string[];
  answer: string;
  score: number;
}

interface LessonDraft {
  id: string;
  title: string;
  type: "video" | "reading" | "quiz" | "essay";
  videoUrl?: string;
  content?: string;
  quizQuestions?: QuizQuestion[];
  essayContent?: string;
}

interface SectionDraft {
  id: string;
  title: string;
  lessons: LessonDraft[];
  expanded: boolean;
}

let counter = 0;
const uid = () => `tmp-${++counter}`;

export default function CreateCoursePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  // Course info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("0");

  // Sections & lessons
  const [sections, setSections] = useState<SectionDraft[]>([]);

  // Currently editing lesson
  const [editingLesson, setEditingLesson] = useState<{ sectionId: string; lessonId: string } | null>(null);

  const addSection = () => setSections([...sections, { id: uid(), title: "", lessons: [], expanded: true }]);
  const removeSection = (id: string) => setSections(sections.filter(s => s.id !== id));
  const updateSectionTitle = (id: string, t: string) => setSections(sections.map(s => s.id === id ? { ...s, title: t } : s));
  const toggleSection = (id: string) => setSections(sections.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));

  const addLesson = (secId: string, type: LessonDraft["type"]) => {
    const lesson: LessonDraft = { id: uid(), title: "", type, quizQuestions: type === "quiz" ? [] : undefined };
    setSections(sections.map(s => s.id === secId ? { ...s, lessons: [...s.lessons, lesson] } : s));
  };

  const removeLesson = (secId: string, lesId: string) => {
    setSections(sections.map(s => s.id === secId ? { ...s, lessons: s.lessons.filter(l => l.id !== lesId) } : s));
    if (editingLesson?.lessonId === lesId) setEditingLesson(null);
  };

  const updateLesson = (secId: string, lesId: string, update: Partial<LessonDraft>) => {
    setSections(sections.map(s => s.id === secId ? {
      ...s, lessons: s.lessons.map(l => l.id === lesId ? { ...l, ...update } : l)
    } : s));
  };

  const getLesson = (secId: string, lesId: string) => sections.find(s => s.id === secId)?.lessons.find(l => l.id === lesId);
  const editLesson = editingLesson ? getLesson(editingLesson.sectionId, editingLesson.lessonId) : null;

  // Add quiz question
  const addQuestion = (secId: string, lesId: string) => {
    const lesson = getLesson(secId, lesId);
    if (!lesson) return;
    const q: QuizQuestion = { content: "", options: ["", "", "", ""], answer: "0", score: 1 };
    updateLesson(secId, lesId, { quizQuestions: [...(lesson.quizQuestions || []), q] });
  };

  const updateQuestion = (secId: string, lesId: string, qi: number, update: Partial<QuizQuestion>) => {
    const lesson = getLesson(secId, lesId);
    if (!lesson?.quizQuestions) return;
    const qs = [...lesson.quizQuestions];
    qs[qi] = { ...qs[qi], ...update };
    updateLesson(secId, lesId, { quizQuestions: qs });
  };

  const removeQuestion = (secId: string, lesId: string, qi: number) => {
    const lesson = getLesson(secId, lesId);
    if (!lesson?.quizQuestions) return;
    updateLesson(secId, lesId, { quizQuestions: lesson.quizQuestions.filter((_, i) => i !== qi) });
  };

  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);

  async function handleSave(publish: boolean) {
    if (!title.trim()) { toast.error("Vui lòng nhập tên khóa học"); return; }
    if (!token) { toast.error("Chưa đăng nhập"); return; }
    setSaving(true);

    try {
      // 1. Create course
      const courseRes = await fetch(`${API}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          status: publish ? "published" : "draft",
        }),
      });
      if (!courseRes.ok) {
        const err = await courseRes.json();
        throw new Error(err.message || "Lỗi tạo khóa học");
      }
      const course = await courseRes.json();

      // 2. Create sections & lessons sequentially
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];
        if (!sec.title.trim()) continue;

        const secRes = await fetch(`${API}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: sec.title.trim(), courseId: course.id, order: si + 1 }),
        });
        if (!secRes.ok) continue;
        const savedSection = await secRes.json();

        for (let li = 0; li < sec.lessons.length; li++) {
          const les = sec.lessons[li];
          if (!les.title.trim()) continue;

          // Build lesson content
          let content = les.content || "";
          if (les.type === "essay" && les.essayContent) content = les.essayContent;

          const lesRes = await fetch(`${API}/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              title: les.title.trim(),
              sectionId: savedSection.id,
              content,
              videoUrl: les.type === "video" ? les.videoUrl : undefined,
            }),
          });
          if (!lesRes.ok) continue;
          const savedLesson = await lesRes.json();

          // Create assignment if quiz or essay
          if (les.type === "quiz" || les.type === "essay") {
            try {
              await fetch(`${API}/assignments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  title: les.title.trim(),
                  lessonId: savedLesson.id,
                  type: les.type,
                  description: les.type === "essay" ? les.essayContent : "Trắc nghiệm",
                }),
              });
            } catch {}
          }
        }
      }

      toast.success(publish ? "Khóa học đã xuất bản!" : "Đã lưu nháp!");
      router.push("/teacher");
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo khóa học");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="btn-ghost px-2 py-2"><ArrowLeft className="w-4 h-4" /></Link>
              <h1 className="text-xl font-extrabold">Tạo khóa học mới</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu nháp
              </button>
              <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary text-sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Xuất bản
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Main form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="card-base">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thông tin khóa học
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Tên khóa học *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="input-base" placeholder="VD: Toán học cơ bản — Lớp 6" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Mô tả</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="input-base resize-none" placeholder="Mô tả chi tiết khóa học..." />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Danh mục</label>
                      <select value={category} onChange={e => setCategory(e.target.value)} className="input-base">
                        <option value="">Chọn</option>
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Cấp độ</label>
                      <select value={level} onChange={e => setLevel(e.target.value)} className="input-base">
                        <option value="">Chọn</option>
                        {levels.map(l => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Giá (VNĐ)</label>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-base" placeholder="0 = Miễn phí" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Curriculum */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5" style={{ color: "#7c3aed" }} /> Nội dung ({sections.length} chương, {totalLessons} bài)
                  </h3>
                  <button onClick={addSection} className="btn-secondary text-xs"><Plus className="w-3 h-3" /> Thêm chương</button>
                </div>

                {sections.length === 0 && (
                  <div className="card-base text-center py-10">
                    <Layers className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--foreground-muted)" }} />
                    <p className="text-sm mb-3" style={{ color: "var(--foreground-muted)" }}>Chưa có nội dung</p>
                    <button onClick={addSection} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Thêm chương đầu tiên</button>
                  </div>
                )}

                <div className="space-y-3">
                  {sections.map((sec, si) => (
                    <div key={sec.id} className="card-base">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>CH.{si+1}</span>
                        <input value={sec.title} onChange={e => updateSectionTitle(sec.id, e.target.value)} className="input-base flex-1 text-sm font-semibold py-1.5" placeholder="Tên chương" />
                        <button onClick={() => toggleSection(sec.id)} className="btn-ghost px-1.5 py-1">
                          {sec.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button onClick={() => removeSection(sec.id)} className="btn-ghost px-1.5 py-1"><Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} /></button>
                      </div>

                      {sec.expanded && (
                        <div className="ml-6 space-y-2 mt-2">
                          {sec.lessons.map(l => {
                            const t = lessonTypes.find(lt => lt.value === l.type)!;
                            const isEditing = editingLesson?.sectionId === sec.id && editingLesson.lessonId === l.id;
                            return (
                              <div key={l.id}>
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer" onClick={() => setEditingLesson(isEditing ? null : { sectionId: sec.id, lessonId: l.id })}
                                  style={{ background: isEditing ? "rgba(124,58,237,0.1)" : "var(--muted)", border: `1px solid ${isEditing ? "rgba(124,58,237,0.3)" : "var(--border)"}` }}>
                                  <t.icon className="w-4 h-4 flex-shrink-0" style={{ color: t.color }} />
                                  <input value={l.title} onChange={e => { e.stopPropagation(); updateLesson(sec.id, l.id, { title: e.target.value }); }}
                                    onClick={e => e.stopPropagation()} className="flex-1 bg-transparent text-sm outline-none" placeholder={`Tên ${t.label.toLowerCase()}`} />
                                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.color}18`, color: t.color }}>{t.label}</span>
                                  <button onClick={e => { e.stopPropagation(); removeLesson(sec.id, l.id); }} className="btn-ghost px-1 py-0.5"><Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} /></button>
                                </div>

                                {/* Inline editor */}
                                {isEditing && (
                                  <div className="ml-6 mt-2 p-3 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                                    {l.type === "video" && (
                                      <div>
                                        <label className="block text-xs font-semibold mb-1">Link YouTube</label>
                                        <input value={l.videoUrl || ""} onChange={e => updateLesson(sec.id, l.id, { videoUrl: e.target.value })}
                                          className="input-base text-sm" placeholder="https://youtube.com/watch?v=..." />
                                      </div>
                                    )}
                                    {l.type === "reading" && (
                                      <div>
                                        <label className="block text-xs font-semibold mb-1">Nội dung tài liệu</label>
                                        <textarea value={l.content || ""} onChange={e => updateLesson(sec.id, l.id, { content: e.target.value })}
                                          rows={5} className="input-base text-sm resize-none" placeholder="Nhập nội dung hoặc paste link file PDF, DOC..." />
                                        <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>Hỗ trợ: paste nội dung text hoặc link file PDF/DOC</p>
                                      </div>
                                    )}
                                    {l.type === "essay" && (
                                      <div>
                                        <label className="block text-xs font-semibold mb-1">Đề bài tự luận</label>
                                        <textarea value={l.essayContent || ""} onChange={e => updateLesson(sec.id, l.id, { essayContent: e.target.value })}
                                          rows={4} className="input-base text-sm resize-none" placeholder="Nhập đề bài hoặc paste link file đề..." />
                                        <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>Học sinh nộp bài → Giáo viên chấm điểm trong mục Quản lý</p>
                                      </div>
                                    )}
                                    {l.type === "quiz" && (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <label className="text-xs font-semibold">Câu hỏi trắc nghiệm ({l.quizQuestions?.length || 0})</label>
                                          <button onClick={() => addQuestion(sec.id, l.id)} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
                                            <Plus className="w-3 h-3" /> Thêm câu
                                          </button>
                                        </div>
                                        {(l.quizQuestions || []).map((q, qi) => (
                                          <div key={qi} className="p-3 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                                            <div className="flex items-start gap-2 mb-2">
                                              <span className="text-xs font-bold mt-1" style={{ color: "#10b981" }}>C{qi+1}.</span>
                                              <input value={q.content} onChange={e => updateQuestion(sec.id, l.id, qi, { content: e.target.value })}
                                                className="input-base flex-1 text-sm py-1.5" placeholder="Nội dung câu hỏi" />
                                              <button onClick={() => removeQuestion(sec.id, l.id, qi)} className="btn-ghost px-1 py-1"><Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 ml-5">
                                              {q.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-1.5">
                                                  <input type="radio" name={`q-${sec.id}-${l.id}-${qi}`} checked={q.answer === String(oi)}
                                                    onChange={() => updateQuestion(sec.id, l.id, qi, { answer: String(oi) })} className="accent-[#10b981]" />
                                                  <input value={opt} onChange={e => {
                                                    const opts = [...q.options]; opts[oi] = e.target.value;
                                                    updateQuestion(sec.id, l.id, qi, { options: opts });
                                                  }} className="input-base flex-1 text-xs py-1" placeholder={`Đáp án ${String.fromCharCode(65+oi)}`} />
                                                </div>
                                              ))}
                                            </div>
                                            <p className="text-[10px] ml-5 mt-1" style={{ color: "var(--foreground-muted)" }}>Chọn radio = đáp án đúng</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Add lesson buttons */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {lessonTypes.map(t => (
                              <button key={t.value} onClick={() => addLesson(sec.id, t.value)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:scale-105"
                                style={{ background: `${t.color}10`, color: t.color, border: `1px dashed ${t.color}44` }}>
                                <Plus className="w-2.5 h-2.5" /> {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right sidebar: Summary */}
            <div>
              <div className="card-base sticky top-24">
                <h3 className="font-bold mb-4 text-sm">Tóm tắt</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Tên</span><span className="font-medium truncate max-w-[140px]">{title || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Danh mục</span><span>{category || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Cấp độ</span><span>{level || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Giá</span><span className="font-medium">{Number(price) > 0 ? `${Number(price).toLocaleString()} ₫` : "Miễn phí"}</span></div>
                  <div className="divider" />
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Chương</span><span className="font-bold">{sections.length}</span></div>
                  <div className="flex justify-between"><span style={{ color: "var(--foreground-muted)" }}>Bài học</span><span className="font-bold">{totalLessons}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
