"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { ChevronLeft, Clock, CheckCircle2, XCircle, Target, Send, AlertCircle } from "lucide-react";

const questions = [
  { id: 1, text: "Kết quả của phép tính 2/3 + 1/3 là?", options: ["1/3", "2/3", "1", "3/3"], correct: 2 },
  { id: 2, text: "Phân số 4/8 rút gọn thành?", options: ["1/4", "1/2", "2/4", "2/8"], correct: 1 },
  { id: 3, text: "So sánh 3/5 và 2/5?", options: ["3/5 > 2/5", "3/5 < 2/5", "3/5 = 2/5", "Không so sánh được"], correct: 0 },
];

export default function AssignmentPage() {
  const { id, lessonId, assignmentId } = useParams();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.reduce((s, q) => s + (answers[q.id] === q.correct ? 1 : 0), 0)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b" style={{ background: "rgba(13,19,34,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href={`/courses/${id}/lessons/${lessonId}`} className="flex items-center gap-1 text-sm" style={{ color: "#8892a4" }}>
          <ChevronLeft className="w-4 h-4" /> Quay lại bài học
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" style={{ color: "#8892a4" }} />
          <span style={{ color: "#8892a4" }}>Không giới hạn thời gian</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="section-tag mx-auto mb-3"><Target className="w-3.5 h-3.5" /> Bài tập</div>
          <h1 className="text-2xl font-extrabold mb-2">Bài tập: Phân số cơ bản</h1>
          <p className="text-sm" style={{ color: "#8892a4" }}>{questions.length} câu hỏi trắc nghiệm</p>
        </div>

        {/* Score card if submitted */}
        {submitted && (
          <div className="glass-card rounded-2xl p-6 mb-8 text-center" style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }}>
            <div className="text-4xl font-extrabold mb-2">
              <span style={{ color: score >= questions.length * 0.7 ? "#10b981" : "#f59e0b" }}>
                {score}/{questions.length}
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: "#8892a4" }}>
              {score === questions.length ? "🎉 Xuất sắc! Hoàn hảo!" : score >= questions.length * 0.7 ? "👍 Tốt lắm!" : "💪 Cố gắng thêm nhé!"}
            </p>
            <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="btn-secondary text-sm">
              Làm lại
            </button>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qi) => (
            <div key={q.id} className="card-base">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                  {qi + 1}
                </span>
                <p className="font-semibold pt-1">{q.text}</p>
              </div>
              <div className="space-y-2 ml-11">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === oi;
                  const isCorrect = submitted && oi === q.correct;
                  const isWrong = submitted && selected && oi !== q.correct;

                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all"
                      style={{
                        background: isCorrect ? "rgba(16,185,129,0.15)" : isWrong ? "rgba(239,68,68,0.15)" : selected ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isCorrect ? "rgba(16,185,129,0.4)" : isWrong ? "rgba(239,68,68,0.4)" : selected ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
                        background: selected ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)",
                        color: selected ? "#a78bfa" : "#8892a4",
                      }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />}
                      {isWrong && <XCircle className="w-4 h-4" style={{ color: "#ef4444" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        {!submitted && (
          <div className="mt-8 text-center">
            {Object.keys(answers).length < questions.length && (
              <p className="text-xs mb-3 flex items-center justify-center gap-1" style={{ color: "#f59e0b" }}>
                <AlertCircle className="w-3 h-3" /> Còn {questions.length - Object.keys(answers).length} câu chưa trả lời
              </p>
            )}
            <button
              onClick={() => setSubmitted(true)}
              disabled={Object.keys(answers).length === 0}
              className="btn-primary text-base px-8 py-3.5 disabled:opacity-40"
            >
              <Send className="w-4 h-4" /> Nộp bài
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
