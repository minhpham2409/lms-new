"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Award, Download, Calendar, Loader2, ExternalLink, GraduationCap, ArrowRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function CertificatesPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) router.push("/auth/login");
    else if (token) fetchCerts();
  }, [token, authLoading]);

  async function fetchCerts() {
    try {
      const res = await fetch(`${API}/certificates`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCerts(await res.json());
    } catch {} finally { setLoading(false); }
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#1c1d1f]">
      <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#1c1d1f]">
      <Navbar />

      {/* Header */}
      <div className="border-b border-[#d1d7dc] dark:border-[#3e4143] pt-[70px]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-[#2d2f31] dark:text-white flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#FFCCAA]" /> Chứng chỉ của tôi
          </h1>
          <p className="text-sm text-[#6a6f73] mt-1">Các chứng chỉ bạn đã đạt được sau khi hoàn thành khóa học</p>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFCCAA]" />
          </div>
        ) : certs.length === 0 ? (
          <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-16 text-center">
            <div className="w-20 h-20 bg-[#fef3c7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-[#FFCCAA]" />
            </div>
            <h3 className="text-xl font-bold text-[#2d2f31] dark:text-white mb-2">Chưa có chứng chỉ</h3>
            <p className="text-sm text-[#6a6f73] mb-6 max-w-sm mx-auto">
              Hoàn thành 100% nội dung của một khóa học để nhận chứng chỉ xác nhận thành tích học tập
            </p>
            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-[#FFCCAA] hover:bg-[#8710d8] text-white font-bold text-sm transition-colors rounded">
              Bắt đầu học ngay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-[#FFCCAA]" />
                <p className="text-2xl font-bold text-[#2d2f31] dark:text-white">{certs.length}</p>
                <p className="text-xs text-[#6a6f73] mt-0.5">Chứng chỉ đạt được</p>
              </div>
              <div className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5 text-center">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 text-[#F8B486]" />
                <p className="text-2xl font-bold text-[#2d2f31] dark:text-white">{certs.length}</p>
                <p className="text-xs text-[#6a6f73] mt-0.5">Khóa học hoàn thành</p>
              </div>
              <div className="hidden sm:block bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded p-5 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-[#94A3B8]" />
                <p className="text-2xl font-bold text-[#2d2f31] dark:text-white">
                  {certs.length > 0 ? new Date(certs[certs.length - 1].createdAt || certs[certs.length - 1].issuedAt).getFullYear() : "-"}
                </p>
                <p className="text-xs text-[#6a6f73] mt-0.5">Năm học tập</p>
              </div>
            </div>

            {/* Certificates grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {certs.map((cert) => (
                <div key={cert.id} className="bg-white dark:bg-[#2d2f31] border border-[#d1d7dc] dark:border-[#3e4143] rounded overflow-hidden hover:shadow-md transition-shadow group">
                  {/* Certificate visual header */}
                  <div className="h-24 relative flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFCCAA, #F8B486)" }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 10px)" }} />
                    <Award className="w-12 h-12 text-white drop-shadow-lg" />
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded">Certified</span>
                    </div>
                  </div>

                  {/* Certificate info */}
                  <div className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6a6f73] mb-1.5">Chứng nhận hoàn thành</p>
                    <h3 className="text-sm font-bold text-[#2d2f31] dark:text-white line-clamp-2 mb-3">
                      {cert.course?.title || cert.courseName || "Khóa học"}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-[#6a6f73] mb-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      Cấp ngày: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </div>
                    <p className="text-[11px] text-[#6a6f73] font-mono mb-4">Mã: {cert.code || cert.id.substring(0, 12).toUpperCase()}</p>

                    <div className="flex gap-2">
                      <Link
                        href={`/courses/${cert.courseId}/certificate`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FFCCAA] hover:bg-[#8710d8] text-white font-bold text-xs transition-colors rounded"
                      >
                        <ExternalLink className="w-3 h-3" /> Xem chứng chỉ
                      </Link>
                      <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#d1d7dc] dark:border-[#6a6f73] text-[#2d2f31] dark:text-white font-bold text-xs hover:bg-[#f7f9fa] dark:hover:bg-[#3e4143] transition-colors rounded">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
