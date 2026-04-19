'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LessonComments } from '@/components/courses/lesson-comments';
import {
  CheckCircle,
  PlayCircle,
  ArrowLeft,
  Download,
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';
import { coursesApi, enrollmentsApi, progressApi, assignmentsApi } from '@/lib/api-service';
import type { Course, LessonWithProgress, Assignment } from '@/types';

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
}

export default function VideoPlayer({ courseId, lessonId }: VideoPlayerProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<LessonWithProgress[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [lessonAssignments, setLessonAssignments] = useState<Assignment[]>([]);

  const loadData = useCallback(async () => {
    if (!session) return;
    try {
      setIsLoading(true);
      const status = await enrollmentsApi.checkStatus(courseId);
      if (!status.enrolled) {
        toast.error('You need to enroll in this course first.');
        router.push(`/courses/${courseId}`);
        return;
      }

      const [courseData, progressData] = await Promise.all([
        coursesApi.getById(courseId),
        progressApi.getCourse(courseId).catch(() => ({ overallProgress: 0, completedLessons: 0, totalLessons: 0, courseId })),
      ]);

      setOverallProgress(progressData.overallProgress ?? 0);

      const flatLessons: LessonWithProgress[] = [];
      for (const section of (courseData.sections ?? [])) {
        for (const lesson of (section.lessons ?? [])) {
          let lessonProgress = { completed: false, watchTime: 0 };
          try {
            const lp = await progressApi.getLesson(lesson.id);
            lessonProgress = { completed: lp.completed, watchTime: lp.watchTime };
          } catch {}
          flatLessons.push({ ...lesson, ...lessonProgress });
        }
      }

      setCourse(courseData);
      setAllLessons(flatLessons);
      setExpandedSections(new Set((courseData.sections ?? []).map((s) => s.id)));

      const cur = flatLessons.find((l) => l.id === lessonId);
      setCurrentLesson(cur ?? flatLessons[0] ?? null);

      // load assignments for current lesson
      const targetId = cur?.id ?? flatLessons[0]?.id;
      if (targetId) {
        assignmentsApi.getByLesson(targetId).then(setLessonAssignments).catch(() => setLessonAssignments([]));
      }
    } catch {
      toast.error('Failed to load course');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId, session, router]);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadData();
  }, [session, loadData, router]);

  const markAsCompleted = async () => {
    if (!currentLesson) return;
    try {
      setIsMarkingComplete(true);
      await progressApi.updateVideo({ lessonId: currentLesson.id, completed: true });
      toast.success('Lesson marked as completed!');
      setAllLessons((prev) =>
        prev.map((l) => (l.id === currentLesson.id ? { ...l, completed: true } : l))
      );
      setCurrentLesson((prev) => prev ? { ...prev, completed: true } : prev);
      const newCompleted = allLessons.filter((l) => l.id === currentLesson.id ? true : l.completed).length;
      const pct = allLessons.length > 0 ? Math.round((newCompleted / allLessons.length) * 100) : 0;
      setOverallProgress(pct);
    } catch {
      toast.error('Failed to mark as completed');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
    return match?.[1] ?? null;
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Loading lesson...</p>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold mb-4">Lesson not found</h2>
        <Button onClick={() => router.push(`/courses/${courseId}`)}>Back to Course</Button>
      </div>
    );
  }

  const youtubeId = currentLesson.videoUrl ? extractYouTubeId(currentLesson.videoUrl) : null;
  const completedCount = allLessons.filter((l) => l.completed).length;
  const allDone = completedCount === allLessons.length && allLessons.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/courses/${courseId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Course
              </Button>

              <Card className="overflow-hidden">
                {youtubeId ? (
                  <div className="relative w-full pb-[56.25%] bg-black">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
                      title={currentLesson.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : currentLesson.videoUrl ? (
                  <div className="relative w-full pb-[56.25%] bg-black">
                    <video
                      className="absolute top-0 left-0 w-full h-full"
                      controls
                      src={currentLesson.videoUrl}
                    />
                  </div>
                ) : (
                  <div className="h-56 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <PlayCircle className="h-14 w-14 text-gray-300 mx-auto mb-2" />
                      <p className="text-muted-foreground">No video for this lesson</p>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{currentLesson.title}</CardTitle>
                    {currentLesson.completed && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{course.title}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentLesson.content && (
                    <div className="prose max-w-none text-sm text-muted-foreground">
                      <p>{currentLesson.content}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {!currentLesson.completed && (
                      <Button
                        onClick={markAsCompleted}
                        disabled={isMarkingComplete}
                        className="flex-1"
                      >
                        {isMarkingComplete ? (
                          <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Saving...</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-2" /> Mark Complete</>
                        )}
                      </Button>
                    )}
                    {allDone && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/courses/${courseId}/certificate`)}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" /> Get Certificate
                      </Button>
                    )}
                  </div>

                  {/* Assignments & Quizzes for this lesson */}
                  {lessonAssignments.length > 0 && (
                    <div className="border-t pt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4" /> Assignments & Quizzes
                      </p>
                      {lessonAssignments.map((a) => (
                        <a
                          key={a.id}
                          href={`/courses/${courseId}/lessons/${currentLesson.id}/assignment/${a.id}`}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            {a.type === 'quiz'
                              ? <HelpCircle className="h-4 w-4 text-purple-500" />
                              : <ClipboardList className="h-4 w-4 text-blue-500" />}
                            <div>
                              <p className="text-sm font-medium group-hover:text-primary transition-colors">{a.title}</p>
                              <p className="text-xs text-gray-400 capitalize">{a.type} · {a.maxScore} pts</p>
                            </div>
                          </div>
                          <span className="text-xs text-primary font-medium">Start →</span>
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <LessonComments lessonId={currentLesson.id} />
            </div>

            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Course Progress</CardTitle>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{completedCount}/{allLessons.length} lessons</span>
                      <span>{Math.round(overallProgress)}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
                  {(course.sections ?? []).map((section) => (
                    <div key={section.id} className="border-b last:border-b-0">
                      <button
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => toggleSection(section.id)}
                      >
                        <span className="font-medium text-sm">{section.title}</span>
                        {expandedSections.has(section.id) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {expandedSections.has(section.id) && (
                        <div className="bg-gray-50/50">
                          {(section.lessons ?? []).map((lesson) => {
                            const lp = allLessons.find((l) => l.id === lesson.id);
                            const isCurrent = lesson.id === currentLesson?.id;
                            return (
                              <button
                                key={lesson.id}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                                  isCurrent
                                    ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                    : 'hover:bg-muted/50'
                                }`}
                                onClick={() => router.push(`/courses/${courseId}/lessons/${lesson.id}`)}
                              >
                                <div className="shrink-0">
                                  {lp?.completed ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : lesson.videoUrl ? (
                                    <PlayCircle className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate font-medium text-xs">{lesson.title}</p>
                                  {lesson.duration && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration} min
                                    </p>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
    </div>
  );
}
