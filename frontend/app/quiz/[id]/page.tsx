"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { CheckCircle2, XCircle, Clock, Award, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (token) fetchQuiz(); }, [id, token]);

  async function fetchQuiz() {
    try {
      const [quizR, attemptsR, resultR] = await Promise.all([
        fetch(`${API}/quizzes/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/quizzes/${id}/attempts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/quizzes/${id}/result`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (quizR.ok) setQuiz(await quizR.json());
      if (attemptsR.ok) setAttempts(await attemptsR.json());
      if (resultR.ok) setResult(await resultR.json());
    } catch {} finally { setLoading(false); }
  }

  async function submitQuiz() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        toast.success(`Hoàn thành! Điểm: ${data.score || data.percentage || "—"}`);
      } else { const d = await res.json(); toast.error(d.message || "Lỗi nộp quiz"); }
    } catch { toast.error("Lỗi kết nối"); }
    finally { setSubmitting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </button>

          {result ? (
            /* Result view */
            <div className="card-base text-center py-12">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: result.passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)" }}>
                {result.passed ? <CheckCircle2 className="w-10 h-10" style={{ color: "#10b981" }} /> : <XCircle className="w-10 h-10" style={{ color: "#ef4444" }} />}
              </div>
              <h1 className="text-2xl font-extrabold mb-2">{result.passed ? "Đạt!" : "Chưa đạt"}</h1>
              <p className="text-4xl font-extrabold gradient-text mb-2">{result.score ?? result.percentage ?? "—"}%</p>
              <p className="text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
                Đúng: {result.correctCount ?? "—"}/{result.totalQuestions ?? quiz?.questions?.length ?? "—"}
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-secondary text-sm">Làm lại</button>
                <button onClick={() => router.back()} className="btn-primary text-sm">Quay lại bài học</button>
              </div>

              {attempts.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-bold text-sm mb-3">Lịch sử ({attempts.length})</h3>
                  <div className="space-y-2">
                    {attempts.map((a: any, i: number) => (
                      <div key={a.id || i} className="flex justify-between px-4 py-2 rounded-lg" style={{ background: "var(--muted)" }}>
                        <span className="text-xs">Lần {i + 1} — {new Date(a.createdAt).toLocaleDateString("vi-VN")}</span>
                        <span className="text-xs font-bold">{a.score ?? a.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : quiz ? (
            /* Quiz form */
            <div>
              <div className="card-base mb-6">
                <h1 className="text-xl font-extrabold mb-1">{quiz.title}</h1>
                {quiz.description && <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{quiz.description}</p>}
                <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
                  <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {quiz.questions?.length || 0} câu hỏi</span>
                  {quiz.timeLimit && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {quiz.timeLimit} phút</span>}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {quiz.questions?.map((q: any, qi: number) => (
                  <div key={q.id} className="card-base">
                    <p className="text-sm font-semibold mb-3">Câu {qi + 1}: {q.text || q.question}</p>
                    <div className="space-y-2">
                      {(q.options || q.choices || []).map((opt: any, oi: number) => {
                        const optValue = typeof opt === "string" ? opt : opt.text || opt.value;
                        const isSelected = answers[q.id] === optValue;
                        return (
                          <button key={oi} onClick={() => setAnswers({ ...answers, [q.id]: optValue })}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm"
                            style={{
                              background: isSelected ? "rgba(124,58,237,0.12)" : "var(--muted)",
                              border: `1.5px solid ${isSelected ? "#7c3aed" : "var(--border)"}`,
                            }}>
                            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: isSelected ? "#7c3aed" : "var(--border)" }}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#7c3aed" }} />}
                            </div>
                            {optValue}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={submitQuiz} disabled={submitting || Object.keys(answers).length === 0}
                className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} Nộp bài
              </button>
            </div>
          ) : (
            <div className="card-base text-center py-12">
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Không tìm thấy quiz</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
