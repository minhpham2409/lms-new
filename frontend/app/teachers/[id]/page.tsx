"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Users, BookOpen, Star, Loader2, ArrowLeft, Mail, Calendar, GraduationCap, Video, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  _count: {
    enrollments: number;
  };
  sections: Array<{
    _count: {
      lessons: number;
    }
  }>;
}

interface Teacher {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  bio: string | null;
  createdAt: string;
  courses: Course[];
}

export default function TeacherProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    fetch(`${API}/users/public/teachers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Teacher not found");
        return res.json();
      })
      .then((data) => {
        setTeacher(data);
        setBioInput(data.bio || "");
      })
      .catch((err) => {
        console.error("Error fetching teacher:", err);
        router.push("/teachers");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSaveBio = async () => {
    if (!token) return;
    setSavingBio(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bio: bioInput }),
      });
      if (res.ok) {
        toast.success("Đã cập nhật giới thiệu!");
        setTeacher(prev => prev ? { ...prev, bio: bioInput } : null);
        setIsEditingBio(false);
      } else {
        toast.error("Không thể lưu thay đổi");
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setSavingBio(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "#7c3aed" }} />
          <p style={{ color: "var(--foreground-muted)" }}>Đang tải thông tin giáo viên...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!teacher) return null;

  const fullName = teacher.firstName 
    ? `${teacher.firstName} ${teacher.lastName || ""}`.trim() 
    : teacher.username;
  const initial = fullName.charAt(0).toUpperCase();

  // Mảng màu gradient tương tự trang danh sách (lấy hash theo id để cố định màu)
  const gradients = [
    "linear-gradient(135deg, #7c3aed, #0891b2)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #0891b2)",
    "linear-gradient(135deg, #ec4899, #7c3aed)",
  ];
  const charCode = teacher.id.charCodeAt(0) || 0;
  const bgGradient = gradients[charCode % gradients.length];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <Navbar />

      {/* Header Profile */}
      <div className="pt-24 pb-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.03), rgba(8,145,178,0.03))", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/teachers" className="inline-flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors mb-8" style={{ color: "var(--foreground-muted)" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-3xl flex items-center justify-center text-5xl md:text-6xl font-bold text-white shadow-xl" 
                 style={{ background: bgGradient }}>
              {initial}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{fullName}</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {teacher.email}</span>
                <span className="hidden md:inline" style={{ color: "var(--border)" }}>•</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Tham gia từ {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "var(--muted)" }}>
                  <BookOpen className="w-5 h-5" style={{ color: "#7c3aed" }} />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--foreground-muted)" }}>Khóa học</p>
                    <p className="font-extrabold leading-tight">{teacher.courses.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "var(--muted)" }}>
                  <Users className="w-5 h-5" style={{ color: "#0891b2" }} />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--foreground-muted)" }}>Học viên</p>
                    <p className="font-extrabold leading-tight">
                      {teacher.courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "var(--muted)" }}>
                  <Star className="w-5 h-5" style={{ color: "#f59e0b" }} />
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--foreground-muted)" }}>Đánh giá</p>
                    <p className="font-extrabold leading-tight">4.9/5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="py-8" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Giới thiệu</h2>
            {user?.id === teacher.id && !isEditingBio && (
              <button onClick={() => setIsEditingBio(true)} className="btn-ghost px-3 py-1.5 text-sm gap-1.5">
                <Edit2 className="w-4 h-4" /> Chỉnh sửa
              </button>
            )}
          </div>
          
          {isEditingBio ? (
            <div className="card-base p-4">
              <textarea 
                value={bioInput} 
                onChange={(e) => setBioInput(e.target.value)} 
                className="input-base resize-none mb-3" 
                rows={4} 
                placeholder="Viết một vài điều về bản thân bạn..."
              />
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => { setIsEditingBio(false); setBioInput(teacher.bio || ""); }} className="btn-ghost px-4 py-2 text-sm">
                  Hủy
                </button>
                <button onClick={handleSaveBio} disabled={savingBio} className="btn-primary px-4 py-2 text-sm">
                  {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu thay đổi
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground-muted)" }}>
              {teacher.bio ? teacher.bio : <span className="italic opacity-70">Chưa có thông tin giới thiệu.</span>}
            </div>
          )}
        </div>
      </div>

      {/* Courses List */}
      <div className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)" }}>
              <GraduationCap className="w-5 h-5" style={{ color: "#7c3aed" }} />
            </div>
            <h2 className="text-2xl font-bold">Khóa học của giáo viên</h2>
          </div>

          {teacher.courses.length === 0 ? (
            <div className="card-base text-center py-16 max-w-lg mx-auto">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" style={{ color: "var(--foreground-muted)" }} />
              <h3 className="font-bold text-lg mb-2">Chưa có khóa học</h3>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                Giáo viên này hiện chưa xuất bản khóa học nào. Bạn hãy quay lại sau nhé.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacher.courses.map(course => {
                const totalLessons = course.sections.reduce((sum, sec) => sum + sec._count.lessons, 0);
                
                return (
                  <Link href={`/courses/${course.id}`} key={course.id} className="card-base card-hover flex flex-col p-0 overflow-hidden group">
                    <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {course.thumbnail ? (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                          <BookOpen className="w-8 h-8 opacity-50" />
                          <span className="text-xs font-medium">Không có ảnh bìa</span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold text-white shadow-md backdrop-blur-md" 
                           style={{ background: "rgba(0,0,0,0.6)" }}>
                        {course.price > 0 ? `${course.price.toLocaleString()}đ` : "Miễn phí"}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      
                      {course.description && (
                        <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--foreground-muted)" }}>
                          {course.description}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between text-xs" style={{ color: "var(--foreground-muted)" }}>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{course._count.enrollments} học viên</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" />
                          <span>{totalLessons} bài học</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
