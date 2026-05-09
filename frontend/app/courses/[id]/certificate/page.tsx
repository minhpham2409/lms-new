"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-state";
import { Award, Download, ArrowLeft, Share2, Calendar, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function CourseCertificatePage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [cert, setCert] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchOrGenerate();
  }, [token, id]);

  async function fetchOrGenerate() {
    setLoading(true);
    try {
      // Fetch course data
      const courseR = await fetch(`${API}/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (courseR.ok) setCourse(await courseR.json());

      // Try generate certificate (idempotent — returns existing if already generated)
      const genR = await fetch(`${API}/certificates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courseId: id }),
      });
      if (genR.ok) setCert(await genR.json());

      // Also try fetching all certs to find matching
      if (!cert) {
        const allR = await fetch(`${API}/certificates`, { headers: { Authorization: `Bearer ${token}` } });
        if (allR.ok) {
          const allCerts = await allR.json();
          const found = allCerts.find?.((c: any) => c.courseId === id);
          if (found) setCert(found);
        }
      }
    } catch {} finally { setLoading(false); }
  }

  async function verifyCert() {
    if (!cert?.code) return;
    try {
      const res = await fetch(`${API}/certificates/${cert.code}`);
      if (res.ok) toast.success("Chứng chỉ hợp lệ!");
      else toast.error("Chứng chỉ không hợp lệ");
    } catch {}
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7c3aed" }} />
    </div>
  );

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.username || "Học sinh";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <Link href={`/courses/${id}`} className="inline-flex items-center gap-1 text-sm mb-4" style={{ color: "var(--foreground-muted)" }}>
            <ArrowLeft className="w-4 h-4" /> Quay lại khóa học
          </Link>
        </div>

        <div className="cert-card relative rounded-3xl overflow-hidden" style={{ border: "2px solid rgba(124,58,237,0.3)", boxShadow: "0 40px 100px rgba(124,58,237,0.2)" }}>
          <div className="h-2" style={{ background: "linear-gradient(to right, #7c3aed, #0891b2)" }} />

          <div className="p-10 sm:p-14 text-center" style={{ background: "linear-gradient(135deg, rgba(19,26,46,0.95), rgba(124,58,237,0.08))" }}>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">HọcLộ Trình</span>
            </div>

            <div className="divider mb-6" />

            <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "var(--foreground-muted)" }}>Chứng nhận hoàn thành</p>

            <Award className="w-20 h-20 mx-auto mb-4" style={{ color: "#f59e0b" }} />

            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3">{displayName}</h1>
            <p className="text-sm mb-6" style={{ color: "var(--foreground-muted)" }}>đã hoàn thành xuất sắc khóa học</p>

            <h2 className="text-xl font-bold mb-6 gradient-text">{course?.title || "Khóa học"}</h2>

            <div className="flex items-center justify-center gap-4 mb-6 text-xs" style={{ color: "var(--foreground-muted)" }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {cert?.issuedAt ? new Date(cert.issuedAt).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN")}</span>
            </div>

            <div className="divider mb-6" />

            <div className="flex items-center justify-center gap-3 text-xs" style={{ color: "var(--foreground-muted)" }}>
              <span>Mã chứng chỉ: <strong style={{ color: "#a78bfa" }}>{cert?.code || cert?.id?.substring(0, 12) || "—"}</strong></span>
            </div>
          </div>

          <div className="h-2" style={{ background: "linear-gradient(to right, #0891b2, #7c3aed)" }} />
        </div>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => {
            // Use print dialog to save as PDF
            const style = document.createElement('style');
            style.id = 'print-cert';
            style.textContent = `@media print { body * { visibility: hidden !important; } .cert-card, .cert-card * { visibility: visible !important; } .cert-card { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`;
            document.head.appendChild(style);
            window.print();
            setTimeout(() => document.getElementById('print-cert')?.remove(), 1000);
          }} className="btn-primary">
            <Download className="w-4 h-4" /> Tải xuống PDF
          </button>
          <button onClick={verifyCert} className="btn-secondary no-print">
            <Share2 className="w-4 h-4" /> Xác minh
          </button>
        </div>
      </div>
    </div>
  );
}
