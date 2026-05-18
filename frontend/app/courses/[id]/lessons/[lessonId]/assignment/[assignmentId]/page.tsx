"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, CheckCircle2, XCircle, Target, Send, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-state";
import { toast } from "sonner";
import { assignmentsApi, quizzesApi } from "@/lib/api-service";
import type { Assignment, QuizAttempt } from "@/types";

export default function AssignmentPage() {
  const { id, lessonId, assignmentId } = useParams();
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchAssignment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, assignmentId, authLoading]);

  async function fetchAssignment() {
    try {
      const data = await assignmentsApi.getById(assignmentId as string);
      setAssignment(data);
      // If it's a quiz, check if already submitted
      if (data.type === 'quiz' && data.quiz) {
        try {
          const res = await quizzesApi.getResult(data.quiz.id);
          if (res && res.score !== undefined) {
             setResult(res);
             setSubmitted(true);
          }
        } catch (e) {
          // No attempt yet
        }
      }
    } catch (e) {
      toast.error("Lỗi lấy thông tin bài tập.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!assignment || !assignment.quiz) return;
    setSubmitting(true);
    try {
      const answersPayload = Object.keys(answers).map(qId => ({
        questionId: qId,
        answerId: answers[qId]
      }));
      const res = await quizzesApi.submit(assignment.quiz.id, { answers: answersPayload });
      setResult(res);
      setSubmitted(true);
      toast.success("Đã nộp bài thành công!");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi nộp bài");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fa]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5624d0]" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fa]">
         <p>Không tìm thấy bài tập.</p>
      </div>
    );
  }

  const questions = assignment.quiz?.questions || [];
  const maxScore = assignment.maxScore || 100;

  return (
    <div className="min-h-screen bg-[#f7f9fa] dark:bg-[#1c1d1f]">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#d1d7dc] dark:border-[#3e4143] bg-white dark:bg-[#2d2f31]">
        <Link href={`/courses/${id}/lessons/${lessonId}`} className="flex items-center gap-1 text-sm text-[#6a6f73] hover:text-[#5624d0]">
          <ChevronLeft className="w-4 h-4" /> Quay lại bài học
        </Link>
        <div className="flex items-center gap-2 text-sm text-[#6a6f73]">
          <Clock className="w-4 h-4" />
          <span>{assignment.quiz?.timeLimit ? `${assignment.quiz.timeLimit} phút` : "Không giới hạn"}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f7f9fa] dark:bg-[#3e4143] border border-[#d1d7dc] dark:border-[#6a6f73] rounded-full text-xs font-bold text-[#2d2f31] dark:text-white mb-3">
             <Target className="w-3.5 h-3.5 text-[#5624d0]" /> Bài tập / Quiz
          </div>
          <h1 className="text-2xl font-extrabold mb-2 text-[#2d2f31] dark:text-white">{assignment.title}</h1>
          <p className="text-sm text-[#6a6f73]">{questions.length} câu hỏi trắc nghiệm</p>
        </div>

        {/* Score card if submitted */}
        {submitted && result && (
          <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded-2xl p-6 mb-8 text-center shadow-sm">
            <div className="text-4xl font-extrabold mb-2">
              <span className={result.score >= maxScore * 0.7 ? "text-[#10b981]" : "text-[#f59e0b]"}>
                {result.score}/{maxScore}
              </span>
            </div>
            <p className="text-sm mb-4 text-[#6a6f73]">
              {result.score === maxScore ? "🎉 Xuất sắc! Hoàn hảo!" : result.score >= maxScore * 0.7 ? "👍 Tốt lắm!" : "💪 Cố gắng thêm nhé!"}
            </p>
            {/* Some backends might not return breakdown if not saved, we can add a retry if allowed */}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q: any, qi: number) => {
             // breakdown might be provided by getResult if already submitted
             let isCorrect = false;
             let isWrong = false;
             const selectedAns = answers[q.id];

             if (submitted && result?.breakdown) {
                const bd = result.breakdown.find((b: any) => b.question === q.content);
                if (bd) {
                   isCorrect = bd.correct;
                   isWrong = !bd.correct;
                   // Just show whether it was correct or wrong. The backend doesn't necessarily tell us which option they picked in breakdown unless modified
                }
             }

             let opts = [];
             try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch { opts = []; }

             return (
              <div key={q.id} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded-xl p-6 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold bg-[#f7f9fa] dark:bg-[#1c1d1f] text-[#2d2f31] dark:text-white">
                    {qi + 1}
                  </span>
                  <p className="font-semibold pt-1 text-[#2d2f31] dark:text-white flex-1">{q.content}</p>
                  {submitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-[#10b981]" />}
                  {submitted && isWrong && <XCircle className="w-5 h-5 text-[#ef4444]" />}
                </div>
                <div className="space-y-2 ml-11">
                  {opts.map((opt: any, oi: number) => {
                    const optText = typeof opt === 'string' ? opt : opt.text;
                    const optId = typeof opt === 'string' ? opt.charAt(0) : opt.id;
                    const selected = answers[q.id] === optId;

                    return (
                      <button
                        key={oi}
                        disabled={submitted}
                        onClick={() => setAnswers({ ...answers, [q.id]: optId })}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all border ${selected ? 'border-[#5624d0] bg-[rgba(86,36,208,0.05)]' : 'border-[#d1d7dc] dark:border-[#3e4143] hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143]'}`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected ? 'bg-[#5624d0] text-white' : 'bg-[#f7f9fa] dark:bg-[#1c1d1f] text-[#6a6f73]'}`}>
                          {optId}
                        </span>
                        <span className={`flex-1 ${selected ? 'text-[#2d2f31] font-medium dark:text-white' : 'text-[#6a6f73] dark:text-[#b0b5b9]'}`}>
                          {optText.substring(3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
             );
          })}
        </div>

        {/* Submit */}
        {!submitted && (
          <div className="mt-8 text-center">
            {Object.keys(answers).length < questions.length && (
              <p className="text-xs mb-3 flex items-center justify-center gap-1 text-[#f59e0b]">
                <AlertCircle className="w-3 h-3" /> Còn {questions.length - Object.keys(answers).length} câu chưa trả lời
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length === 0 || submitting}
              className="btn-primary text-base px-8 py-3.5 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <><Send className="w-4 h-4 mr-2 inline" /> Nộp bài</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
