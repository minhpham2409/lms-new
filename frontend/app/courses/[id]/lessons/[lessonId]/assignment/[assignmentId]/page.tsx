'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/unified-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Clock,
  Trophy,
  CheckCircle,
  XCircle,
  FileText,
  HelpCircle,
  Send,
} from 'lucide-react';
import { assignmentsApi, quizzesApi } from '@/lib/api-service';
import type { Assignment, Quiz, Submission, QuizAttempt } from '@/types';

interface PageParams {
  id: string;
  lessonId: string;
  assignmentId: string;
}

/** API /quizzes/:id/result returns `questions[]`; UI expects optional `breakdown`. */
function normalizeQuizResult(
  api: unknown,
): QuizAttempt & { breakdown?: { question: string; correct: boolean; score: number }[] } {
  const r = api as Record<string, unknown> & {
    breakdown?: { question: string; correct: boolean; score: number }[];
    questions?: Array<{
      content?: string;
      correctAnswer?: string;
      studentAnswer?: string | null;
      score?: number;
    }>;
  };
  type Out = QuizAttempt & { breakdown?: { question: string; correct: boolean; score: number }[] };
  if (r.breakdown) return r as unknown as Out;
  const questions = r.questions;
  if (Array.isArray(questions)) {
    return {
      ...(r as unknown as QuizAttempt),
      breakdown: questions.map((q) => {
        const ok = q.studentAnswer != null && q.studentAnswer === q.correctAnswer;
        return {
          question: q.content ?? '',
          correct: ok,
          score: ok ? (q.score ?? 0) : 0,
        };
      }),
    } as Out;
  }
  return r as unknown as Out;
}

export default function AssignmentPage({ params }: { params: Promise<PageParams> }) {
  const { id: courseId, lessonId, assignmentId } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [quizAttempt, setQuizAttempt] = useState<(QuizAttempt & { breakdown?: { question: string; correct: boolean; score: number }[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Essay state
  const [essayText, setEssayText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quiz state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (!session?.accessToken) return;
    assignmentsApi
      .getById(assignmentId)
      .then(async (a) => {
        setAssignment(a);
        if (a.type !== 'quiz') {
          try {
            const mine = await assignmentsApi.getMySubmission(assignmentId);
            if (mine) setSubmission(mine);
          } catch {
            /* no submission yet */
          }
        }
        if (a.type === 'quiz' && a.quiz) {
          try {
            const raw = await quizzesApi.getById(a.quiz.id);
            const q = {
              ...raw,
              questions: raw.questions.map((qn) => ({
                ...qn,
                options:
                  typeof qn.options === 'string'
                    ? (JSON.parse(qn.options) as unknown)
                    : qn.options,
              })),
            } as Quiz;
            setQuiz(q);
            if (q.timeLimit) setTimeLeft(q.timeLimit * 60);
          } catch {
            toast.error('Could not load quiz');
          }
          try {
            const result = await quizzesApi.getResult(a.quiz.id);
            setQuizAttempt(normalizeQuizResult(result));
          } catch {
            /* no attempt yet */
          }
        }
      })
      .catch(() => toast.error('Failed to load assignment'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, session?.user?.id, assignmentId]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!quiz) return;
    const payload = Object.entries(answers).map(([questionId, answerId]) => ({ questionId, answerId }));
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0 && timeLeft !== null && timeLeft > 0) {
      if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return;
    }
    try {
      setSubmittingQuiz(true);
      const result = await quizzesApi.submit(quiz.id, { answers: payload });
      setQuizAttempt(
        normalizeQuizResult(
          result as QuizAttempt & { breakdown?: { question: string; correct: boolean; score: number }[] },
        ),
      );
      try {
        const detailed = await quizzesApi.getResult(quiz.id);
        setQuizAttempt(normalizeQuizResult(detailed));
      } catch {
        /* use submit response */
      }
      toast.success('Quiz submitted!');
    } catch {
      toast.error('Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  }, [quiz, answers, timeLeft]);

  // Quiz timer
  useEffect(() => {
    if (!quizStarted || timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(t);
          void handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [quizStarted, timeLeft, handleSubmitQuiz]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmitEssay = async () => {
    if (!essayText.trim()) { toast.error('Please write your answer'); return; }
    try {
      setSubmitting(true);
      const sub = await assignmentsApi.submit(assignmentId, { content: essayText });
      setSubmission(sub);
      toast.success('Assignment submitted!');
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Assignment not found.</p>
        <Button asChild><Link href={`/courses/${courseId}/lessons/${lessonId}`}>Back to Lesson</Link></Button>
      </div>
    );
  }

  const isQuiz = assignment.type === 'quiz';
  const pct = quizAttempt ? Math.round((quizAttempt.score / quizAttempt.maxScore) * 100) : null;

  return (
    <DashboardLayout contentClassName="py-12">
      <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Lesson
              </Link>
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              {isQuiz
                ? <HelpCircle className="h-5 w-5 text-purple-500" />
                : <FileText className="h-5 w-5 text-blue-500" />}
              <h1 className="text-xl font-bold">{assignment.title}</h1>
              <Badge variant="outline" className="capitalize">{assignment.type}</Badge>
            </div>
            {assignment.description && (
              <p className="text-gray-600 text-sm mt-1">{assignment.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              {assignment.maxScore && <span>Max score: {assignment.maxScore} pts</span>}
              {assignment.dueDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>

          {/* ── QUIZ RESULT ── */}
          {isQuiz && quizAttempt && (
            <Card className={`mb-6 border-2 ${pct !== null && pct >= 70 ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  {pct !== null && pct >= 70
                    ? <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                    : <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />}
                  <div className="text-3xl font-bold mb-1">
                    {quizAttempt.score} / {quizAttempt.maxScore}
                  </div>
                  <div className="text-lg font-medium text-gray-600">{pct}%</div>
                </div>
                <Progress value={pct ?? 0} className="h-3 mb-4" />
                {quizAttempt.breakdown && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Answer Breakdown</h3>
                    {quizAttempt.breakdown.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {b.correct
                          ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 truncate">{b.question}</p>
                          <p className={`text-xs ${b.correct ? 'text-green-600' : 'text-red-500'}`}>
                            {b.correct ? `+${b.score} pts` : '0 pts'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── ESSAY RESULT ── */}
          {!isQuiz && submission && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Submitted</span>
                  {submission.status === 'graded' && (
                    <Badge className="bg-blue-100 text-blue-700 ml-auto">
                      Score: {submission.score} / {assignment.maxScore}
                    </Badge>
                  )}
                </div>
                <div className="bg-white rounded p-3 text-sm text-gray-700 border mt-2">
                  {submission.content}
                </div>
                {submission.feedback && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Teacher Feedback:</p>
                    <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                      {submission.feedback}
                    </p>
                  </div>
                )}
                {submission.status !== 'graded' && (
                  <p className="text-xs text-gray-400 mt-2">Waiting for teacher review...</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── QUIZ FORM ── */}
          {isQuiz && !quizAttempt && quiz && (
            <div className="space-y-4">
              {!quizStarted ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <HelpCircle className="h-16 w-16 text-purple-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold mb-2">{quiz.questions.length} Questions</h2>
                    {quiz.timeLimit && (
                      <p className="text-gray-500 mb-4 flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" /> Time limit: {quiz.timeLimit} minutes
                      </p>
                    )}
                    <Button onClick={() => setQuizStarted(true)} size="lg">
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Timer + progress */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {Object.keys(answers).length} / {quiz.questions.length} answered
                    </span>
                    {timeLeft !== null && (
                      <span className={`text-sm font-mono font-semibold px-3 py-1 rounded-full ${
                        timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Clock className="h-3.5 w-3.5 inline mr-1" />
                        {formatTime(timeLeft)}
                      </span>
                    )}
                  </div>

                  {quiz.questions.map((q, idx) => {
                    const opts: { id: string; text: string }[] = Array.isArray(q.options)
                      ? (typeof q.options[0] === 'string'
                          ? (q.options as unknown as string[]).map((t, i) => ({ id: `opt_${i}`, text: t }))
                          : q.options as unknown as { id: string; text: string }[])
                      : [];
                    return (
                      <Card key={q.id} className={`border ${answers[q.id] ? 'border-blue-200' : 'border-gray-200'}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-700">
                            <span className="text-blue-600 font-bold mr-2">Q{idx + 1}.</span>
                            {q.content}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {opts.map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                  answers[q.id] === opt.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt.id}
                                  checked={answers[q.id] === opt.id}
                                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                  className="accent-blue-600"
                                />
                                <span className="text-sm">{opt.text}</span>
                              </label>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingQuiz ? 'Submitting...' : `Submit Quiz (${Object.keys(answers).length}/${quiz.questions.length} answered)`}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── ESSAY FORM ── */}
          {!isQuiz && !submission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Answer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Write your answer here..."
                  rows={10}
                  className="resize-none"
                />
                <Button
                  className="w-full"
                  onClick={handleSubmitEssay}
                  disabled={submitting || !essayText.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* If quiz already done but wants to review */}
          {isQuiz && quizAttempt && (
            <div className="text-center mt-4">
              <Button variant="outline" asChild>
                <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Lesson
                </Link>
              </Button>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
