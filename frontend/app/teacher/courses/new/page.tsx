"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { useAuth } from "@/components/auth/auth-state";
import { ArrowLeft, ArrowRight, BookOpen, Layers, Play, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { StepIndicator } from "@/components/courses/step-indicator";
import { Step1BasicInfo } from "./step-1";
import { Step2Sections } from "./step-2";
import { Step3Lessons } from "./step-3";
import { Step4Review } from "./step-4";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const steps = [
  { label: "Thông tin cơ bản", icon: BookOpen },
  { label: "Thêm chương", icon: Layers },
  { label: "Bài giảng & Nội dung", icon: Play },
  { label: "Xem lại & Lưu", icon: CheckCircle2 },
];

export default function CourseWizardPage() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("0");
  const [allowPlatformPromotions, setAllowPlatformPromotions] = useState(true);

  // Step 2 & 3 State
  const [sections, setSections] = useState<any[]>([]);

  const handleNext = () => {
    if (currentStep === 0 && !title.trim()) { toast.error("Vui lòng nhập tên khóa học"); return; }
    if (currentStep < 3) setCurrentStep(curr => curr + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(curr => curr - 1);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { toast.error("Thiếu tên khóa học"); return; }
    if (!token) { toast.error("Chưa đăng nhập"); return; }
    // Validate sections and lessons before creating course
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      if (!sec.title.trim()) {
        toast.error(`Vui lòng nhập tên cho chương thứ ${si + 1}`);
        return;
      }
      for (let li = 0; li < sec.lessons.length; li++) {
        const les = sec.lessons[li];
        if (!les.title.trim()) {
          toast.error(`Vui lòng nhập tên cho bài học thứ ${li + 1} trong chương "${sec.title}"`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      // 1. Create course
      const courseRes = await fetch(`${API}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: Number(price) || 0,
          status: publish ? "published" : "draft",
          allowPlatformPromotions,
        }),
      });
      if (!courseRes.ok) throw new Error("Lỗi tạo khóa học");
      const course = await courseRes.json();

      // 2. Create sections
      for (let si = 0; si < sections.length; si++) {
        const sec = sections[si];

        const secRes = await fetch(`${API}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: sec.title.trim(), courseId: course.id, order: si + 1 }),
        });
        if (!secRes.ok) continue;
        const savedSection = await secRes.json();

        // 3. Create lessons
        let lessonErrors = 0;
        for (let li = 0; li < sec.lessons.length; li++) {
          const les = sec.lessons[li];

          const lesBody = {
            title: les.title.trim(),
            sectionId: savedSection.id,
            ...(les.videoUrl ? { videoUrl: les.videoUrl } : {}),
          };

          const lesRes = await fetch(`${API}/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(lesBody),
          });

          if (!lesRes.ok) {
            const errData = await lesRes.json().catch(() => ({}));
            console.error("Lesson create error:", lesRes.status, errData);
            lessonErrors++;
            continue;
          }
          const savedLesson = await lesRes.json();

          // 4. Create Material if document exists
          if (les.documentUrl) {
            await fetch(`${API}/materials`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                title: les.documentOriginalName || "Tài liệu đính kèm",
                fileUrl: les.documentUrl,
                fileType: "document",
                fileSize: 1024,
                lessonId: savedLesson.id,
              }),
            });
          }

          // 5. Create Assignment if image exists
          if (les.assignmentImageUrl) {
            await fetch(`${API}/assignments`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                title: `Bài tập: ${les.title}`,
                description: les.assignmentImageUrl,
                type: "essay",
                maxScore: 10,
                lessonId: savedLesson.id,
              }),
            });
          }
        }
        if (lessonErrors > 0) toast.warning(`${lessonErrors} bài học không lưu được`);
      }

      toast.success(publish ? "Khóa học đã xuất bản!" : "Đã lưu nháp!");
      router.push("/teacher");
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo khóa học");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center gap-3 mb-8">
            <Link href="/teacher" className="btn-ghost px-2 py-2"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-2xl font-extrabold">Tạo khóa học mới</h1>
          </div>

          <StepIndicator steps={steps} current={currentStep} />

          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <Step1BasicInfo
                title={title} setTitle={setTitle}
                description={description} setDescription={setDescription}
                category={category} setCategory={setCategory}
                level={level} setLevel={setLevel}
                price={price} setPrice={setPrice}
                allowPlatformPromotions={allowPlatformPromotions} setAllowPlatformPromotions={setAllowPlatformPromotions}
              />
            )}
            {currentStep === 1 && <Step2Sections sections={sections} setSections={setSections} />}
            {currentStep === 2 && <Step3Lessons sections={sections} setSections={setSections} token={token} />}
            {currentStep === 3 && (
              <Step4Review title={title} description={description} category={category} level={level} price={price} sections={sections} />
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={handlePrev} disabled={currentStep === 0} className="btn-secondary px-6" style={{ opacity: currentStep === 0 ? 0 : 1 }}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
            </button>
            
            {currentStep < 3 ? (
              <button onClick={handleNext} className="btn-primary px-8">
                Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary px-6">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu nháp"}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary px-8" style={{ background: "#10b981", borderColor: "#10b981" }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xuất bản khóa học"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
