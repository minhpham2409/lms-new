"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileQuestion,
  Loader2,
  RotateCcw,
  Send,
  Target,
  XCircle,
} from "lucide-react";
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
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const passed = result ? result.percentage >= 80 : false;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-[var(--card)] px-3 py-2 text-sm font-bold text-foreground-muted transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Quay lại bài học
          </button>

          {result ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="rounded-xl border border-border bg-[var(--card)] p-6 shadow-sm md:p-8">
                <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${passed ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {passed ? <CheckCircle2 className="h-9 w-9" /> : <XCircle className="h-9 w-9" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Kết quả bài kiểm tra</p>
                      <h1 className="mt-1 text-3xl font-extrabold">{passed ? "Đạt yêu cầu" : "Chưa đạt yêu cầu"}</h1>
                      <p className="mt-2 text-sm text-foreground-muted">Yêu cầu tối thiểu 80% để hoàn thành quiz.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-[var(--background-2)] px-6 py-4 text-center">
                    <p className={`text-4xl font-extrabold ${passed ? "text-green-500" : "text-red-500"}`}>{Math.round(result.percentage)}%</p>
                    <p className="mt-1 text-xs font-bold text-foreground-muted">{result.score}/{result.maxScore} điểm</p>
                  </div>
                </div>

                {result.questions && (
                  <div className="border-t border-border pt-6">
                    <h2 className="mb-4 text-lg font-extrabold">Đáp án chi tiết</h2>
                    <div className="space-y-4">
                      {result.questions.map((q: any, qi: number) => {
                        let opts: ParsedOption[] = [];
                        try { opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options; } catch {}
                        const isCorrect = q.studentAnswer === q.correctAnswer;
                        return (
                          <div key={q.id} className={`rounded-xl border bg-[var(--background)] p-5 ${isCorrect ? "border-green-500/40" : "border-red-500/40"}`}>
                            <div className="mb-4 flex items-start gap-3">
                              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Câu {qi + 1}</p>
                                <p className="mt-1 font-bold">{q.content}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {opts.map((opt: any, oi: number) => {
                                const isAnswer = opt.id === q.correctAnswer;
                                const isChosen = opt.id === q.studentAnswer;
                                return (
                                  <div key={opt.id} className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                                    isAnswer
                                      ? "border-green-500/40 bg-green-500/10"
                                      : isChosen
                                        ? "border-red-500/40 bg-red-500/10"
                                        : "border-border bg-[var(--card)]"
                                  }`}>
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                                      isAnswer ? "bg-green-500 text-white" : isChosen ? "bg-red-500 text-white" : "bg-[var(--muted)] text-foreground-muted"
                                    }`}>
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                    {isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                                    {isChosen && !isAnswer && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm">
                <h2 className="font-extrabold">Tiếp theo</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {passed ? "Bạn đã đạt yêu cầu. Có thể quay lại bài học để tiếp tục." : "Bạn có thể làm lại để đạt mức tối thiểu 80%."}
                </p>
                <div className="mt-5 space-y-2">
                  {!passed && (
                    <button onClick={() => { setResult(null); setAnswers({}); }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-bold transition-colors hover:bg-muted">
                      <RotateCcw className="h-4 w-4" /> Làm lại
                    </button>
                  )}
                  <button onClick={() => router.back()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]">
                    Quay lại bài học <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </aside>
            </div>
          ) : quiz ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <main>
                <section className="mb-6 rounded-xl border border-border bg-[var(--card)] p-6 shadow-sm">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                        <FileQuestion className="h-4 w-4" />
                        Quiz
                      </div>
                      <h1 className="text-2xl md:text-3xl font-extrabold">{quiz.title || "Bài kiểm tra"}</h1>
                      {quiz.description && <p className="mt-2 max-w-2xl text-sm text-foreground-muted">{quiz.description}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                      <div className="rounded-xl border border-border bg-[var(--background-2)] p-4">
                        <Award className="mb-2 h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xl font-extrabold">{totalCount}</p>
                        <p className="text-xs font-semibold text-foreground-muted">Câu hỏi</p>
                      </div>
                      <div className="rounded-xl border border-border bg-[var(--background-2)] p-4">
                        <Clock className="mb-2 h-4 w-4 text-[var(--primary)]" />
                        <p className="text-xl font-extrabold">{quiz.timeLimit || "--"}</p>
                        <p className="text-xs font-semibold text-foreground-muted">Phút</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-foreground-muted">
                      <span>Tiến độ trả lời</span>
                      <span>{answeredCount}/{totalCount} câu</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                      <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </section>

                <div className="space-y-5">
                  {parsedQuestions.map((q, qi) => (
                    <section key={q.id} id={`question-${qi + 1}`} className="rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm md:p-6">
                      <div className="mb-4 flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)] text-sm font-extrabold text-[var(--primary)]">
                          {qi + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-foreground-muted">Câu hỏi {qi + 1}</p>
                          <h2 className="mt-1 text-base font-extrabold leading-relaxed">{q.content}</h2>
                        </div>
                      </div>
                      {q.imageUrl && <img src={q.imageUrl} alt={`Câu ${qi + 1}`} className="mb-4 max-h-72 rounded-xl border border-border object-contain" />}
                      <div className="grid gap-3">
                        {q.options.map((opt, oi) => {
                          const isSelected = answers[q.id] === opt.id;
                          return (
                            <button key={opt.id || oi} onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                              className={`group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                                isSelected
                                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                  : "border-border bg-[var(--background)] hover:border-[var(--primary)]/60"
                              }`}>
                              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
                                isSelected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-foreground-muted group-hover:text-foreground"
                              }`}>
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt.text}</span>
                              {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--primary)]" />}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </main>

              <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-border bg-[var(--card)] p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[var(--primary)]" />
                  <h2 className="font-extrabold">Bảng câu hỏi</h2>
                </div>
                <p className="mt-2 text-sm text-foreground-muted">Chọn số câu để di chuyển nhanh.</p>
                <div className="mt-5 grid grid-cols-5 gap-2">
                  {parsedQuestions.map((q, qi) => {
                    const done = Boolean(answers[q.id]);
                    return (
                      <a
                        key={q.id}
                        href={`#question-${qi + 1}`}
                        className={`flex h-10 items-center justify-center rounded-lg border text-sm font-extrabold transition-colors ${
                          done
                            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "border-border bg-[var(--background)] text-foreground-muted hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {qi + 1}
                      </a>
                    );
                  })}
                </div>
                <div className="mt-5 rounded-lg border border-border bg-[var(--background-2)] p-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span>Đã trả lời</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                {answeredCount < totalCount && (
                  <div className="mt-4 flex gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Bạn vẫn có thể nộp bài, nhưng nên trả lời đủ các câu trước.</span>
                  </div>
                )}
                <button onClick={submitQuiz} disabled={submitting || answeredCount === 0}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? "Đang nộp..." : "Nộp bài"}
                </button>
              </aside>

              <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-[var(--card)]/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-foreground-muted">Đã trả lời</p>
                    <p className="text-sm font-extrabold">{answeredCount}/{totalCount} câu</p>
                  </div>
                  <button onClick={submitQuiz} disabled={submitting || answeredCount === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-[var(--card)] py-16 text-center shadow-sm">
              <FileQuestion className="mx-auto mb-3 h-10 w-10 text-foreground-muted" />
              <p className="font-bold">Không tìm thấy quiz</p>
              <p className="mt-1 text-sm text-foreground-muted">Quiz có thể đã bị xóa hoặc bạn chưa có quyền truy cập.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
