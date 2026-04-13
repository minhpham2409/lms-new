'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Play,
  FileText,
} from 'lucide-react';
import { coursesApi, sectionsApi, lessonsApi } from '@/lib/api-service';
import type { Course, Section, Lesson } from '@/types';

export default function TeacherCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [savingSection, setSavingSection] = useState(false);

  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', content: '', duration: '' });

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    coursesApi.getById(id)
      .then((c) => {
        setCourse(c);
        if (c.sections?.length > 0) {
          setExpandedSections(new Set([c.sections[0].id]));
        }
      })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [session?.accessToken, id]);

  const toggleSection = (sid: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) { next.delete(sid); } else { next.add(sid); }
      return next;
    });
  };

  const openAddSection = () => {
    setEditSection(null);
    setSectionTitle('');
    setShowSectionDialog(true);
  };

  const openEditSection = (section: Section) => {
    setEditSection(section);
    setSectionTitle(section.title);
    setShowSectionDialog(true);
  };

  const saveSection = async () => {
    if (!sectionTitle.trim()) return;
    try {
      setSavingSection(true);
      if (editSection) {
        const updated = await sectionsApi.update(editSection.id, { title: sectionTitle });
        setCourse((prev) => prev ? {
          ...prev,
          sections: prev.sections.map((s) => s.id === editSection.id ? { ...s, ...updated } : s),
        } : prev);
        toast.success('Section updated');
      } else {
        const created = await sectionsApi.create(id, { title: sectionTitle });
        setCourse((prev) => prev ? {
          ...prev,
          sections: [...prev.sections, { ...created, lessons: [] }],
        } : prev);
        setExpandedSections((prev) => new Set([...prev, created.id]));
        toast.success('Section added');
      }
      setShowSectionDialog(false);
    } catch {
      toast.error('Failed to save section');
    } finally {
      setSavingSection(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its lessons?')) return;
    try {
      await sectionsApi.delete(sectionId);
      setCourse((prev) => prev ? {
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      } : prev);
      toast.success('Section deleted');
    } catch {
      toast.error('Failed to delete section');
    }
  };

  const openAddLesson = (sectionId: string) => {
    setEditLesson(null);
    setActiveSectionId(sectionId);
    setLessonForm({ title: '', videoUrl: '', content: '', duration: '' });
    setShowLessonDialog(true);
  };

  const openEditLesson = (lesson: Lesson, sectionId: string) => {
    setEditLesson(lesson);
    setActiveSectionId(sectionId);
    setLessonForm({
      title: lesson.title,
      videoUrl: lesson.videoUrl ?? '',
      content: lesson.content ?? '',
      duration: lesson.duration?.toString() ?? '',
    });
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
          sections: prev.sections.map((s) =>
            s.id === activeSectionId
              ? { ...s, lessons: s.lessons.map((l) => l.id === editLesson.id ? { ...l, ...updated } : l) }
              : s
          ),
        } : prev);
        toast.success('Lesson updated');
      } else {
        const created = await lessonsApi.create({ ...data, sectionId: activeSectionId! });
        setCourse((prev) => prev ? {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === activeSectionId
              ? { ...s, lessons: [...s.lessons, created] }
              : s
          ),
        } : prev);
        toast.success('Lesson added');
      }
      setShowLessonDialog(false);
    } catch {
      toast.error('Failed to save lesson');
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (lessonId: string, sectionId: string) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await lessonsApi.delete(lessonId);
      setCourse((prev) => prev ? {
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s
        ),
      } : prev);
      toast.success('Lesson deleted');
    } catch {
      toast.error('Failed to delete lesson');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <MainNav />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/teacher">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
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

          <div className="space-y-4">
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
                  <Button onClick={openAddSection}>
                    <Plus className="h-4 w-4 mr-2" /> Add First Section
                  </Button>
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
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>Section {sIdx + 1}: {section.title}</span>
                        </button>
                        <Badge variant="secondary" className="text-xs">
                          {section.lessons?.length ?? 0} lessons
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => openAddLesson(section.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Lesson
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => openEditSection(section)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {expandedSections.has(section.id) && (
                      <div className="divide-y">
                        {(section.lessons ?? []).length === 0 ? (
                          <div className="px-4 py-3 text-sm text-muted-foreground italic">
                            No lessons yet.{' '}
                            <button
                              className="text-primary hover:underline"
                              onClick={() => openAddLesson(section.id)}
                            >
                              Add one
                            </button>
                          </div>
                        ) : (
                          (section.lessons ?? []).map((lesson, lIdx) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 group"
                            >
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                <div className="w-6 h-6 bg-muted rounded text-xs flex items-center justify-center font-medium">
                                  {lIdx + 1}
                                </div>
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.videoUrl && (
                                  <Play className="h-3.5 w-3.5 text-blue-500" />
                                )}
                                {lesson.content && !lesson.videoUrl && (
                                  <FileText className="h-3.5 w-3.5 text-green-500" />
                                )}
                                {lesson.duration && (
                                  <span className="text-xs text-muted-foreground">
                                    {lesson.duration} min
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => openEditLesson(lesson, section.id)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => deleteLesson(lesson.id, section.id)}
                                >
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
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Section Title *</Label>
              <Input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="e.g. Introduction to..."
                onKeyDown={(e) => e.key === 'Enter' && saveSection()}
              />
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

      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Lesson Title *</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="e.g. Getting Started"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Video URL</Label>
              <Input
                value={lessonForm.videoUrl}
                onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content (optional)</Label>
              <Input
                value={lessonForm.content}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                placeholder="Lesson description or notes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={0}
                value={lessonForm.duration}
                onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                placeholder="15"
              />
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
    </div>
  );
}
