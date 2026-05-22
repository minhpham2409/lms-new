'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-state';
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
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  ClipboardList,
  HelpCircle,
} from 'lucide-react';
import { coursesApi, enrollmentsApi, progressApi, assignmentsApi, getAccessToken } from '@/lib/api-service';
import type { Course, LessonWithProgress, Assignment } from '@/types';

interface VideoPlayerProps {
  courseId: string;
  lessonId: string;
}

/** Interval (ms) for sending progress updates to server. */
const PROGRESS_SYNC_INTERVAL = 10_000;

export default function VideoPlayer({ courseId, lessonId }: VideoPlayerProps) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [allLessons, setAllLessons] = useState<LessonWithProgress[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [lessonAssignments, setLessonAssignments] = useState<Assignment[]>([]);

  // Video tracking refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setIsLoading(true);
      const status = await enrollmentsApi.checkStatus(courseId);
      if (!status.enrolled) {
        toast.error('You need to enroll in this course first.');
        router.push(`/courses/${courseId}`);
        return;
      }

      const courseData = await coursesApi.getById(courseId);

      // Calculate progress from completed lessons
      let completedLessonsCount = 0;
      const flatLessons: LessonWithProgress[] = [];
      for (const section of (courseData.sections ?? [])) {
        for (const lesson of (section.lessons ?? [])) {
          let lessonProgress = { completed: false, watchTime: 0, watchedPercentage: 0 };
          try {
            const lp = await progressApi.getLesson(lesson.id);
            lessonProgress = {
              completed: lp.completed,
              watchTime: lp.watchTime,
              watchedPercentage: lp.watchedPercentage ?? 0,
            };
          } catch { /* first time */ }
          if (lessonProgress.completed) completedLessonsCount++;
          flatLessons.push({ ...lesson, ...lessonProgress });
        }
      }

      setCourse(courseData);
      setAllLessons(flatLessons);
      setExpandedSections(new Set((courseData.sections ?? []).map((s) => s.id)));
      const total = flatLessons.length;
      const pct = total > 0 ? Math.round((completedLessonsCount / total) * 100) : 0;
      setOverallProgress(pct);

      const cur = flatLessons.find((l) => l.id === lessonId);
      setCurrentLesson(cur ?? flatLessons[0] ?? null);

      const targetId = cur?.id ?? flatLessons[0]?.id;
      if (targetId) {
        assignmentsApi.getByLesson(targetId).then(setLessonAssignments).catch(() => setLessonAssignments([]));
      }
    } catch {
      toast.error('Failed to load course');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [isLoggedIn, loadData, router]);

  /** Send current video progress to backend. */
  const syncVideoProgress = useCallback(async () => {
    if (!currentLesson) return;
    const video = videoRef.current;
    if (!video || video.duration === 0 || isNaN(video.duration)) return;

    const watchTime = Math.round(video.currentTime);
    const watchedPercentage = Math.round((video.currentTime / video.duration) * 100);

    try {
      const result = await progressApi.updateVideo({
        lessonId: currentLesson.id,
        watchTime,
        watchedPercentage,
      });

      // If server says completed, update local state
      if (result.completed && !currentLesson.completed) {
        setAllLessons((prev) =>
          prev.map((l) => (l.id === currentLesson.id ? { ...l, completed: true } : l))
        );
        setCurrentLesson((prev) => prev ? { ...prev, completed: true } : prev);
        const newCompleted = allLessons.filter((l) => l.id === currentLesson.id ? true : l.completed).length;
        const pct = allLessons.length > 0 ? Math.round((newCompleted / allLessons.length) * 100) : 0;
        setOverallProgress(pct);
        toast.success('Lesson completed!');
      }
    } catch { /* silent fail for progress sync */ }
  }, [currentLesson, allLessons]);

  // Set up periodic progress sync for native HTML5 video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentLesson?.videoUrl) return;

    // Extract YouTube ID — if YouTube, don't attach native listeners
    const ytMatch = currentLesson.videoUrl.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
    if (ytMatch) return; // YouTube handled separately

    const onPlay = () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      syncTimerRef.current = setInterval(syncVideoProgress, PROGRESS_SYNC_INTERVAL);
    };

    const onPause = () => {
      syncVideoProgress(); // final sync on pause
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };

    const onEnded = () => {
      syncVideoProgress();
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [currentLesson, syncVideoProgress]);

  /**
   * YouTube fallback: since we can't track iframe progress reliably without
   * the YouTube IFrame API and proper origin setup, we provide a "Mark Watched"
   * button for YouTube videos that sends watchedPercentage=100.
   */
  const markYouTubeWatched = async () => {
    if (!currentLesson) return;
    try {
      const result = await progressApi.updateVideo({
        lessonId: currentLesson.id,
        watchTime: (currentLesson.duration ?? 0) * 60,
        watchedPercentage: 100,
      });
      if (result.completed) {
        setAllLessons((prev) =>
          prev.map((l) => (l.id === currentLesson.id ? { ...l, completed: true } : l))
        );
        setCurrentLesson((prev) => prev ? { ...prev, completed: true } : prev);
        const newCompleted = allLessons.filter((l) => l.id === currentLesson.id ? true : l.completed).length;
        const pct = allLessons.length > 0 ? Math.round((newCompleted / allLessons.length) * 100) : 0;
        setOverallProgress(pct);
        toast.success('Lesson completed!');
      }
    } catch {
      toast.error('Failed to update progress');
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
                      ref={(el) => {
                        // Assign to videoRef for progress tracking
                        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                        if (!el) return;
                        const src = currentLesson.videoUrl!;
                        const isHls = src.includes('.m3u8');
                        if (isHls) {
                          if (el.canPlayType('application/vnd.apple.mpegurl')) {
                            el.src = src;
                          } else {
                            import('hls.js').then(({ default: Hls }) => {
                              if (Hls.isSupported()) {
                                // Cleanup previous instance
                                if ((el as any).__hls) { (el as any).__hls.destroy(); }
                                const hls = new Hls({ 
                                  maxBufferLength: 30, 
                                  maxMaxBufferLength: 60,
                                  xhrSetup: (xhr) => {
                                    xhr.withCredentials = true; // Send HttpOnly cookie
                                    const token = getAccessToken();
                                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                                  }
                                });
                                hls.loadSource(src);
                                hls.attachMedia(el);
                                (el as any).__hls = hls;
                              }
                            });
                          }
                        } else {
                          el.src = src;
                        }
                      }}
                      className="absolute top-0 left-0 w-full h-full"
                      controls
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
                    {/* YouTube fallback: manual "Mark Watched" button */}
                    {youtubeId && !currentLesson.completed && (
                      <Button
                        onClick={markYouTubeWatched}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> I&apos;ve Watched This
                      </Button>
                    )}
                    {/* Native video: progress auto-tracked, no manual button needed */}
                    {!youtubeId && !currentLesson.videoUrl && !currentLesson.completed && (
                      <Button
                        onClick={markYouTubeWatched}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
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
