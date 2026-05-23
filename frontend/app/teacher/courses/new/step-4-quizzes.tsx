"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileQuestion, Loader2, Plus, Trash2, Upload, Wand2, X } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Difficulty = "easy" | "medium" | "hard" | "mixed";

const difficulties: { value: Difficulty; label: string }[] = [
  { value: "mixed", label: "Trộn lẫn" },
  { value: "easy", label: "Dễ" },
  { value: "medium", label: "Vừa" },
  { value: "hard", label: "Khó" },
];

function emptyQuestion() {
  return { content: "", options: ["", "", "", ""], answer: "" };
}

export function Step4Quizzes({ sections, setSections, token }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeLesson, setActiveLesson] = useState<{ sectionId: string; lessonId: string } | null>(null);
  const [aiMode, setAiMode] = useState<"text" | "file">("text");
  const [aiText, setAiText] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("mixed");
  const [generating, setGenerating] = useState(false);

  const updateLesson = (sectionId: string, lessonId: string, updater: (lesson: any) => any) => {
    setSections((prev: any[]) => prev.map((section) => section.id === sectionId ? {
      ...section,
      lessons: section.lessons.map((lesson: any) => lesson.id === lessonId ? updater(lesson) : lesson),
    } : section));
  };

  const toggleQuiz = (sectionId: string, lessonId: string, enabled: boolean) => {
    updateLesson(sectionId, lessonId, (lesson) => ({
      ...lesson,
      quiz: enabled
        ? lesson.quiz || { title: `Quiz: ${lesson.title || "Bài học"}`, timeLimit: "", questions: [] }
        : undefined,
    }));
  };

  const addQuestion = (sectionId: string, lessonId: string) => {
    updateLesson(sectionId, lessonId, (lesson) => ({
      ...lesson,
      quiz: {
        ...(lesson.quiz || { title: `Quiz: ${lesson.title || "Bài học"}`, timeLimit: "" }),
        questions: [...(lesson.quiz?.questions || []), emptyQuestion()],
      },
    }));
  };

  const updateQuestion = (sectionId: string, lessonId: string, index: number, next: any) => {
    updateLesson(sectionId, lessonId, (lesson) => {
      const questions = [...(lesson.quiz?.questions || [])];
      questions[index] = { ...questions[index], ...next };
      return { ...lesson, quiz: { ...lesson.quiz, questions } };
    });
  };

  const removeQuestion = (sectionId: string, lessonId: string, index: number) => {
    updateLesson(sectionId, lessonId, (lesson) => ({
      ...lesson,
      quiz: { ...lesson.quiz, questions: lesson.quiz.questions.filter((_: any, i: number) => i !== index) },
    }));
  };

  const active = activeLesson
    ? sections.flatMap((s: any) => s.lessons.map((l: any) => ({ section: s, lesson: l })))
        .find((item: any) => item.section.id === activeLesson.sectionId && item.lesson.id === activeLesson.lessonId)
    : null;

  async function generateWithAi() {
    if (!activeLesson) return;
    if (aiMode === "text" && !aiText.trim()) return toast.error("Vui lòng dán nội dung bài học");
    if (aiMode === "file" && !aiFile) return toast.error("Vui lòng chọn file tài liệu");
    if (!token) return toast.error("Chưa đăng nhập");

    setGenerating(true);
    try {
      let res: Response;
      if (aiMode === "file" && aiFile) {
        const form = new FormData();
        form.append("file", aiFile);
        form.append("count", String(aiCount));
        form.append("difficulty", aiDifficulty);
        res = await fetch(`${API}/ai/generate-quiz-from-file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
      } else {
        res = await fetch(`${API}/ai/generate-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: aiText, count: aiCount, difficulty: aiDifficulty }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Không sinh được câu hỏi");
      }

      const generated = await res.json();
      const questions = Array.isArray(generated)
        ? generated.map((item: any) => ({
            content: item.question || item.content || "",
            options: Array.isArray(item.options) ? item.options.slice(0, 4) : ["", "", "", ""],
            answer: item.answer || "",
            difficulty: item.difficulty,
          }))
        : [];

      updateLesson(activeLesson.sectionId, activeLesson.lessonId, (lesson) => ({
        ...lesson,
        quiz: {
          ...(lesson.quiz || { title: `Quiz: ${lesson.title || "Bài học"}`, timeLimit: "" }),
          questions: [...(lesson.quiz?.questions || []), ...questions],
        },
      }));
      toast.success(`AI đã sinh ${questions.length} câu hỏi. Vui lòng duyệt trước khi lưu.`);
      setAiText("");
      setAiFile(null);
      setActiveLesson(null);
    } catch (error: any) {
      toast.error(error.message || "Lỗi gọi AI");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6 animate-scale-in">
      <h3 className="font-bold text-lg flex items-center gap-2 px-2">
        <FileQuestion className="w-5 h-5" style={{ color: "#a435f0" }} /> Bước 4: Tạo quiz cho bài học
      </h3>

      {sections.map((section: any, si: number) => (
        <div key={section.id} className="card-base">
          <h4 className="font-bold text-sm mb-4">Chương {si + 1}: {section.title || "Chưa có tên"}</h4>
          <div className="space-y-4">
            {section.lessons.map((lesson: any, li: number) => {
              const enabled = Boolean(lesson.quiz);
              const questions = lesson.quiz?.questions || [];
              return (
                <div key={lesson.id} className="p-4 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-sm">{li + 1}. {lesson.title || "Bài học chưa có tên"}</p>
                      <p className="text-xs" style={{ color: "#6a6f73" }}>{questions.length} câu hỏi đã duyệt</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => toggleQuiz(section.id, lesson.id, !enabled)} className={enabled ? "btn-secondary text-xs" : "btn-primary text-xs"}>
                        {enabled ? "Bỏ quiz" : "Thêm quiz"}
                      </button>
                      {enabled && (
                        <button type="button" onClick={() => setActiveLesson({ sectionId: section.id, lessonId: lesson.id })} className="btn-secondary text-xs">
                          <Wand2 className="w-3.5 h-3.5" /> AI tạo câu hỏi
                        </button>
                      )}
                    </div>
                  </div>

                  {enabled && (
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                        <input
                          value={lesson.quiz.title}
                          onChange={(e) => updateLesson(section.id, lesson.id, (l) => ({ ...l, quiz: { ...l.quiz, title: e.target.value } }))}
                          className="input-base w-full"
                          placeholder="Tên quiz"
                        />
                        <input
                          type="number"
                          value={lesson.quiz.timeLimit || ""}
                          onChange={(e) => updateLesson(section.id, lesson.id, (l) => ({ ...l, quiz: { ...l.quiz, timeLimit: e.target.value } }))}
                          className="input-base w-full"
                          placeholder="Phút"
                        />
                      </div>

                      {questions.map((question: any, qi: number) => (
                        <div key={qi} className="p-3 rounded-lg bg-[var(--background)] border border-[var(--border)]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-xs">Câu {qi + 1}</p>
                            <button type="button" onClick={() => removeQuestion(section.id, lesson.id, qi)} className="btn-ghost px-2 py-1">
                              <Trash2 className="w-4 h-4" style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                          <textarea value={question.content} onChange={(e) => updateQuestion(section.id, lesson.id, qi, { content: e.target.value })} className="input-base w-full min-h-[70px] mb-3" placeholder="Nội dung câu hỏi" />
                          <div className="grid gap-2 md:grid-cols-2">
                            {question.options.map((option: string, oi: number) => (
                              <label key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`${lesson.id}-${qi}`}
                                  checked={question.answer === option && option !== ""}
                                  onChange={() => updateQuestion(section.id, lesson.id, qi, { answer: option })}
                                  className="h-6 w-6 shrink-0 cursor-pointer accent-[#a435f0]"
                                />
                                <input
                                  value={option}
                                  onChange={(e) => {
                                    const options = [...question.options];
                                    const old = options[oi];
                                    options[oi] = e.target.value;
                                    updateQuestion(section.id, lesson.id, qi, { options, answer: question.answer === old ? e.target.value : question.answer });
                                  }}
                                  className="input-base w-full text-sm py-2"
                                  placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button type="button" onClick={() => addQuestion(section.id, lesson.id)} className="btn-ghost w-full justify-center border-2 border-dashed py-3" style={{ borderColor: "var(--border)" }}>
                        <Plus className="w-4 h-4" /> Thêm câu hỏi thủ công
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-[var(--background)] border border-[var(--border)] p-6 shadow-2xl">
            {generating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--background)]/95 px-6 text-center backdrop-blur-sm">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#a435f0]/10">
                  <Loader2 className="h-9 w-9 animate-spin text-[#a435f0]" />
                </div>
                <h4 className="text-lg font-extrabold">AI đang tạo câu hỏi</h4>
                <p className="mt-2 max-w-md text-sm" style={{ color: "#6a6f73" }}>
                  Hệ thống đang đọc nội dung, phân tích ý chính và sinh {aiCount} câu hỏi. Tài liệu dài có thể cần thêm thời gian.
                </p>
                <div className="mt-6 w-full max-w-md">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[#a435f0]" />
                  </div>
                  <p className="mt-2 text-xs font-semibold" style={{ color: "#6a6f73" }}>Vui lòng giữ nguyên màn hình này...</p>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h4 className="font-extrabold flex items-center gap-2"><Wand2 className="w-5 h-5 text-[#a435f0]" /> AI tạo quiz</h4>
                <p className="text-sm mt-1" style={{ color: "#6a6f73" }}>{active.lesson.title || "Bài học"}</p>
              </div>
              <button type="button" disabled={generating} onClick={() => setActiveLesson(null)} className="btn-ghost px-2 py-2 disabled:opacity-60"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex gap-2 mb-4">
              <button type="button" disabled={generating} onClick={() => setAiMode("text")} className={aiMode === "text" ? "btn-primary text-sm disabled:opacity-60" : "btn-secondary text-sm disabled:opacity-60"}>Dán text</button>
              <button type="button" disabled={generating} onClick={() => setAiMode("file")} className={aiMode === "file" ? "btn-primary text-sm disabled:opacity-60" : "btn-secondary text-sm disabled:opacity-60"}><Upload className="w-4 h-4" /> Upload file</button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[120px_1fr] mb-4">
              <input disabled={generating} type="number" min={1} max={30} value={aiCount} onChange={(e) => setAiCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} className="input-base disabled:opacity-60" />
              <div className="flex gap-2 flex-wrap">
                {difficulties.map((item) => (
                  <button key={item.value} type="button" disabled={generating} onClick={() => setAiDifficulty(item.value)} className={aiDifficulty === item.value ? "btn-primary text-xs disabled:opacity-60" : "btn-secondary text-xs disabled:opacity-60"}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {aiMode === "text" ? (
              <textarea disabled={generating} value={aiText} onChange={(e) => setAiText(e.target.value)} className="input-base w-full min-h-[220px] mb-4 disabled:opacity-60" placeholder="Dán nội dung bài học để Gemini tạo câu hỏi..." />
            ) : (
              <button type="button" disabled={generating} onClick={() => fileRef.current?.click()} className="w-full min-h-[180px] mb-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 disabled:opacity-60" style={{ borderColor: "var(--border)" }}>
                <input ref={fileRef} disabled={generating} type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv" className="hidden" onChange={(e) => setAiFile(e.target.files?.[0] || null)} />
                {aiFile ? <><CheckCircle2 className="w-8 h-8 text-green-500" /><span className="font-bold text-sm">{aiFile.name}</span></> : <><Upload className="w-8 h-8 text-[#a435f0]" /><span className="font-bold text-sm">Chọn file PDF, DOCX, PPTX, XLSX, TXT hoặc CSV</span></>}
              </button>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" disabled={generating} onClick={() => setActiveLesson(null)} className="btn-secondary disabled:opacity-60">Hủy</button>
              <button type="button" onClick={generateWithAi} disabled={generating} className="btn-primary">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {generating ? "Đang sinh..." : "Sinh câu hỏi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
