"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import {
  Play, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Clock,
  MessageCircle, ThumbsUp, Send, List, X,
} from "lucide-react";

const lessonData = {
  title: "Bài 3: Phân số — Khái niệm và phép tính",
  course: "Toán học cơ bản — Lớp 6",
  duration: "15:30",
  content: `Phân số là một cách biểu diễn một phần của một tổng thể. Một phân số gồm hai phần: tử số (số trên) và mẫu số (số dưới).

Ví dụ: 3/4 có nghĩa là 3 phần trong tổng số 4 phần bằng nhau.

**Phép cộng phân số cùng mẫu:**
a/c + b/c = (a+b)/c

**Phép cộng phân số khác mẫu:**
Quy đồng mẫu số, sau đó cộng tử số.`,
};

const sidebarLessons = [
  { id: "l1", title: "Chào mừng đến khóa học", completed: true, duration: "5:30" },
  { id: "l2", title: "Cách sử dụng nền tảng", completed: true, duration: "8:15" },
  { id: "l3", title: "Phân số — Khái niệm", completed: false, duration: "15:00", active: true },
  { id: "l4", title: "Ví dụ minh họa", completed: false, duration: "12:30" },
  { id: "l5", title: "Bài tập thực hành", completed: false, duration: "20:00" },
];

const comments = [
  { user: "Trần B", avatar: "T", text: "Thầy ơi, phần quy đồng mẫu số con chưa hiểu lắm ạ", time: "2 giờ trước", likes: 3 },
  { user: "Thầy Minh", avatar: "M", text: "Con xem lại ví dụ ở phút 8:30 nhé, thầy giải thích kỹ phần đó rồi.", time: "1 giờ trước", likes: 5, isTeacher: true },
];

export default function LessonPage() {
  const { id, lessonId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comment, setComment] = useState("");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b" style={{ background: "rgba(13,19,34,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <Link href={`/courses/${id}`} className="flex items-center gap-1 text-sm" style={{ color: "#8892a4" }}>
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </Link>
          <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-sm font-medium truncate max-w-xs">{lessonData.course}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#8892a4" }}>3 / 5 bài</span>
          <div className="w-20 progress-bar">
            <div className="progress-fill" style={{ width: "40%" }} />
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/5 transition-colors ml-2">
            <List className="w-4 h-4" style={{ color: "#8892a4" }} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {/* Video player placeholder */}
          <div className="aspect-video flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(8,145,178,0.08))" }}>
            <button className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)", boxShadow: "0 8px 40px rgba(124,58,237,0.5)" }}>
              <Play className="w-9 h-9 text-white ml-1" />
            </button>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.6)", color: "#8892a4" }}>0:00 / {lessonData.duration}</span>
            </div>
          </div>

          {/* Lesson info */}
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-extrabold">{lessonData.title}</h1>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8892a4" }}>
                <Clock className="w-3 h-3" /> {lessonData.duration}
              </span>
            </div>

            {/* Lesson text content */}
            <div className="card-base mb-8">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" style={{ color: "#7c3aed" }} /> Nội dung bài học
              </h3>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#8892a4" }}>
                {lessonData.content}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-10">
              <Link href={`/courses/${id}/lessons/l2`} className="btn-secondary text-sm">
                <ChevronLeft className="w-4 h-4" /> Bài trước
              </Link>
              <button className="btn-primary text-sm">
                <CheckCircle2 className="w-4 h-4" /> Hoàn thành & tiếp tục
              </button>
              <Link href={`/courses/${id}/lessons/l4`} className="btn-secondary text-sm">
                Bài tiếp <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Comments */}
            <div className="divider mb-6" />
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" style={{ color: "#7c3aed" }} /> Thảo luận ({comments.length})
            </h3>

            {/* New comment */}
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white" style={{ background: "#7c3aed" }}>A</div>
              <div className="flex-1 flex gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Viết bình luận..." className="input-base text-sm flex-1" />
                <button className="btn-primary px-3"><Send className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: c.isTeacher ? "linear-gradient(135deg, #7c3aed, #0891b2)" : "rgba(124,58,237,0.4)" }}
                  >{c.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{c.user}</span>
                      {c.isTeacher && <span className="badge badge-primary text-[9px]">Giáo viên</span>}
                      <span className="text-xs" style={{ color: "#8892a4" }}>{c.time}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#8892a4" }}>{c.text}</p>
                    <button className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: "#8892a4" }}>
                      <ThumbsUp className="w-3 h-3" /> {c.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - lesson list */}
        {sidebarOpen && (
          <div className="w-80 border-l overflow-y-auto flex-shrink-0" style={{ background: "rgba(13,19,34,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold text-sm">Danh sách bài</h3>
              <button onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" style={{ color: "#8892a4" }} /></button>
            </div>
            <div className="p-2">
              {sidebarLessons.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: l.active ? "rgba(124,58,237,0.15)" : "transparent",
                    borderLeft: l.active ? "3px solid #7c3aed" : "3px solid transparent",
                  }}
                >
                  {l.completed ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                  ) : l.active ? (
                    <Play className="w-4 h-4 flex-shrink-0" style={{ color: "#7c3aed" }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: l.active ? "#f1f5ff" : "#8892a4" }}>{l.title}</p>
                    <p className="text-[10px]" style={{ color: "#8892a4" }}>{l.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
