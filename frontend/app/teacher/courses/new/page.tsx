"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, BookOpen, Play,
  FileText, Image, ChevronDown, ChevronUp, DollarSign, Tag, Users,
  Clock, Award, Settings, Upload, Layers, CheckCircle2, Info,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "assignment" | "quiz" | "reading";
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  expanded: boolean;
}

const categories = ["Toán", "Lý", "Hóa", "Anh văn", "Ngữ văn", "Tin học", "Sinh học", "Lịch sử", "Địa lý"];
const levels = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Tất cả"];
const lessonTypes = [
  { value: "video" as const, label: "Video bài giảng", icon: Play, color: "#7c3aed" },
  { value: "assignment" as const, label: "Bài tập", icon: FileText, color: "#0891b2" },
  { value: "quiz" as const, label: "Kiểm tra", icon: CheckCircle2, color: "#10b981" },
  { value: "reading" as const, label: "Tài liệu đọc", icon: BookOpen, color: "#f59e0b" },
];

let sectionCounter = 0;
let lessonCounter = 0;

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("0");
  const [sections, setSections] = useState<Section[]>([]);
  const [prerequisite, setPrerequisite] = useState("");
  const [hasCertificate, setHasCertificate] = useState(true);
  const [saving, setSaving] = useState(false);

  const addSection = () => {
    sectionCounter++;
    setSections([...sections, {
      id: `sec-${sectionCounter}`,
      title: "",
      lessons: [],
      expanded: true,
    }]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const updateSectionTitle = (sectionId: string, newTitle: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s));
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, expanded: !s.expanded } : s));
  };

  const addLesson = (sectionId: string, type: Lesson["type"]) => {
    lessonCounter++;
    setSections(sections.map(s => s.id === sectionId ? {
      ...s,
      lessons: [...s.lessons, { id: `les-${lessonCounter}`, title: "", type }],
    } : s));
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections(sections.map(s => s.id === sectionId ? {
      ...s,
      lessons: s.lessons.filter(l => l.id !== lessonId),
    } : s));
  };

  const updateLessonTitle = (sectionId: string, lessonId: string, newTitle: string) => {
    setSections(sections.map(s => s.id === sectionId ? {
      ...s,
      lessons: s.lessons.map(l => l.id === lessonId ? { ...l, title: newTitle } : l),
    } : s));
  };

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Call API to create course
    setTimeout(() => {
      setSaving(false);
      router.push("/teacher");
    }, 1500);
  };

  const steps = [
    { num: 1, label: "Thông tin cơ bản" },
    { num: 2, label: "Nội dung khóa học" },
    { num: 3, label: "Cài đặt & Xuất bản" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/teacher" className="flex items-center gap-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-extrabold">Tạo khóa học mới</h1>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setStep(s.num as 1 | 2 | 3)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full"
                  style={{
                    background: step === s.num ? "rgba(124,58,237,0.15)" : step > s.num ? "rgba(16,185,129,0.1)" : "var(--muted)",
                    border: `1px solid ${step === s.num ? "rgba(124,58,237,0.3)" : step > s.num ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
                    color: step === s.num ? "#a78bfa" : step > s.num ? "#10b981" : "var(--foreground-muted)",
                  }}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                    background: step === s.num ? "#7c3aed" : step > s.num ? "#10b981" : "var(--muted)",
                    color: step >= s.num ? "#fff" : "var(--foreground-muted)",
                  }}>
                    {step > s.num ? "✓" : s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div className="w-8 h-px flex-shrink-0" style={{ background: step > s.num ? "#10b981" : "var(--border)" }} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="card-base">
                <h3 className="font-bold mb-5 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} /> Thông tin cơ bản
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tên khóa học <span style={{ color: "#ef4444" }}>*</span></label>
                    <input
                      value={title} onChange={(e) => setTitle(e.target.value)}
                      className="input-base" placeholder="VD: Toán học cơ bản — Lớp 6"
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Tên nên ngắn gọn, rõ ràng và thu hút</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mô tả khóa học <span style={{ color: "#ef4444" }}>*</span></label>
                    <textarea
                      value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={5} className="input-base resize-none"
                      placeholder="Mô tả chi tiết những gì học sinh sẽ học được từ khóa học này..."
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>{description.length}/500 ký tự</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Danh mục <span style={{ color: "#ef4444" }}>*</span></label>
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
                        <option value="">Chọn danh mục</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Cấp độ <span style={{ color: "#ef4444" }}>*</span></label>
                      <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-base">
                        <option value="">Chọn cấp độ</option>
                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Giá (VNĐ)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--foreground-muted)" }} />
                        <input
                          type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                          className="input-base pl-9" placeholder="0 = Miễn phí"
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--foreground-muted)" }}>Nhập 0 để tạo khóa học miễn phí</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Ảnh bìa</label>
                      <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-[#7c3aed] transition-colors" style={{ borderColor: "var(--border)" }}>
                        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--foreground-muted)" }} />
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Kéo thả hoặc click để tải ảnh</p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--foreground-muted)" }}>PNG, JPG (tối đa 2MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary" disabled={!title || !description || !category || !level}>
                  Tiếp tục <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Curriculum */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5" style={{ color: "#7c3aed" }} /> Chương trình học
                </h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <span>{sections.length} chương</span>
                  <span>{totalLessons} bài học</span>
                </div>
              </div>

              {sections.length === 0 && (
                <div className="card-base text-center py-12">
                  <Layers className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--foreground-muted)" }} />
                  <h3 className="font-bold mb-2">Chưa có nội dung</h3>
                  <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>Bắt đầu bằng cách thêm chương đầu tiên cho khóa học</p>
                  <button onClick={addSection} className="btn-primary">
                    <Plus className="w-4 h-4" /> Thêm chương đầu tiên
                  </button>
                </div>
              )}

              {sections.map((sec, si) => (
                <div key={sec.id} className="card-base">
                  <div className="flex items-center gap-3 mb-2">
                    <GripVertical className="w-4 h-4 cursor-grab flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                      Chương {si + 1}
                    </span>
                    <input
                      value={sec.title}
                      onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
                      className="input-base flex-1 text-sm font-semibold py-2"
                      placeholder="Tên chương (VD: Giới thiệu khóa học)"
                    />
                    <button onClick={() => toggleSection(sec.id)} className="btn-ghost px-2 py-1.5">
                      {sec.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => removeSection(sec.id)} className="btn-ghost px-2 py-1.5">
                      <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                    </button>
                  </div>

                  {sec.expanded && (
                    <div className="ml-7 mt-3 space-y-2">
                      {sec.lessons.map((l) => {
                        const typeInfo = lessonTypes.find(t => t.value === l.type) || lessonTypes[0];
                        return (
                          <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                            <GripVertical className="w-3 h-3 cursor-grab flex-shrink-0" style={{ color: "var(--foreground-muted)" }} />
                            <typeInfo.icon className="w-4 h-4 flex-shrink-0" style={{ color: typeInfo.color }} />
                            <input
                              value={l.title}
                              onChange={(e) => updateLessonTitle(sec.id, l.id, e.target.value)}
                              className="flex-1 bg-transparent text-sm outline-none"
                              style={{ color: "var(--foreground)" }}
                              placeholder={`Tên bài ${typeInfo.label.toLowerCase()}`}
                            />
                            <span className="badge text-[10px]" style={{
                              background: `${typeInfo.color}18`,
                              color: typeInfo.color,
                              border: `1px solid ${typeInfo.color}33`,
                            }}>
                              {typeInfo.label}
                            </span>
                            <button onClick={() => removeLesson(sec.id, l.id)} className="btn-ghost px-1.5 py-1">
                              <Trash2 className="w-3 h-3" style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Add lesson buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {lessonTypes.map((t) => (
                          <button key={t.value} onClick={() => addLesson(sec.id, t.value)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                            style={{ background: `${t.color}12`, color: t.color, border: `1px dashed ${t.color}44` }}
                          >
                            <Plus className="w-3 h-3" /> {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {sections.length > 0 && (
                <button onClick={addSection} className="btn-secondary w-full justify-center">
                  <Plus className="w-4 h-4" /> Thêm chương mới
                </button>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary">
                  <ChevronDown className="w-4 h-4 rotate-90" /> Quay lại
                </button>
                <button onClick={() => setStep(3)} className="btn-primary" disabled={sections.length === 0}>
                  Tiếp tục <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Settings & Publish */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="card-base">
                <h3 className="font-bold mb-5 flex items-center gap-2">
                  <Settings className="w-5 h-5" style={{ color: "#7c3aed" }} /> Cài đặt khóa học
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Yêu cầu tiên quyết</label>
                    <textarea
                      value={prerequisite} onChange={(e) => setPrerequisite(e.target.value)}
                      rows={3} className="input-base resize-none"
                      placeholder="VD: Cần hoàn thành khóa Toán lớp 5, biết cơ bản về số tự nhiên..."
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5" style={{ color: "#f59e0b" }} />
                      <div>
                        <p className="text-sm font-semibold">Cấp chứng chỉ hoàn thành</p>
                        <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>Học sinh sẽ nhận chứng chỉ khi hoàn thành khóa học</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHasCertificate(!hasCertificate)}
                      className="w-12 h-6 rounded-full transition-all relative"
                      style={{ background: hasCertificate ? "#7c3aed" : "var(--border)" }}
                    >
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all"
                        style={{ left: hasCertificate ? "calc(100% - 22px)" : "2px" }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card-base" style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.2)" }}>
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" style={{ color: "#7c3aed" }} /> Tóm tắt khóa học
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4" style={{ color: "#a78bfa" }} /> <strong>{title || "—"}</strong></div>
                  <div className="flex items-center gap-2"><Tag className="w-4 h-4" style={{ color: "#0891b2" }} /> {category || "—"} • {level || "—"}</div>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" style={{ color: "#10b981" }} /> {Number(price) > 0 ? `${Number(price).toLocaleString()} ₫` : "Miễn phí"}</div>
                  <div className="flex items-center gap-2"><Layers className="w-4 h-4" style={{ color: "#f59e0b" }} /> {sections.length} chương, {totalLessons} bài học</div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">
                  <ChevronDown className="w-4 h-4 rotate-90" /> Quay lại
                </button>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn-secondary" disabled={saving}>
                    <Save className="w-4 h-4" /> Lưu nháp
                  </button>
                  <button onClick={handleSave} className="btn-primary" disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang tạo...
                      </span>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Tạo & Xuất bản</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
