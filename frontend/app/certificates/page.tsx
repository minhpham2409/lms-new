"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { Award, Download, Calendar, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function CertificatesPage() {
  const { token } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) fetchCerts();
  }, [token]);

  async function fetchCerts() {
    try {
      const res = await fetch(`${API}/certificates`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCerts(await res.json());
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <Award className="w-6 h-6" style={{ color: "#f59e0b" }} /> Chứng chỉ
          </h1>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#f59e0b" }} /></div>
          ) : certs.length === 0 ? (
            <div className="card-base text-center py-16">
              <Award className="w-14 h-14 mx-auto mb-4" style={{ color: "var(--foreground-muted)" }} />
              <h2 className="text-lg font-bold mb-2">Chưa có chứng chỉ</h2>
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Hoàn thành khóa học để nhận chứng chỉ</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {certs.map((cert) => (
                <div key={cert.id} className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(8,145,178,0.08))", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <div className="h-1.5" style={{ background: "linear-gradient(to right, #7c3aed, #0891b2)" }} />
                  <div className="p-6 text-center">
                    <Award className="w-16 h-16 mx-auto mb-4" style={{ color: "#f59e0b" }} />
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--foreground-muted)" }}>Chứng nhận hoàn thành</p>
                    <h3 className="text-lg font-bold mb-1">{cert.course?.title || cert.courseName || "Khóa học"}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-xs mb-3" style={{ color: "var(--foreground-muted)" }}>
                      <Calendar className="w-3 h-3" /> {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    <p className="text-xs mb-4 font-mono" style={{ color: "var(--foreground-muted)" }}>Mã: {cert.code || cert.id.substring(0, 8)}</p>
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
