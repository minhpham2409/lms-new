"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const MONTHS_VI = ["","Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const money = (v: number) => v.toLocaleString("vi-VN");

type ViewMode = "monthly" | "quarterly";

export default function TaxReportsPage() {
  const router = useRouter();
  const { user, token, isLoggedIn, loading } = useAuth();
  const [mode, setMode] = useState<ViewMode>("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth()+1)/3));
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Student modal
  const [showStudents, setShowStudents] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseStudents, setCourseStudents] = useState<any>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) { router.push("/auth/login"); return; }
    if (user?.role !== "teacher" && user?.role !== "admin") router.push("/dashboard");
  }, [user, isLoggedIn, loading, router]);

  const fetchReport = useCallback(async () => {
    if (!token) return;
    setReportLoading(true);
    try {
      const endpoint = mode === "monthly"
        ? `${API}/tax-reports/monthly?year=${year}&month=${month}`
        : `${API}/tax-reports/quarterly?year=${year}&quarter=${quarter}`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setReport(await res.json());
      else toast.error("Không thể tải báo cáo");
    } catch { toast.error("Lỗi kết nối"); }
    finally { setReportLoading(false); }
  }, [token, mode, year, month, quarter]);

  useEffect(() => { if (token) fetchReport(); }, [token, fetchReport]);

  async function handleExport() {
    if (!token) return;
    setExporting(true);
    try {
      const params = mode === "monthly" ? `year=${year}&month=${month}` : `year=${year}&quarter=${quarter}`;
      const res = await fetch(`${API}/tax-reports/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = mode === "monthly" ? `bao_cao_thang${month}_${year}.xlsx` : `bao_cao_quy${quarter}_${year}.xlsx`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        toast.success("Đã tải file Excel!");
      } else toast.error("Không thể xuất báo cáo");
    } catch { toast.error("Lỗi tải file"); }
    finally { setExporting(false); }
  }

  async function openStudentList(courseId: string, courseName: string, m: number) {
    setSelectedCourse({ courseId, courseName, month: m });
    setShowStudents(true); setStudentsLoading(true); setCourseStudents(null);
    try {
      const res = await fetch(`${API}/tax-reports/course-students?courseId=${courseId}&year=${year}&month=${m}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourseStudents(await res.json());
    } catch { toast.error("Lỗi tải DS học sinh"); }
    finally { setStudentsLoading(false); }
  }

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#051025]">
      <div className="text-[#F8B486] font-bold text-xl animate-pulse">ĐANG TẢI...</div>
    </div>
  );

  const isMonthly = mode === "monthly";
  const months = report?.period?.months || [];
  const courses = report?.courses || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#051025] text-[#F8FAFC]">
      <Navbar />

      {/* ── Header ── */}
      <div className="pt-24 pb-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => router.push("/teacher")} className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">← QUAY LẠI</button>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8B486] bg-[#F8B486]/10 px-3 py-1 rounded">BÁO CÁO THỰC NHẬN</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {isMonthly
                  ? <>BÁO CÁO <span className="text-[#F8B486]">{MONTHS_VI[month]}</span> NĂM {year}</>
                  : <>BÁO CÁO <span className="text-[#F8B486]">QUÝ {quarter}</span> NĂM {year}</>
                }
              </h1>
              {report?.teacher && <p className="text-sm mt-2 font-medium text-[#94A3B8]">Giáo viên: {report.teacher.fullName}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex bg-[#121E36] rounded-lg border border-white/10 overflow-hidden">
                {(["monthly", "quarterly"] as ViewMode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${mode===m ? "bg-[#F8B486] text-[#051025]" : "text-[#94A3B8] hover:text-[#F8FAFC]"}`}>
                    {m === "monthly" ? "THEO THÁNG" : "THEO QUÝ"}
                  </button>
                ))}
              </div>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="bg-[#121E36] text-[#F8FAFC] border border-white/10 px-4 py-2.5 rounded-lg text-xs font-bold uppercase outline-none">
                {Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {isMonthly ? (
                <select value={month} onChange={e => setMonth(Number(e.target.value))}
                  className="bg-[#121E36] text-[#F8FAFC] border border-white/10 px-4 py-2.5 rounded-lg text-xs font-bold uppercase outline-none">
                  {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{MONTHS_VI[m]}</option>)}
                </select>
              ) : (
                <select value={quarter} onChange={e => setQuarter(Number(e.target.value))}
                  className="bg-[#121E36] text-[#F8FAFC] border border-white/10 px-4 py-2.5 rounded-lg text-xs font-bold uppercase outline-none">
                  {[1,2,3,4].map(q => <option key={q} value={q}>Quý {q}</option>)}
                </select>
              )}
              <button onClick={handleExport} disabled={exporting||!report}
                className="bg-[#F8B486] text-[#051025] px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#FFCCAA] transition-colors disabled:opacity-50">
                {exporting ? "ĐANG XUẤT..." : "📥 XUẤT EXCEL"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {reportLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-[#F8B486] font-bold animate-pulse uppercase">ĐANG TẢI BÁO CÁO...</div>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-5xl mb-6 opacity-30">📊</div>
              <h3 className="text-base font-bold uppercase text-[#F8FAFC] mb-2">CHƯA CÓ THỰC NHẬN</h3>
              <p className="text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">Kỳ này chưa ghi nhận giao dịch nào</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {isMonthly ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <Card label="KHÓA HỌC CÓ THỰC NHẬN" value={String(courses.length)} sub="KHÓA" accent />
                  <Card label="TỔNG HỌC SINH" value={String(report.totalStudents)} sub="HỌC SINH MUA" />
                  <Card label="TỔNG THỰC NHẬN" value={money(report.totalRevenue)} sub="VNĐ" accent />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {months.map((m: number) => (
                    <Card key={m} label={MONTHS_VI[m]}
                      value={money(report.monthlyTotals?.[String(m)]||0)}
                      sub={`${report.monthlyStudentTotals?.[String(m)]||0} HS`} />
                  ))}
                  <Card label="TỔNG QUÝ" value={money(report.grandTotal)} sub={`${report.grandTotalStudents} HS`} accent />
                  <Card label="SỐ KHÓA" value={String(courses.length)} sub="CÓ THỰC NHẬN" />
                </div>
              )}

              {/* ── Revenue Table ── */}
              <div className="bg-[#121E36] border border-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-base uppercase tracking-wider">CHI TIẾT THỰC NHẬN THEO KHÓA HỌC</h3>
                  <p className="text-[10px] font-bold tracking-widest text-[#94A3B8]">{courses.length} KHÓA</p>
                </div>
                <div className="overflow-x-auto">
                  {isMonthly ? (
                    /* ── Monthly Table ── */
                    <table className="w-full text-left" id="revenue-table">
                      <thead className="bg-[#051025]">
                        <tr>
                          <TH w="w-12">STT</TH>
                          <TH>KHÓA HỌC</TH>
                          <TH right>ĐƠN GIÁ</TH>
                          <TH right>SỐ HỌC SINH</TH>
                          <TH right accent>THỰC NHẬN</TH>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {courses.map((c: any, i: number) => (
                          <tr key={c.courseId} className="hover:bg-white/[0.02] transition-colors">
                            <TD muted>{i+1}</TD>
                            <TD>{c.courseName}</TD>
                            <TD right muted>{money(c.coursePrice)} ₫</TD>
                            <TD right>
                              <button onClick={() => openStudentList(c.courseId, c.courseName, month)}
                                className="text-[#F8FAFC] hover:text-[#F8B486] transition-colors hover:underline underline-offset-2 font-bold" title="Xem DS học sinh">
                                {c.studentCount}
                              </button>
                            </TD>
                            <TD right accent bold>{money(c.revenue)} ₫</TD>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#0A1A35] border-t-2 border-[#F8B486]/20">
                        <tr>
                          <td className="px-6 py-5" />
                          <td className="px-6 py-5 text-sm font-extrabold uppercase">TỔNG CỘNG</td>
                          <td className="px-6 py-5" />
                          <td className="px-6 py-5 text-right text-sm font-extrabold">{report.totalStudents}</td>
                          <td className="px-6 py-5 text-right text-lg font-extrabold text-[#F8B486]">{money(report.totalRevenue)} ₫</td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    /* ── Quarterly Table ── */
                    <table className="w-full text-left" id="revenue-table">
                      <thead className="bg-[#051025]">
                        <tr>
                          <TH w="w-12">STT</TH>
                          <TH>KHÓA HỌC</TH>
                          <TH right>ĐƠN GIÁ</TH>
                          {months.map((m: number) => (
                            <th key={m} colSpan={2} className="px-3 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] border-l border-white/5">
                              {MONTHS_VI[m]}
                            </th>
                          ))}
                          <TH right>TỔNG HS</TH>
                          <TH right accent>TỔNG TN</TH>
                        </tr>
                        <tr className="bg-[#051025]/70">
                          <th colSpan={3} />
                          {months.map((m: number) => (
                            <React.Fragment key={m}>
                              <th className="px-3 py-2 text-center text-[9px] font-bold tracking-widest text-[#94A3B8]/60 border-l border-white/5">HS</th>
                              <th className="px-3 py-2 text-center text-[9px] font-bold tracking-widest text-[#94A3B8]/60">TN</th>
                            </React.Fragment>
                          ))}
                          <th colSpan={2} />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {courses.map((c: any, i: number) => (
                          <tr key={c.courseId} className="hover:bg-white/[0.02] transition-colors">
                            <TD muted>{i+1}</TD>
                            <TD>{c.courseName}</TD>
                            <TD right muted>{money(c.coursePrice)}</TD>
                            {months.map((m: number) => {
                              const hs = c.monthlyStudents?.[String(m)]||0;
                              const dt = c.monthlyRevenue?.[String(m)]||0;
                              return (
                                <React.Fragment key={m}>
                                  <td className="px-3 py-4 text-center border-l border-white/5">
                                    {hs > 0 ? (
                                      <button onClick={() => openStudentList(c.courseId, c.courseName, m)}
                                        className="text-sm font-bold text-[#F8FAFC] hover:text-[#F8B486] hover:underline underline-offset-2" title="Xem DS">{hs}</button>
                                    ) : <span className="text-sm text-[#94A3B8]/40">0</span>}
                                  </td>
                                  <td className="px-3 py-4 text-right text-sm font-bold">
                                    {dt > 0 ? <span className="text-[#F8FAFC]">{money(dt)}</span> : <span className="text-[#94A3B8]/40">0</span>}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <TD right bold>{c.totalStudents}</TD>
                            <TD right accent bold>{money(c.total)}</TD>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[#0A1A35] border-t-2 border-[#F8B486]/20">
                        <tr>
                          <td className="px-6 py-5" />
                          <td className="px-6 py-5 text-sm font-extrabold uppercase">TỔNG CỘNG</td>
                          <td className="px-6 py-5" />
                          {months.map((m: number) => (
                            <React.Fragment key={m}>
                              <td className="px-3 py-5 text-center text-sm font-extrabold border-l border-white/5">{report.monthlyStudentTotals?.[String(m)]||0}</td>
                              <td className="px-3 py-5 text-right text-sm font-extrabold">{money(report.monthlyTotals?.[String(m)]||0)}</td>
                            </React.Fragment>
                          ))}
                          <td className="px-6 py-5 text-right text-sm font-extrabold">{report.grandTotalStudents}</td>
                          <td className="px-6 py-5 text-right text-lg font-extrabold text-[#F8B486]">{money(report.grandTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Student Modal ── */}
      {showStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowStudents(false)}>
          <div className="bg-[#121E36] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wider">DANH SÁCH HỌC SINH</h3>
                <p className="text-[10px] font-bold tracking-widest text-[#94A3B8] mt-1">{selectedCourse?.courseName} — {MONTHS_VI[selectedCourse?.month||0]} {year}</p>
              </div>
              <button onClick={() => setShowStudents(false)} className="text-[#94A3B8] hover:text-[#F8FAFC] text-xl font-bold">✕</button>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-20"><div className="text-[#F8B486] font-bold animate-pulse uppercase">ĐANG TẢI...</div></div>
              ) : !courseStudents?.students?.length ? (
                <div className="text-center py-20"><p className="text-sm font-bold uppercase">CHƯA CÓ HỌC SINH</p></div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-[#051025] sticky top-0">
                    <tr>
                      <TH w="w-12">STT</TH>
                      <TH>HỌ VÀ TÊN</TH>
                      <TH>EMAIL</TH>
                      <TH>NGÀY MUA</TH>
                      <TH right accent>THỰC NHẬN</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {courseStudents.students.map((s: any) => (
                      <tr key={s.stt} className="hover:bg-white/[0.02] transition-colors">
                        <TD muted>{s.stt}</TD>
                        <TD>{s.fullName}</TD>
                        <TD muted>{s.email}</TD>
                        <TD muted>{new Date(s.purchaseDate).toLocaleDateString("vi-VN")}</TD>
                        <TD right accent bold>{money(s.amountPaid)} ₫</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {courseStudents?.students?.length > 0 && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between bg-[#0A1A35]">
                <p className="text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">{courseStudents.students.length} HỌC SINH</p>
                <p className="text-sm font-extrabold text-[#F8B486]">Tổng: {money(courseStudents.students.reduce((s: number, x: any) => s+x.amountPaid, 0))} ₫</p>
              </div>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

/* ── Reusable sub-components ── */
import React from "react";

function Card({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`bg-[#121E36] border rounded-xl p-6 hover:border-white/10 transition-colors ${accent ? "border-[#F8B486]/20" : "border-white/5"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${accent ? "text-[#F8B486]" : "text-[#94A3B8]"}`}>{label}</p>
      <p className="text-2xl font-extrabold text-[#F8B486]">{value}</p>
      <p className="text-[10px] font-bold tracking-wider text-[#94A3B8] mt-1">{sub}</p>
    </div>
  );
}

function TH({ children, right, accent, w }: { children: React.ReactNode; right?: boolean; accent?: boolean; w?: string }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest ${accent ? "text-[#F8B486]" : "text-[#94A3B8]"} ${right ? "text-right" : ""} ${w || ""}`}>
      {children}
    </th>
  );
}

function TD({ children, right, accent, bold, muted }: { children: React.ReactNode; right?: boolean; accent?: boolean; bold?: boolean; muted?: boolean }) {
  return (
    <td className={`px-6 py-4 text-sm ${bold ? "font-extrabold" : "font-bold"} ${accent ? "text-[#F8B486]" : muted ? "text-[#94A3B8]" : "text-[#F8FAFC]"} ${right ? "text-right" : ""}`}>
      {children}
    </td>
  );
}
