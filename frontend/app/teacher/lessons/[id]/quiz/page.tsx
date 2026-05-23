"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { ArrowLeft, Plus, Trash2, Save, Wand2, Loader2, ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Difficulty = "easy" | "medium" | "hard" | "mixed";
type Question = { id?: string; content: string; imageUrl?: string; options: string[]; answer: string; difficulty?: string };

const DIFF_LABELS: Record<Difficulty, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó", mixed: "Trộn lẫn" };
const DIFF_COLORS: Record<string, string> = { easy: "#10b981", medium: "#f59e0b", hard: "#ef4444", mixed: "#a435f0" };

export default function LessonQuizEditor() {
  const { id: lessonId } = useParams();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // AI state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<"text" | "file">("text");
  const [aiText, setAiText] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>("mixed");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { if (token && lessonId) fetchQuiz(); }, [token, lessonId]);

  async function fetchQuiz() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const lesson = await res.json();
      const assignment = lesson.assignments?.find((a: any) => a.type === "quiz");
      if (assignment) {
        setAssignmentId(assignment.id);
        setQuizTitle(assignment.title);
      }
      if (assignment?.quiz) {
        setQuizId(assignment.quiz.id);
        setTimeLimit(assignment.quiz.timeLimit || "");
        const qRes = await fetch(`${API}/quizzes/${assignment.quiz.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData.questions) {
            setQuestions(qData.questions.map((q: any) => {
              let opts: any[] = [];
              try { opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options; } catch {}
              return { id: q.id, content: q.content, imageUrl: q.imageUrl || "", options: opts.map((o: any) => o.text), answer: opts.find((o: any) => o.id === q.answer)?.text || "" };
            }));
          }
        }
      } else if (!assignment) { setQuizTitle("Bài tập cho bài học"); }
    } catch { toast.error("Lỗi tải dữ liệu"); } finally { setLoading(false); }
  }

  async function handleSaveQuiz() {
    if (!quizTitle.trim()) return toast.error("Vui lòng nhập tên bài tập");
    if (questions.length === 0) return toast.error("Vui lòng thêm ít nhất 1 câu hỏi");
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim() && !q.imageUrl) return toast.error(`Câu ${i + 1}: Cần có nội dung hoặc hình ảnh`);
      if (q.options.some(o => !o.trim())) return toast.error(`Câu ${i + 1}: Điền đầy đủ đáp án`);
      if (!q.answer) return toast.error(`Câu ${i + 1}: Chọn đáp án đúng`);
    }
    setSaving(true);
    try {
      let cid = quizId;
      let aid = assignmentId;
      if (!cid) {
        if (!aid) {
          const aRes = await fetch(`${API}/assignments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ lessonId, title: quizTitle, description: "", type: "quiz", maxScore: questions.length, minScore: 0 }) });
          if (!aRes.ok) {
            const d = await aRes.json().catch(() => ({}));
            throw new Error(d.message || "Lỗi tạo bài tập");
          }
          const aData = await aRes.json();
          aid = aData.id;
          setAssignmentId(aid);
        }
        const cRes = await fetch(`${API}/quizzes`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ assignmentId: aid, timeLimit: timeLimit ? Number(timeLimit) : undefined }) });
        if (!cRes.ok) throw new Error("Lỗi tạo quiz");
        const cData = await cRes.json();
        cid = cData.quiz?.id || cData.id;
        setQuizId(cid);
      }
      const makeOptions = (q: Question) => {
        const options = q.options.map(text => ({ id: crypto.randomUUID(), text }));
        const correct = options.find(option => option.text === q.answer) || options[0];
        return { options, answer: correct.id };
      };

      const existingQ = questions.filter(q => q.id);
      for (const q of existingQ) {
        const mapped = makeOptions(q);
        const res = await fetch(`${API}/questions/${q.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            content: q.content,
            imageUrl: q.imageUrl,
            options: mapped.options,
            answer: mapped.answer,
            score: 1,
          }),
        });
        if (!res.ok) throw new Error("Lỗi cập nhật câu hỏi");
      }

      const newQ = questions.filter(q => !q.id);
      if (newQ.length > 0) {
        const cleanQuestions = newQ.map(q => ({
          content: q.content,
          ...(q.imageUrl ? { imageUrl: q.imageUrl } : {}),
          options: q.options,
          answer: q.answer,
        }));
        const bRes = await fetch(`${API}/questions/bulk`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ quizId: cid, questions: cleanQuestions }) });
        if (!bRes.ok) throw new Error("Lỗi lưu câu hỏi");
      }
      toast.success("Đã lưu bài tập thành công!");
      fetchQuiz();
    } catch (err: any) { toast.error(err.message || "Lỗi lưu"); } finally { setSaving(false); }
  }

  async function handleAiGenerate() {
    if (aiMode === "text" && !aiText.trim()) return toast.error("Vui lòng dán nội dung tài liệu");
    if (aiMode === "file" && !aiFile) return toast.error("Vui lòng chọn file tài liệu");
    if (!token) return toast.error("Chưa đăng nhập");
    setAiLoading(true);
    try {
      let res: Response;
      if (aiMode === "file" && aiFile) {
        const fd = new FormData();
        fd.append("file", aiFile);
        fd.append("count", String(aiCount));
        fd.append("difficulty", aiDifficulty);
        res = await fetch(`${API}/ai/generate-quiz-from-file`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      } else {
        res = await fetch(`${API}/ai/generate-quiz`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ text: aiText, count: aiCount, difficulty: aiDifficulty }) });
      }
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Lỗi AI"); }
      const generated = await res.json();
      if (Array.isArray(generated)) {
        const mapped = generated.map(g => ({ content: g.question, options: g.options, answer: g.answer, difficulty: g.difficulty }));
        setQuestions(prev => [...prev, ...mapped]);
        toast.success(`AI đã sinh ${generated.length} câu hỏi`);
        setShowAiModal(false);
        setAiText("");
        setAiFile(null);
      }
    } catch (e: any) { toast.error(e.message || "Lỗi gọi AI"); } finally { setAiLoading(false); }
  }

  async function handleImageUpload(qIndex: number, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/upload/image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const newQ = [...questions];
      newQ[qIndex].imageUrl = data.url;
      setQuestions(newQ);
      toast.success("Đã tải ảnh lên");
    } catch { toast.error("Lỗi tải ảnh"); }
  }

  function updateQ(i: number, field: keyof Question, val: any) { const nq = [...questions]; (nq[i] as any)[field] = val; setQuestions(nq); }

  async function removeQuestion(qi: number) {
    const question = questions[qi];
    if (!question.id) {
      setQuestions(questions.filter((_, i) => i !== qi));
      return;
    }
    if (!confirm("Xóa câu hỏi này?")) return;
    try {
      const res = await fetch(`${API}/questions/${question.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Không xóa được câu hỏi");
      setQuestions(questions.filter((_, i) => i !== qi));
      toast.success("Đã xóa câu hỏi");
    } catch (error: any) {
      toast.error(error.message || "Lỗi xóa câu hỏi");
    }
  }

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" /></div>;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="pt-20 pb-28 max-w-4xl mx-auto px-4 sm:px-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#6a6f73] hover:text-[#a435f0] mb-6"><ArrowLeft className="w-4 h-4" /> Quay lại</button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">Quản lý Bài Tập Trắc Nghiệm</h1>
            <p className="text-sm text-[#6a6f73]">Tạo câu hỏi thủ công hoặc dùng AI trợ lý để sinh tự động.</p>
          </div>
          <button onClick={() => setShowAiModal(true)} className="btn-secondary flex items-center gap-2 shrink-0">
            <Wand2 className="w-4 h-4 text-[#a435f0]" />
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#a435f0] to-[#5624d0]">✨ AI Sinh Câu Hỏi</span>
          </button>
        </div>

        {/* Quiz Info */}
        <div className="card-base mb-6 space-y-4">
          <div><label className="text-sm font-bold block mb-1">Tên bài tập</label><input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="input-base w-full" placeholder="Ví dụ: Kiểm tra cuối khóa" /></div>
          <div><label className="text-sm font-bold block mb-1">Thời gian (phút)</label><input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value) || "")} className="input-base w-full max-w-[200px]" placeholder="Không giới hạn" /></div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={q.id || qi} className="card-base relative">
              {q.id && <span className="absolute top-3 right-3 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Đã lưu</span>}
              {q.difficulty && <span className="absolute top-3 right-20 text-xs font-bold px-2 py-0.5 rounded" style={{ color: DIFF_COLORS[q.difficulty] || "#6a6f73", background: (DIFF_COLORS[q.difficulty] || "#6a6f73") + "18" }}>{DIFF_LABELS[q.difficulty as Difficulty] || q.difficulty}</span>}
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold">Câu {qi + 1}</h3>
                <button onClick={() => removeQuestion(qi)} className="text-red-500 hover:bg-red-500/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>

              {/* Image upload area */}
              <div className="mb-3">
                {q.imageUrl ? (
                  <div className="relative inline-block">
                    <img src={q.imageUrl} alt="Question" className="max-h-48 rounded-xl border border-[var(--border)]" />
                    <button onClick={() => updateQ(qi, "imageUrl", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-sm text-[#6a6f73] cursor-pointer hover:text-[#a435f0] transition-colors">
                    <ImagePlus className="w-4 h-4" /> Thêm hình ảnh câu hỏi
                    <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(qi, e.target.files[0]); }} />
                  </label>
                )}
              </div>
              <textarea value={q.content} onChange={e => updateQ(qi, "content", e.target.value)} className="input-base w-full mb-3 min-h-[70px]" placeholder="Nhập câu hỏi (hoặc để trống nếu dùng ảnh)..." />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`a-${qi}`} checked={q.answer === opt && opt !== ""} onChange={() => { if (opt) updateQ(qi, "answer", opt); }} className="h-6 w-6 shrink-0 cursor-pointer accent-[#a435f0]" />
                    <input value={opt} onChange={e => { const nq = [...questions]; const old = nq[qi].options[oi]; nq[qi].options[oi] = e.target.value; if (nq[qi].answer === old) nq[qi].answer = e.target.value; setQuestions(nq); }} className="input-base w-full py-2 text-sm" placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setQuestions([...questions, { content: "", options: ["", "", "", ""], answer: "" }])} className="w-full mt-6 py-4 border-2 border-dashed border-[#d1d5db] rounded-xl text-[#6a6f73] font-bold flex items-center justify-center gap-2 hover:border-[#a435f0] hover:text-[#a435f0] transition-colors">
          <Plus className="w-5 h-5" /> Thêm câu hỏi thủ công
        </button>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--border)] z-10 flex justify-between items-center px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <span className="text-sm text-[#6a6f73]">{questions.length} câu hỏi • {questions.filter(q => !q.id).length} chưa lưu</span>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="btn-secondary">Hủy</button>
            <button onClick={handleSaveQuiz} disabled={saving} className="btn-primary min-w-[120px] justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Đang lưu..." : "Lưu bài tập"}
            </button>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-[var(--background)] w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-[var(--border)] overflow-hidden">
            {aiLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--background)]/95 px-6 text-center backdrop-blur-sm">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#a435f0]/10">
                  <Loader2 className="h-9 w-9 animate-spin text-[#a435f0]" />
                </div>
                <h3 className="text-lg font-extrabold">AI đang tạo câu hỏi</h3>
                <p className="mt-2 max-w-md text-sm text-[#6a6f73]">
                  Hệ thống đang đọc nội dung, phân tích ý chính và sinh {aiCount} câu hỏi. Quá trình này có thể mất một lúc với tài liệu dài.
                </p>
                <div className="mt-6 grid w-full max-w-md gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-[#a435f0]" />
                  </div>
                  <p className="text-xs font-semibold text-[#6a6f73]">Vui lòng giữ nguyên màn hình này...</p>
                </div>
              </div>
            )}
            <h2 className="text-xl font-extrabold flex items-center gap-2 mb-1"><Wand2 className="w-5 h-5 text-[#a435f0]" /> Trợ lý AI Sinh Câu Hỏi</h2>
            <p className="text-sm text-[#6a6f73] mb-4">Upload file tài liệu hoặc dán nội dung bài giảng để AI sinh câu hỏi tự động.</p>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-4">
              <button disabled={aiLoading} onClick={() => setAiMode("file")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-60 ${aiMode === "file" ? "bg-[#a435f0] text-white" : "bg-[var(--muted)] text-[#6a6f73]"}`}><Upload className="w-4 h-4 inline mr-1" /> Upload File</button>
              <button disabled={aiLoading} onClick={() => setAiMode("text")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-60 ${aiMode === "text" ? "bg-[#a435f0] text-white" : "bg-[var(--muted)] text-[#6a6f73]"}`}>Dán Văn Bản</button>
            </div>

            {/* Settings row */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-xs font-bold block mb-1">Số lượng câu hỏi</label>
                <input disabled={aiLoading} type="number" min={1} max={30} value={aiCount} onChange={e => setAiCount(Math.min(30, Math.max(1, Number(e.target.value))))} className="input-base w-full disabled:opacity-60" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold block mb-1">Mức độ khó</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(["easy", "medium", "hard", "mixed"] as Difficulty[]).map(d => (
                    <button key={d} disabled={aiLoading} onClick={() => setAiDifficulty(d)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60" style={{ background: aiDifficulty === d ? DIFF_COLORS[d] + "20" : "var(--muted)", color: aiDifficulty === d ? DIFF_COLORS[d] : "#6a6f73", border: `1.5px solid ${aiDifficulty === d ? DIFF_COLORS[d] : "transparent"}` }}>{DIFF_LABELS[d]}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content area */}
            {aiMode === "file" ? (
              <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center mb-4 hover:border-[#a435f0] transition-colors cursor-pointer" onClick={() => { if (!aiLoading) fileInputRef.current?.click(); }}>
                <input ref={fileInputRef} disabled={aiLoading} type="file" accept=".pdf,.docx,.pptx,.xlsx,.txt,.csv" className="hidden" onChange={e => { if (e.target.files?.[0]) setAiFile(e.target.files[0]); }} />
                {aiFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div className="text-left">
                      <p className="font-bold text-sm">{aiFile.name}</p>
                      <p className="text-xs text-[#6a6f73]">{(aiFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button disabled={aiLoading} onClick={e => { e.stopPropagation(); setAiFile(null); }} className="text-red-500 hover:bg-red-500/10 p-1 rounded disabled:opacity-60"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-2 text-[#a435f0]" />
                    <p className="font-bold text-sm">Kéo thả hoặc nhấp để chọn file</p>
                    <p className="text-xs text-[#6a6f73] mt-1">Hỗ trợ: PDF, DOCX, PPTX, XLSX, TXT, CSV (tối đa 10MB)</p>
                  </>
                )}
              </div>
            ) : (
              <textarea disabled={aiLoading} value={aiText} onChange={e => setAiText(e.target.value)} className="input-base w-full min-h-[200px] resize-none mb-4 disabled:opacity-60" placeholder="Dán nội dung tài liệu bài giảng tại đây..." />
            )}

            <div className="flex justify-end gap-3">
              <button disabled={aiLoading} onClick={() => { setShowAiModal(false); setAiFile(null); setAiText(""); }} className="btn-ghost disabled:opacity-60">Đóng</button>
              <button onClick={handleAiGenerate} disabled={aiLoading || (aiMode === "text" ? !aiText.trim() : !aiFile)} className="btn-primary bg-gradient-to-r from-[#a435f0] to-[#5624d0] disabled:opacity-50">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {aiLoading ? "AI đang phân tích..." : `Sinh ${aiCount} câu hỏi`}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
