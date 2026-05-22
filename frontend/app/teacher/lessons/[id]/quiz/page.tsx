"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Wand2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Question = {
  id?: string;
  content: string;
  options: string[];
  answer: string;
};

export default function LessonQuizEditor() {
  const { id: lessonId } = useParams();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Quiz Info
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (token && lessonId) fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, lessonId]);

  async function fetchQuiz() {
    setLoading(true);
    try {
      // First get the lesson to find assignmentId/quizId
      const res = await fetch(`${API}/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const lesson = await res.json();
      
      const assignment = lesson.assignments?.[0];
      if (assignment?.quiz) {
        setQuizId(assignment.quiz.id);
        setQuizTitle(assignment.title);
        setTimeLimit(assignment.quiz.timeLimit || "");
        
        // Fetch questions
        const qRes = await fetch(`${API}/quizzes/${assignment.quiz.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (qRes.ok) {
          const qData = await qRes.json();
          if (qData.questions) {
            setQuestions(qData.questions.map((q: any) => {
              let opts = [];
              try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch {}
              return {
                id: q.id,
                content: q.content,
                options: opts.map((o: any) => o.text),
                answer: opts.find((o: any) => o.id === q.answer)?.text || opts[0]?.text || "",
              };
            }));
          }
        }
      } else {
        setQuizTitle(`Bài tập cho bài học`);
      }
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveQuiz() {
    if (!quizTitle.trim()) return toast.error("Vui lòng nhập tên bài tập");
    if (questions.length === 0) return toast.error("Vui lòng thêm ít nhất 1 câu hỏi");

    setSaving(true);
    try {
      let currentQuizId = quizId;

      // 1. Create Quiz if not exists
      if (!currentQuizId) {
        const cRes = await fetch(`${API}/quizzes`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            lessonId,
            title: quizTitle,
            description: "",
            timeLimit: timeLimit ? Number(timeLimit) : undefined,
          }),
        });
        if (!cRes.ok) throw new Error("Lỗi tạo quiz");
        const cData = await cRes.json();
        currentQuizId = cData.quiz.id;
        setQuizId(currentQuizId);
      }

      // 2. Save new questions in bulk
      const newQuestions = questions.filter(q => !q.id);
      if (newQuestions.length > 0) {
        const bRes = await fetch(`${API}/questions/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            quizId: currentQuizId,
            questions: newQuestions,
          }),
        });
        if (!bRes.ok) throw new Error("Lỗi lưu câu hỏi");
      }

      toast.success("Đã lưu bài tập thành công!");
      fetchQuiz(); // Refresh to get IDs
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu bài tập");
    } finally {
      setSaving(false);
    }
  }

  async function handleAiGenerate() {
    if (!aiText.trim()) return toast.error("Vui lòng dán nội dung tài liệu");
    setAiLoading(true);
    try {
      const res = await fetch(`${API}/ai/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: aiText, count: 5 }),
      });
      if (!res.ok) throw new Error("Lỗi AI");
      const generated = await res.json();
      
      if (Array.isArray(generated)) {
        setQuestions([...questions, ...generated]);
        toast.success(`Đã sinh ${generated.length} câu hỏi`);
        setShowAiModal(false);
        setAiText("");
      }
    } catch {
      toast.error("Lỗi gọi AI. Vui lòng thử lại.");
    } finally {
      setAiLoading(false);
    }
  }

  function addEmptyQuestion() {
    setQuestions([
      ...questions,
      { content: "", options: ["", "", "", ""], answer: "" }
    ]);
  }

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <div className="pt-20 pb-24 max-w-4xl mx-auto px-4 sm:px-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-[#6a6f73] hover:text-[#a435f0] mb-6">
          <ArrowLeft className="w-4 h-4" /> Quay lại bài học
        </button>

        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">Tạo / Sửa Bài Tập Trắc Nghiệm</h1>
            <p className="text-sm text-[#6a6f73]">Xây dựng ngân hàng câu hỏi nhanh chóng với AI trợ lý.</p>
          </div>
          <button onClick={() => setShowAiModal(true)} className="btn-secondary flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[#a435f0]" /> <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#a435f0] to-[#5624d0]">AI Sinh Câu Hỏi</span>
          </button>
        </div>

        {/* General Info */}
        <div className="card-base mb-6 space-y-4">
          <div>
            <label className="text-sm font-bold block mb-1">Tên bài tập</label>
            <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className="input-base w-full" placeholder="Ví dụ: Kiểm tra cuối khóa" />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1">Thời gian làm bài (Phút)</label>
            <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value) || "")} className="input-base w-full max-w-[200px]" placeholder="Bỏ trống nếu không giới hạn" />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id || qIndex} className="card-base relative group">
              {q.id && <span className="absolute top-4 right-4 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md">Đã lưu</span>}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Câu hỏi {qIndex + 1}</h3>
                {!q.id && (
                  <button onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} className="btn-ghost px-2 py-1 text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <textarea 
                value={q.content} 
                onChange={(e) => {
                  const newQ = [...questions];
                  newQ[qIndex].content = e.target.value;
                  setQuestions(newQ);
                }}
                disabled={!!q.id}
                className="input-base w-full mb-4 min-h-[80px]" 
                placeholder="Nhập nội dung câu hỏi..." 
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name={`answer-${qIndex}`} 
                      checked={q.answer === opt && opt !== ""}
                      disabled={!!q.id}
                      onChange={() => {
                        if (opt) {
                          const newQ = [...questions];
                          newQ[qIndex].answer = opt;
                          setQuestions(newQ);
                        }
                      }}
                      className="w-4 h-4 accent-[#a435f0]"
                    />
                    <input 
                      value={opt}
                      disabled={!!q.id}
                      onChange={(e) => {
                        const newQ = [...questions];
                        newQ[qIndex].options[optIndex] = e.target.value;
                        // update answer if it was selected
                        if (newQ[qIndex].answer === q.options[optIndex]) {
                          newQ[qIndex].answer = e.target.value;
                        }
                        setQuestions(newQ);
                      }}
                      className="input-base w-full py-2 text-sm"
                      placeholder={`Lựa chọn ${String.fromCharCode(65 + optIndex)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addEmptyQuestion} className="w-full mt-6 py-4 border-2 border-dashed border-[#d1d5db] rounded-xl text-[#6a6f73] font-bold flex items-center justify-center gap-2 hover:border-[#a435f0] hover:text-[#a435f0] transition-colors">
          <Plus className="w-5 h-5" /> Thêm câu hỏi thủ công
        </button>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--border)] z-10 flex justify-end gap-3 px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <button onClick={() => router.back()} className="btn-secondary">Hủy</button>
          <button onClick={handleSaveQuiz} disabled={saving} className="btn-primary min-w-[120px] justify-center">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Đang lưu..." : "Lưu bài tập"}
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card-spotlight bg-[var(--background)] w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative">
            <h2 className="text-xl font-extrabold flex items-center gap-2 mb-2">
              <Wand2 className="w-5 h-5 text-[#a435f0]" /> Trợ lý AI Sinh Câu Hỏi
            </h2>
            <p className="text-sm text-[#6a6f73] mb-4">
              Dán nội dung bài giảng, văn bản hoặc tài liệu vào đây. AI sẽ tự động đọc hiểu và trích xuất ra các câu hỏi trắc nghiệm chất lượng.
            </p>
            
            <textarea 
              value={aiText} 
              onChange={e => setAiText(e.target.value)}
              className="input-base w-full min-h-[250px] resize-none mb-4"
              placeholder="Dán nội dung tài liệu tại đây (Hỗ trợ tiếng Việt)..."
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAiModal(false)} className="btn-ghost">Đóng</button>
              <button onClick={handleAiGenerate} disabled={aiLoading || !aiText.trim()} className="btn-primary bg-[#5624d0] hover:bg-[#4a1eaa]">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {aiLoading ? "AI Đang suy nghĩ..." : "Bắt đầu sinh câu hỏi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
