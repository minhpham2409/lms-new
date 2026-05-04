"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Award, Download, Calendar, BookOpen } from "lucide-react";

const certs = [
  { id: "1", course: "Toán học cơ bản — Lớp 6", date: "2026-04-15", grade: "Xuất sắc", color: "#7c3aed" },
];

export default function CertificatesPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: "#f59e0b" }} /> Chứng chỉ
          </h1>
          {certs.length === 0 ? (
            <div className="card-base text-center py-16">
              <Award className="w-14 h-14 mx-auto mb-4" style={{ color: "#8892a4" }} />
              <h2 className="text-lg font-bold mb-2">Chưa có chứng chỉ</h2>
              <p className="text-sm" style={{ color: "#8892a4" }}>Hoàn thành khóa học để nhận chứng chỉ</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {certs.map((cert) => (
                <div key={cert.id} className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(8,145,178,0.08))", border: "1px solid rgba(124,58,237,0.25)" }}>
                  {/* Decorative border top */}
                  <div className="h-1.5" style={{ background: "linear-gradient(to right, #7c3aed, #0891b2)" }} />
                  <div className="p-6 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4" style={{ color: "#f59e0b" }} />
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#8892a4" }}>Chứng nhận hoàn thành</p>
                    <h3 className="text-lg font-bold mb-1">{cert.course}</h3>
                    <span className="badge badge-success mb-4">{cert.grade}</span>
                    <div className="flex items-center justify-center gap-1.5 text-xs mb-5" style={{ color: "#8892a4" }}>
                      <Calendar className="w-3 h-3" /> {cert.date}
                    </div>
                    <button className="btn-primary w-full justify-center">
                      <Download className="w-4 h-4" /> Tải chứng chỉ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
