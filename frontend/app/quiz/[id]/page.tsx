"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { CheckCircle2, XCircle, Clock, Award, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ParsedOption = { id: string; text: string };
type ParsedQuestion = { id: string; content: string; imageUrl?: string; options: ParsedOption[] };

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (token) fetchQuiz();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function fetchQuiz() {
    try {
      const [quizR, resultR] = await Promise.all([
        fetch(`${API}/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/quizzes/${id}/result`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (quizR.ok) {
        const data = await quizR.json();
        setQuiz(data);
        // Parse options from JSON string to array
        const parsed = (data.questions || []).map((q: any) => {
          let opts: ParsedOption[] = [];
          try {
            const raw = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
            opts = raw.map((o: any) => typeof o === "string" ? { id: o, text: o } : { id: o.id, text: o.text });
          } catch {}
          return { id: q.id, content: q.content, imageUrl: q.imageUrl, options: opts };
        });
        setParsedQuestions(parsed);
      }
      if (resultR.ok) setResult(await resultR.json());
    } catch {} finally { setLoading(false); }
  }

  async function submitQuiz() {
    setSubmitting(true);
    try {
      // Backend expects: { answers: [{ questionId, answerId }] }
      const formattedAnswers = Object.entries(answers).map(([questionId, answerId]) => ({
        questionId,
        answerId,
      }));

      const res = await fetch(`${API}/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers: formattedAnswers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        toast.success(`Hoàn thành! Điểm: ${data.score}/${data.maxScore}`);
      } else { const d = await res.json(); toast.error(d.message || "Lỗi nộp quiz"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSubmitting(false); }
  }

  const answeredCount = Object.keys(answers).length;
  const totalCount = parsedQuestions.length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#5624d0" }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-6" style={{ color: "#6a6f73" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại bài học
          </button>

          {result ? (
            /* ─── Result View ─── */
            <div className="card-base text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: result.percentage >= 50 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                {result.percentage >= 50
                  ? <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} />
                  : <XCircle className="w-10 h-10" style={{ color: "#ef4444" }} />}
              </div>
              <h1 className="text-2xl font-extrabold mb-2">{result.percentage >= 50 ? "Đạt! 🎉" : "Chưa đạt"}</h1>
              <p className="text-4xl font-extrabold mb-1" style={{ color: result.percentage >= 50 ? "#10b981" : "#ef4444" }}>
                {Math.round(result.percentage)}%
              </p>
              <p className="text-sm mb-6" style={{ color: "#6a6f73" }}>
                Đúng: {result.score}/{result.maxScore} điểm
              </p>

              {/* Review answers */}
              {result.questions && (
                <div className="text-left space-y-4 mt-6 border-t border-[var(--border)] pt-6">
                  <h3 className="font-bold text-sm">Đáp án chi tiết</h3>
                  {result.questions.map((q: any, qi: number) => {
                    let opts: ParsedOption[] = [];
                    try { opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options; } catch {}
                    const isCorrect = q.studentAnswer === q.correctAnswer;
                    return (
                      <div key={q.id} className="card-base" style={{ borderLeft: `3px solid ${isCorrect ? "#10b981" : "#ef4444"}` }}>
                        <p className="text-sm font-semibold mb-2">Câu {qi + 1}: {q.content}</p>
                        <div className="space-y-1.5">
                          {opts.map((opt: any) => {
                            const isAnswer = opt.id === q.correctAnswer;
                            const isChosen = opt.id === q.studentAnswer;
                            return (
                              <div key={opt.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{
                                background: isAnswer ? "rgba(16,185,129,0.1)" : isChosen ? "rgba(239,68,68,0.1)" : "var(--muted)",
                                border: `1px solid ${isAnswer ? "#10b981" : isChosen ? "#ef4444" : "transparent"}`,
                              }}>
                                {isAnswer && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#10b981" }} />}
                                {isChosen && !isAnswer && <XCircle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />}
                                {!isAnswer && !isChosen && <div className="w-4 h-4 shrink-0" />}
                                <span>{opt.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => router.back()} className="btn-primary text-sm">Quay lại bài học</button>
              </div>
            </div>
          ) : quiz ? (
            /* ─── Quiz Form ─── */
            <div>
              <div className="card-base mb-6">
                <h1 className="text-xl font-extrabold mb-1">{quiz.title || "Bài kiểm tra"}</h1>
                {quiz.description && <p className="text-sm" style={{ color: "#6a6f73" }}>{quiz.description}</p>}
                <div className="flex gap-4 mt-3 text-xs" style={{ color: "#6a6f73" }}>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {totalCount} câu hỏi</span>
                  {quiz.timeLimit && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.timeLimit} phút</span>}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {parsedQuestions.map((q, qi) => (
                  <div key={q.id} className="card-base">
                    <p className="text-sm font-semibold mb-1">Câu {qi + 1}: {q.content}</p>
                    {q.imageUrl && <img src={q.imageUrl} alt={`Câu ${qi + 1}`} className="max-h-56 rounded-xl border border-[var(--border)] mb-3 mt-2" />}
                    <div className="space-y-2 mt-3">
                      {q.options.map((opt, oi) => {
                        const isSelected = answers[q.id] === opt.id;
                        return (
                          <button key={opt.id || oi} onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm"
                            style={{
                              background: isSelected ? "rgba(124,58,237,0.12)" : "var(--muted)",
                              border: `1.5px solid ${isSelected ? "#a435f0" : "var(--border)"}`,
                            }}>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: isSelected ? "#a435f0" : "var(--border)" }}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#a435f0" }} />}
                            </div>
                            {opt.text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom sticky bar */}
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--background)] border-t border-[var(--border)] z-10 flex justify-between items-center px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                <span className="text-sm" style={{ color: "#6a6f73" }}>
                  Đã trả lời: <strong>{answeredCount}/{totalCount}</strong>
                </span>
                <button onClick={submitQuiz} disabled={submitting || answeredCount === 0}
                  className="btn-primary min-w-[140px] justify-center py-3 disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {submitting ? "Đang nộp..." : "Nộp bài"}
                </button>
              </div>
            </div>
          ) : (
            <div className="card-base text-center py-12">
              <p className="text-sm" style={{ color: "#6a6f73" }}>Không tìm thấy quiz</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
