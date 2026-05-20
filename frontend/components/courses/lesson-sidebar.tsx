"use client";
import Link from "next/link";
import { CheckCircle2, PlayCircle, Clock, BookOpen, ChevronDown, ChevronRight, Trophy, Lock } from "lucide-react";
import { useState } from "react";

interface LessonSidebarProps {
  course: any;
  courseId: string;
  currentLessonId: string;
  allLessons: any[];
  currentIdx: number;
}

export function LessonSidebar({ course, courseId, currentLessonId, allLessons, currentIdx }: LessonSidebarProps) {
  const completedCount = allLessons.filter((l: any) => l.completed || l.progress?.completed).length;
  const totalCount = allLessons.length;
  const progressPct = totalCount > 0 ? Math.round(((currentIdx + 1) / totalCount) * 100) : 0;

  // Track which sections are expanded - default all open
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(course?.sections?.map((s: any) => s.id) || [])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
        <h3 className="font-bold text-sm mb-3 line-clamp-1">Nội dung khóa học</h3>
        
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground-muted">
              <span className="font-bold text-foreground">{currentIdx + 1}</span>/{totalCount} bài học
            </span>
            <span className="font-bold text-primary">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-[#8710d8] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {course?.sections?.sort((a: any, b: any) => a.order - b.order).map((sec: any, si: number) => {
          const sectionLessons = sec.lessons?.sort((a: any, b: any) => a.order - b.order) || [];
          const isExpanded = expandedSections.has(sec.id);
          
          return (
            <div key={sec.id} className="border-b border-border/50">
              {/* Section header - clickable to expand/collapse */}
              <button
                onClick={() => toggleSection(sec.id)}
                className="w-full p-3.5 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center">
                  {isExpanded 
                    ? <ChevronDown className="w-3 h-3 text-foreground-muted" />
                    : <ChevronRight className="w-3 h-3 text-foreground-muted" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs leading-tight">Chương {si + 1}: {sec.title}</p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">{sectionLessons.length} bài học</p>
                </div>
              </button>

              {/* Lessons in section */}
              {isExpanded && (
                <div className="pb-1">
                  {sectionLessons.map((l: any, li: number) => {
                    const isCurrent = l.id === currentLessonId;
                    const isCompleted = l.completed || l.progress?.completed;
                    
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${courseId}/lessons/${l.id}`}
                        className={`
                          flex items-center gap-3 px-4 py-2.5 mx-1.5 mb-0.5 rounded-lg transition-all duration-200 group relative
                          ${isCurrent
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                            : isCompleted
                              ? 'hover:bg-muted/70 text-foreground-muted'
                              : 'hover:bg-muted/50'
                          }
                        `}
                      >
                        {/* Status indicator */}
                        <div className="flex-shrink-0 relative">
                          {isCompleted ? (
                            <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                              <PlayCircle className="w-3.5 h-3.5 text-primary animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center">
                              <span className="text-[10px] font-bold text-foreground-muted">{li + 1}</span>
                            </div>
                          )}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-tight line-clamp-2 ${
                            isCurrent ? 'font-bold' : isCompleted ? 'line-through opacity-60' : 'font-medium'
                          }`}>
                            {l.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {l.videoUrl ? (
                              <span className="text-[10px] text-foreground-muted flex items-center gap-0.5">
                                <PlayCircle className="w-2.5 h-2.5" /> Video
                              </span>
                            ) : (
                              <span className="text-[10px] text-foreground-muted flex items-center gap-0.5">
                                <BookOpen className="w-2.5 h-2.5" /> Lý thuyết
                              </span>
                            )}
                            {l.duration && (
                              <span className="text-[10px] text-foreground-muted flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {l.duration}p
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current indicator bar */}
                        {isCurrent && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-card/50">
        <Link
          href={`/courses/${courseId}`}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-foreground-muted hover:text-primary transition-colors rounded-lg hover:bg-muted/50"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Về trang khóa học
        </Link>
      </div>
    </div>
  );
}
