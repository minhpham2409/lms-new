"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, Download, ArrowLeft, Share2, Calendar, GraduationCap } from "lucide-react";

export default function CourseCertificatePage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <Link href={`/courses/${id}`} className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: "#8892a4" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại khóa học
          </Link>
        </div>

        {/* Certificate card */}
        <div className="relative rounded-3xl overflow-hidden" style={{ border: "2px solid rgba(124,58,237,0.3)", boxShadow: "0 40px 100px rgba(124,58,237,0.2)" }}>
          {/* Top gradient bar */}
          <div className="h-2" style={{ background: "linear-gradient(to right, #7c3aed, #0891b2)" }} />

          <div className="p-10 sm:p-14 text-center" style={{ background: "linear-gradient(135deg, rgba(19,26,46,0.95), rgba(124,58,237,0.08))" }}>
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">HọcLộ Trình</span>
            </div>

            {/* Decorative lines */}
            <div className="divider mb-6" />

            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "#8892a4" }}>Chứng nhận hoàn thành</p>

            <Award className="w-20 h-20 mx-auto mb-4" style={{ color: "#f59e0b" }} />

            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">Nguyễn Văn A</h1>
            <p className="text-sm mb-6" style={{ color: "#8892a4" }}>đã hoàn thành xuất sắc khóa học</p>

            <h2 className="text-xl font-bold mb-6 gradient-text">Toán học cơ bản — Lớp 6</h2>

            <div className="flex items-center justify-center gap-4 mb-6 text-xs" style={{ color: "#8892a4" }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> 15/04/2026</span>
              <span>•</span>
              <span>Xếp loại: <strong style={{ color: "#10b981" }}>Xuất sắc</strong></span>
            </div>

            <div className="divider mb-6" />

            <div className="flex items-center justify-center gap-3 text-xs" style={{ color: "#8892a4" }}>
              <span>Mã chứng chỉ: <strong style={{ color: "#a78bfa" }}>CERT-2026-001</strong></span>
            </div>
          </div>

          <div className="h-2" style={{ background: "linear-gradient(to right, #0891b2, #7c3aed)" }} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button className="btn-primary">
            <Download className="w-4 h-4" /> Tải xuống PDF
          </button>
          <button className="btn-secondary">
            <Share2 className="w-4 h-4" /> Chia sẻ
          </button>
        </div>
      </div>
    </div>
  );
}
