"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface Course {
  id: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  _count: { enrollments: number };
  sections: Array<{ _count: { lessons: number } }>;
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
      <div className="min-h-screen flex flex-col bg-[#051025]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <div className="text-[#F8B486] font-bold text-xl animate-pulse">ĐANG TẢI...</div>
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
  const totalStudents = teacher.courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const totalLessons = teacher.courses.reduce((sum, c) => c.sections.reduce((s, sec) => s + sec._count.lessons, sum), 0);
  const isOwner = user?.id === teacher.id;

  return (
    <div className="min-h-screen flex flex-col bg-[#051025] text-[#F8FAFC]">
      <Navbar />

      {/* Hero Cover */}
      <div className="pt-16 relative">
        <div className="h-48 sm:h-64 relative overflow-hidden bg-[#0A1A35]">
          <Image src="/images/hero_star_light.png" alt="Cover" fill className="object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#051025] via-transparent to-transparent opacity-90" />
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative pb-8 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/teachers" className="absolute top-[-200px] left-4 sm:left-8 inline-block text-sm font-medium text-[#F8B486] hover:text-[#FFCCAA] transition-colors z-10 px-3 py-1.5 rounded bg-black/30 backdrop-blur-sm">
            ← QUAY LẠI
          </Link>

          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end -mt-16 sm:-mt-20">
            {/* Avatar */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 flex items-center justify-center text-5xl sm:text-6xl font-bold shadow-2xl relative z-10 bg-[#121E36] border-4 border-[#051025] text-[#F8B486]">
              {initial}
            </div>

            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F8FAFC]">{fullName}</h1>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F8B486] bg-[#F8B486]/10 px-3 py-1 rounded">
                  GIẢNG VIÊN
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-sm mb-6 text-[#94A3B8]">
                <span>{teacher.email}</span>
                <span>•</span>
                <span>Tham gia {new Date(teacher.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {[
                  { label: "KHÓA HỌC", value: teacher.courses.length },
                  { label: "HỌC VIÊN", value: totalStudents },
                  { label: "BÀI GIẢNG", value: totalLessons },
                  { label: "ĐÁNH GIÁ", value: "4.9/5" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-start px-5 py-3 bg-[#121E36] rounded-lg border border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">{stat.label}</span>
                    <span className="text-lg font-extrabold text-[#F8B486]">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Bio Card */}
              <div className="bg-[#121E36] rounded-xl border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#F8B486]">
                    GIỚI THIỆU
                  </h2>
                  {isOwner && !isEditingBio && (
                    <button onClick={() => setIsEditingBio(true)} className="text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC]">
                      SỬA
                    </button>
                  )}
                </div>

                {isEditingBio ? (
                  <div>
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      className="w-full bg-[#051025] text-[#F8FAFC] p-3 rounded-lg border border-white/10 outline-none text-sm resize-none mb-3"
                      rows={5}
                      placeholder="Viết một vài điều về bản thân bạn..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setIsEditingBio(false); setBioInput(teacher.bio || ""); }}
                              className="px-4 py-2 rounded text-xs font-bold text-[#94A3B8] hover:bg-white/5">
                        HỦY
                      </button>
                      <button onClick={handleSaveBio} disabled={savingBio}
                              className="px-4 py-2 rounded text-xs font-bold bg-[#F8B486] text-[#051025] hover:bg-[#FFCCAA]">
                        {savingBio ? "ĐANG LƯU..." : "LƯU"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#94A3B8]">
                    {teacher.bio || <span className="italic opacity-60">Chưa có thông tin giới thiệu.</span>}
                  </p>
                )}
              </div>

              {/* Quick Info Card */}
              <div className="bg-[#121E36] rounded-xl border border-white/5 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F8B486] mb-5">THÔNG TIN</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Vai trò</p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">Giảng viên</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Tổng bài giảng</p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">{totalLessons} bài học</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">Ngày tham gia</p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">{new Date(teacher.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </div>

              {/* Contact Admin Card */}
              <div className="bg-gradient-to-br from-[#121E36] to-[#0A1A35] rounded-xl border border-[#F8B486]/20 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#F8B486] mb-3">LIÊN HỆ HỖ TRỢ</h3>
                <p className="text-xs mb-4 text-[#94A3B8] leading-relaxed">
                  Nếu bạn cần tư vấn khóa học hoặc hỗ trợ, hãy liên hệ:
                </p>
                <div className="space-y-3">
                  <a href="tel:0916869648" className="block text-sm font-bold text-[#F8FAFC] hover:text-[#F8B486] transition-colors">
                    SĐT: 0916 869 648
                  </a>
                  <a href="mailto:providminh24092004@gmail.com" className="block text-sm font-bold text-[#F8FAFC] hover:text-[#F8B486] transition-colors truncate">
                    EMAIL: providminh24092004@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Right Content - Courses */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#F8FAFC]">
                  KHÓA HỌC <span className="text-[#F8B486]">({teacher.courses.length})</span>
                </h2>
              </div>

              {teacher.courses.length === 0 ? (
                <div className="bg-[#121E36] border border-white/5 rounded-xl text-center py-16">
                  <div className="text-4xl mb-4 text-[#F8B486]/50">[]</div>
                  <h3 className="font-bold text-lg mb-2 text-[#F8FAFC]">Chưa có khóa học</h3>
                  <p className="text-sm text-[#94A3B8]">Giáo viên này hiện chưa xuất bản khóa học nào.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {teacher.courses.map(course => {
                    const lessonCount = course.sections.reduce((sum, sec) => sum + sec._count.lessons, 0);

                    return (
                      <Link href={`/courses/${course.id}`} key={course.id}
                            className="flex flex-col sm:flex-row bg-[#121E36] rounded-xl border border-white/5 overflow-hidden group hover:border-[#F8B486]/50 transition-colors">
                        {/* Thumbnail */}
                        <div className="sm:w-56 md:w-64 flex-shrink-0 aspect-video sm:aspect-auto relative bg-[#051025] overflow-hidden">
                          {course.thumbnail ? (
                            <Image
                              src={course.thumbnail}
                              alt={course.title}
                              fill
                              className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center min-h-[140px]">
                              <Image src="/images/hero_star_light.png" alt="Cover" fill className="object-cover opacity-20" />
                              <span className="text-xs font-bold text-[#94A3B8] relative z-10">CHƯA CÓ ẢNH BÌA</span>
                            </div>
                          )}
                          {/* Price badge */}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded text-[10px] font-bold tracking-widest text-[#051025] bg-[#F8B486]">
                            {course.price > 0 ? `${course.price.toLocaleString()}Đ` : "MIỄN PHÍ"}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-lg mb-2 text-[#F8FAFC] group-hover:text-[#F8B486] transition-colors line-clamp-2">
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-sm mb-4 line-clamp-2 leading-relaxed text-[#94A3B8]">
                                {course.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-bold text-[#64748B]">
                            <span>{course._count.enrollments} HỌC VIÊN</span>
                            <span>•</span>
                            <span>{lessonCount} BÀI HỌC</span>
                            <span>•</span>
                            <span>{course.sections.length} CHƯƠNG</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
