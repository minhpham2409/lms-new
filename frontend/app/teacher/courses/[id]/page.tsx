'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  GripVertical, Play, FileText, BookOpen, HelpCircle, ClipboardList,
  Users,
} from 'lucide-react';
import { coursesApi, sectionsApi, lessonsApi, assignmentsApi, quizzesApi } from '@/lib/api-service';
import type { Course, Section, Lesson, Assignment, Submission } from '@/types';

interface QuestionForm {
  content: string;
  options: string[];
  answer: string;
  score: string;
}

export default function TeacherCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Section dialog
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  // Lesson dialog
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: '' });

  // Assignments
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignLesson, setAssignLesson] = useState<Lesson | null>(null);
  const [savingAssign, setSavingAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '', description: '', type: 'essay', dueDate: '', maxScore: '100',
  });

  // Quiz questions dialog
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizAssignment, setQuizAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Review submissions / quiz attempts
  const [reviewAssignment, setReviewAssignment] = useState<Assignment | null>(null);
  const [reviewSubmissions, setReviewSubmissions] = useState<Submission[]>([]);
  const [reviewQuizAttempts, setReviewQuizAttempts] = useState<
    { id: string; score: number; maxScore: number; studentId: string; createdAt?: string; student?: { username?: string; firstName?: string; lastName?: string } }[]
  >([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeDraft, setGradeDraft] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    if (!session?.accessToken) return;
    coursesApi.getById(id)
      .then((c) => {
        setCourse(c);
        if (c.sections?.length > 0) setExpandedSections(new Set([c.sections[0].id]));
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, id]);

  const loadAssignments = async (lessonId: string) => {
    try {
      const data = await assignmentsApi.getByLesson(lessonId);
      setAssignments((prev) => ({ ...prev, [lessonId]: data }));
    } catch {
      toast.error('Could not load assignments for this lesson');
    }
  };

  const loadAllAssignmentsForCourse = async (c: Course) => {
    const lessons = c.sections?.flatMap((s) => s.lessons ?? []) ?? [];
    if (lessons.length === 0) {
      setAssignments({});
      return;
    }
    try {
      const pairs = await Promise.all(
        lessons.map(async (l) => {
          const data = await assignmentsApi.getByLesson(l.id);
          return [l.id, data] as const;
        }),
      );
      setAssignments(Object.fromEntries(pairs));
    } catch {
      toast.error('Failed to load assignments');
    }
  };

  useEffect(() => {
    if (!course) return;
    loadAllAssignmentsForCourse(course);
  }, [course]);

  const toggleSection = (sid: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) { next.delete(sid); } else { next.add(sid); }
      return next;
    });
  };

  // ─── Section CRUD ─────────────────────────────────────────────────────────────
  const openAddSection = () => { setEditSection(null); setSectionTitle(''); setShowSectionDialog(true); };
  const openEditSection = (s: Section) => { setEditSection(s); setSectionTitle(s.title); setShowSectionDialog(true); };

  const saveSection = async () => {
    if (!sectionTitle.trim()) return;
    try {
      setSavingSection(true);
      if (editSection) {
        const updated = await sectionsApi.update(editSection.id, { title: sectionTitle });
        setCourse((prev) => prev ? { ...prev, sections: prev.sections.map((s) => s.id === editSection.id ? { ...s, ...updated } : s) } : prev);
        toast.success('Section updated');
      } else {
        const created = await sectionsApi.create(id, { title: sectionTitle });
        setCourse((prev) => prev ? { ...prev, sections: [...prev.sections, { ...created, lessons: [] }] } : prev);
        setExpandedSections((prev) => new Set([...prev, created.id]));
        toast.success('Section added');
      }
      setShowSectionDialog(false);
    } catch { toast.error('Failed to save section'); }
    finally { setSavingSection(false); }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its lessons?')) return;
    try {
      await sectionsApi.delete(sectionId);
      setCourse((prev) => prev ? { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) } : prev);
      toast.success('Section deleted');
    } catch { toast.error('Failed to delete section'); }
  };

  // ─── Lesson CRUD ──────────────────────────────────────────────────────────────
  const openAddLesson = (sectionId: string) => {
    setEditLesson(null); setActiveSectionId(sectionId);
    setLessonForm({ title: '', videoUrl: '', content: '', duration: '' });
    setShowLessonDialog(true);
  };
  const openEditLesson = (lesson: Lesson, sectionId: string) => {
    setEditLesson(lesson); setActiveSectionId(sectionId);
    setLessonForm({ title: lesson.title, videoUrl: lesson.videoUrl ?? '', content: lesson.content ?? '', duration: lesson.duration?.toString() ?? '' });
    setShowLessonDialog(true);
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim()) return;
    try {
      setSavingLesson(true);
      const data = {
        title: lessonForm.title,
        videoUrl: lessonForm.videoUrl || undefined,
        content: lessonForm.content || undefined,
        duration: lessonForm.duration ? parseInt(lessonForm.duration) : undefined,
      };
      if (editLesson) {
        const updated = await lessonsApi.update(editLesson.id, data);
        setCourse((prev) => prev ? {
          ...prev,
          sections: prev.sections.map((s) => s.id === activeSectionId
            ? { ...s, lessons: s.lessons.map((l) => l.id === editLesson.id ? { ...l, ...updated } : l) } : s),
        } : prev);
        toast.success('Lesson updated');
      } else {
        const created = await lessonsApi.create({ ...data, sectionId: activeSectionId! });
        setCourse((prev) => prev ? {
          ...prev,
          sections: prev.sections.map((s) => s.id === activeSectionId ? { ...s, lessons: [...s.lessons, created] } : s),
        } : prev);
        toast.success('Lesson added');
      }
      setShowLessonDialog(false);
    } catch { toast.error('Failed to save lesson'); }
    finally { setSavingLesson(false); }
  };

  const deleteLesson = async (lessonId: string, sectionId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await lessonsApi.delete(lessonId);
      setCourse((prev) => prev ? {
        ...prev,
        sections: prev.sections.map((s) => s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s),
      } : prev);
      toast.success('Lesson deleted');
    } catch { toast.error('Failed to delete lesson'); }
  };

  // ─── Assignment CRUD ──────────────────────────────────────────────────────────
  const openAddAssignment = (lesson: Lesson) => {
    setAssignLesson(lesson);
    setAssignForm({ title: '', description: '', type: 'essay', dueDate: '', maxScore: '100' });
    setShowAssignDialog(true);
    void loadAssignments(lesson.id);
  };

  const saveAssignment = async () => {
    if (!assignForm.title.trim() || !assignLesson) return;
    const wasQuiz = assignForm.type === 'quiz';
    try {
      setSavingAssign(true);
      const created = await assignmentsApi.create({
        title: assignForm.title,
        description: assignForm.description || undefined,
        type: assignForm.type,
        lessonId: assignLesson.id,
        dueDate: assignForm.dueDate || undefined,
        maxScore: assignForm.maxScore ? parseFloat(assignForm.maxScore) : undefined,
      });
      setAssignments((prev) => ({ ...prev, [assignLesson.id]: [...(prev[assignLesson.id] ?? []), created] }));
      setAssignForm({ title: '', description: '', type: 'essay', dueDate: '', maxScore: '100' });
      toast.success('Assignment created');

      if (wasQuiz) {
        const quiz = await quizzesApi.create({ assignmentId: created.id, timeLimit: 30 });
        setQuizAssignment({ ...created, quiz } as Assignment);
        setQuestions([{ content: '', options: ['', '', '', ''], answer: '', score: '1' }]);
        setShowAssignDialog(false);
        setShowQuizDialog(true);
      } else {
        setShowAssignDialog(false);
        await loadAssignments(assignLesson.id);
      }
    } catch { toast.error('Failed to create assignment'); }
    finally { setSavingAssign(false); }
  };

  const deleteAssignment = async (assignmentId: string, lessonId: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await assignmentsApi.delete(assignmentId);
      setAssignments((prev) => ({ ...prev, [lessonId]: (prev[lessonId] ?? []).filter((a) => a.id !== assignmentId) }));
      toast.success('Assignment deleted');
    } catch { toast.error('Failed to delete assignment'); }
  };

  // ─── Quiz questions ───────────────────────────────────────────────────────────
  const addQuestion = () => setQuestions((prev) => [...prev, { content: '', options: ['', '', '', ''], answer: '', score: '1' }]);

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: string) => {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.map((o, j) => j === oIdx ? value : o) } : q));
  };

  const saveQuiz = async () => {
    if (!quizAssignment?.quiz) return;
    const valid = questions.every((q) => q.content.trim() && q.answer.trim() && q.options.every((o) => o.trim()));
    if (!valid) { toast.error('Fill all question fields'); return; }
    try {
      setSavingQuiz(true);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // Convert plain strings to {id, text} objects; answer is stored as text, convert to id
        const opts = q.options.map((text, idx) => ({ id: `opt_${idx}`, text }));
        const answerOpt = opts.find((o) => o.text === q.answer);
        await quizzesApi.addQuestion(quizAssignment.quiz.id, {
          content: q.content,
          options: opts,
          answer: answerOpt?.id ?? opts[0]?.id ?? '',
          score: parseFloat(q.score) || 1,
        });
      }
      toast.success('Quiz questions saved!');
      setShowQuizDialog(false);
      if (quizAssignment?.lessonId) await loadAssignments(quizAssignment.lessonId);
    } catch { toast.error('Failed to save quiz'); }
    finally { setSavingQuiz(false); }
  };

  const openReview = async (a: Assignment) => {
    setReviewAssignment(a);
    setReviewSubmissions([]);
    setReviewQuizAttempts([]);
    setLoadingReview(true);
    try {
      const full = await assignmentsApi.getById(a.id);
      setReviewAssignment(full);
      if (full.type === 'essay') {
        const subs = await assignmentsApi.getSubmissions(full.id);
        setReviewSubmissions(subs);
        const drafts: Record<string, { score: string; feedback: string }> = {};
        for (const s of subs) {
          drafts[s.id] = {
            score: s.score != null ? String(s.score) : '',
            feedback: s.feedback ?? '',
          };
        }
        setGradeDraft(drafts);
      } else if (full.quiz?.id) {
        const att = await quizzesApi.getAttempts(full.quiz.id);
        setReviewQuizAttempts(att);
      } else {
        toast.error('Quiz is not set up yet — finish adding the quiz first.');
      }
    } catch {
      toast.error('Failed to load student work');
    } finally {
      setLoadingReview(false);
    }
  };

  const submitGrade = async (submission: Submission) => {
    if (!reviewAssignment) return;
    const d = gradeDraft[submission.id];
    const score = parseFloat(d?.score ?? '');
    if (Number.isNaN(score)) {
      toast.error('Enter a valid score');
      return;
    }
    if (score < 0 || score > reviewAssignment.maxScore) {
      toast.error(`Score must be between 0 and ${reviewAssignment.maxScore}`);
      return;
    }
    try {
      setGradingId(submission.id);
      const updated = await assignmentsApi.gradeSubmission(reviewAssignment.id, submission.id, {
        score,
        feedback: d?.feedback?.trim() || undefined,
      });
      setReviewSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success('Graded');
    } catch {
      toast.error('Could not save grade');
    } finally {
      setGradingId(null);
    }
  };

  // ─── Loading / empty states ───────────────────────────────────────────────────
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0) ?? 0;
  const allLessons = course.sections?.flatMap((s) => s.lessons ?? []) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{course.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                  {course.status ?? 'draft'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {course.sections?.length ?? 0} sections · {totalLessons} lessons
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue="curriculum">
            <TabsList className="mb-4">
              <TabsTrigger value="curriculum"><BookOpen className="h-4 w-4 mr-1.5" />Curriculum</TabsTrigger>
              <TabsTrigger value="assignments"><ClipboardList className="h-4 w-4 mr-1.5" />Assignments</TabsTrigger>
            </TabsList>

            {/* ── CURRICULUM TAB ── */}
            <TabsContent value="curriculum" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Course Curriculum</h2>
                <Button onClick={openAddSection} size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> Add Section
                </Button>
              </div>

              {(course.sections ?? []).length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <p className="text-muted-foreground mb-4">No sections yet</p>
                    <Button onClick={openAddSection}><Plus className="h-4 w-4 mr-2" /> Add First Section</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(course.sections ?? []).map((section, sIdx) => (
                    <Card key={section.id} className="overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <button
                            className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                            onClick={() => toggleSection(section.id)}
                          >
                            {expandedSections.has(section.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span>Section {sIdx + 1}: {section.title}</span>
                          </button>
                          <Badge variant="secondary" className="text-xs">{section.lessons?.length ?? 0} lessons</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openAddLesson(section.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Lesson
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditSection(section)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteSection(section.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {expandedSections.has(section.id) && (
                        <div className="divide-y">
                          {(section.lessons ?? []).length === 0 ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground italic">
                              No lessons yet.{' '}
                              <button className="text-primary hover:underline" onClick={() => openAddLesson(section.id)}>Add one</button>
                            </div>
                          ) : (
                            (section.lessons ?? []).map((lesson, lIdx) => (
                              <div key={lesson.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 group">
                                <div className="flex items-center gap-3">
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div className="w-6 h-6 bg-muted rounded text-xs flex items-center justify-center font-medium">{lIdx + 1}</div>
                                  <span className="text-sm">{lesson.title}</span>
                                  {lesson.videoUrl && <Play className="h-3.5 w-3.5 text-blue-500" />}
                                  {lesson.content && !lesson.videoUrl && <FileText className="h-3.5 w-3.5 text-green-500" />}
                                  {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration} min</span>}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditLesson(lesson, section.id)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => deleteLesson(lesson.id, section.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── ASSIGNMENTS TAB ── */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Assignments & Quizzes</h2>
              </div>

              {allLessons.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Add lessons first before creating assignments.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {allLessons.map((lesson) => (
                    <Card key={lesson.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            {lesson.title}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => openAddAssignment(lesson)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Assignment
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {(assignments[lesson.id] ?? []).length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No assignments yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {(assignments[lesson.id] ?? []).map((a) => (
                              <div key={a.id} className="flex items-center justify-between gap-2 bg-muted/40 rounded px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  {a.type === 'quiz' ? (
                                    <HelpCircle className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                  ) : (
                                    <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  )}
                                  <span className="text-sm font-medium truncate">{a.title}</span>
                                  <Badge variant="outline" className="text-xs shrink-0">{a.type}</Badge>
                                  {a.maxScore != null && (
                                    <span className="text-xs text-muted-foreground shrink-0">{a.maxScore} pts</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 text-xs"
                                    onClick={() => openReview(a)}
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {a.type === 'quiz' ? 'Attempts' : 'Review'}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() => deleteAssignment(a.id, lesson.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
      </div>

      {/* ── Section Dialog ── */}
      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editSection ? 'Edit Section' : 'Add Section'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Section Title *</Label>
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="e.g. Introduction to..." onKeyDown={(e) => e.key === 'Enter' && saveSection()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)}>Cancel</Button>
            <Button onClick={saveSection} disabled={savingSection || !sectionTitle.trim()}>
              {savingSection ? 'Saving...' : editSection ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lesson Dialog ── */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Lesson Title *</Label>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Getting Started" />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://youtube.com/..." />
            </div>
            <div className="space-y-1.5">
              <Label>Content (optional)</Label>
              <Input value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Lesson description or notes" />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={0} value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Cancel</Button>
            <Button onClick={saveLesson} disabled={savingLesson || !lessonForm.title.trim()}>
              {savingLesson ? 'Saving...' : editLesson ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Assignment Dialog ── */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Assignment — {assignLesson?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} placeholder="e.g. Week 1 Quiz" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={assignForm.description} onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="Assignment instructions..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={assignForm.type} onValueChange={(v) => setAssignForm({ ...assignForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essay">Essay (text submission)</SelectItem>
                    <SelectItem value="quiz">Quiz (multiple choice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Max Score</Label>
                <Input type="number" value={assignForm.maxScore} onChange={(e) => setAssignForm({ ...assignForm, maxScore: e.target.value })} placeholder="100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date (optional)</Label>
              <Input type="datetime-local" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} />
            </div>
            {assignForm.type === 'quiz' && (
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded p-2">
                After creating, you will be taken to add quiz questions.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={saveAssignment} disabled={savingAssign || !assignForm.title.trim()}>
              {savingAssign ? 'Creating...' : assignForm.type === 'quiz' ? 'Create & Add Questions' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Quiz Questions Dialog ── */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Questions — {quizAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Question {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500"
                      onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Question *</Label>
                  <Textarea value={q.content} onChange={(e) => updateQuestion(qIdx, 'content', e.target.value)} placeholder="Enter question text" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Answer Options *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <Input key={oIdx} value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Option ${oIdx + 1}`} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Correct Answer * (must match an option exactly)</Label>
                    <Select value={q.answer} onValueChange={(v) => updateQuestion(qIdx, 'answer', v)}>
                      <SelectTrigger><SelectValue placeholder="Select correct answer" /></SelectTrigger>
                      <SelectContent>
                        {q.options.filter((o) => o.trim()).map((o, i) => (
                          <SelectItem key={i} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Score (points)</Label>
                    <Input type="number" min={0.5} step={0.5} value={q.score} onChange={(e) => updateQuestion(qIdx, 'score', e.target.value)} />
                  </div>
                </div>
              </Card>
            ))}
            <Button variant="outline" className="w-full" onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuizDialog(false)}>Skip for now</Button>
            <Button onClick={saveQuiz} disabled={savingQuiz}>
              {savingQuiz ? 'Saving...' : `Save ${questions.length} Question${questions.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review submissions / quiz attempts ── */}
      <Dialog open={!!reviewAssignment} onOpenChange={(o) => { if (!o) setReviewAssignment(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {reviewAssignment?.type === 'quiz' ? 'Quiz attempts' : 'Review submissions'}
              {reviewAssignment && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">{reviewAssignment.title}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {loadingReview ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : reviewAssignment?.type === 'essay' ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {reviewSubmissions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No submissions yet.</p>
              ) : (
                reviewSubmissions.map((sub) => (
                  <Card key={sub.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {sub.student?.firstName || sub.student?.lastName
                          ? `${sub.student?.firstName ?? ''} ${sub.student?.lastName ?? ''}`.trim()
                          : sub.student?.username ?? sub.studentId}
                      </span>
                      <Badge variant={sub.status === 'graded' ? 'default' : 'secondary'}>{sub.status}</Badge>
                    </div>
                    {sub.content && (
                      <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">{sub.content}</div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Score (max {reviewAssignment.maxScore})</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          max={reviewAssignment.maxScore}
                          value={gradeDraft[sub.id]?.score ?? ''}
                          onChange={(e) =>
                            setGradeDraft((prev) => ({
                              ...prev,
                              [sub.id]: { score: e.target.value, feedback: prev[sub.id]?.feedback ?? '' },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Feedback</Label>
                      <Textarea
                        rows={2}
                        value={gradeDraft[sub.id]?.feedback ?? ''}
                        onChange={(e) =>
                          setGradeDraft((prev) => ({
                            ...prev,
                            [sub.id]: { score: prev[sub.id]?.score ?? '', feedback: e.target.value },
                          }))
                        }
                        placeholder="Optional feedback for the student"
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={gradingId === sub.id}
                      onClick={() => submitGrade(sub)}
                    >
                      {gradingId === sub.id ? 'Saving…' : sub.status === 'graded' ? 'Update grade' : 'Save grade'}
                    </Button>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {reviewQuizAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No attempts yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2">Student</th>
                      <th className="py-2 pr-2">Score</th>
                      <th className="py-2">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewQuizAttempts.map((att) => (
                      <tr key={att.id} className="border-b border-muted/50">
                        <td className="py-2 pr-2">
                          {att.student?.firstName || att.student?.lastName
                            ? `${att.student?.firstName ?? ''} ${att.student?.lastName ?? ''}`.trim()
                            : att.student?.username ?? att.studentId}
                        </td>
                        <td className="py-2 pr-2 font-medium">
                          {att.score} / {att.maxScore}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">
                          {att.createdAt ? new Date(att.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Quiz scores are graded automatically when students submit.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewAssignment(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
