'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-state';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Award, ArrowLeft, CheckCircle } from 'lucide-react';
import { coursesApi, progressApi } from '@/lib/api-service';

interface Course {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    username: string;
  };
}

interface CertificateProps {
  courseId: string;
}

export default function Certificate({ courseId }: CertificateProps) {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [completedAt, setCompletedAt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadCertificateData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const courseData = await coursesApi.getById(courseId) as Course;
      setCourse(courseData);
      
      // Get progress from progress API
      let overallProgress = 0;
      try {
        const progressData = await progressApi.getCourse(courseId);
        overallProgress = progressData.overallProgress ?? 0;
      } catch {
        overallProgress = 0;
      }
      
      setProgress(overallProgress);
      
      if (overallProgress >= 100) {
        setCompletedAt(new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }));
      } else {
        toast.error('You need to complete all lessons to get a certificate');
        router.push(`/courses/${courseId}`);
      }
      
    } catch (error) {
      console.error('Error loading certificate data:', error);
      toast.error('Failed to load certificate data');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }
    
    loadCertificateData();
  }, [isLoggedIn, courseId, router, loadCertificateData]);

  const generateCertificate = async () => {
    if (!certificateRef.current) return;

    setIsGenerating(true);
    
    try {
      // Use html2canvas to convert the certificate to image
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        ignoreElements: (element) => element.tagName === 'SCRIPT' || element.tagName === 'STYLE'
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `certificate-${course?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success('Certificate downloaded successfully!');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      
      // Fallback: Show a message with instructions to screenshot
      toast.error('Certificate generation failed. Please take a screenshot of the certificate below to save it.');
      
      // Alternative: Try to print the certificate
      try {
        const printWindow = window.open('', '_blank');
        if (printWindow && certificateRef.current) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Certificate - ${course?.title}</title>
                <style>
                  body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; display: flex; justify-content: center; background: #f1f5f9; }
                  .certificate { 
                    background: #ffffff;
                    border: 16px solid #1e3a8a;
                    box-shadow: inset 0 0 0 4px #eab308, 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    padding: 60px;
                    text-align: center;
                    width: 800px;
                    height: 550px;
                    position: relative;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                  }
                  .inner-border {
                    position: absolute;
                    top: 16px; left: 16px; right: 16px; bottom: 16px;
                    border: 2px solid #eab308;
                    opacity: 0.5;
                    pointer-events: none;
                  }
                  .icon { 
                    background: linear-gradient(135deg, #fde047, #eab308, #ca8a04);
                    color: white;
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    border: 2px solid #fef08a;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    font-size: 32px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  }
                  .title { font-size: 48px; font-weight: bold; color: #1e3a8a; margin: 0 0 10px; letter-spacing: 4px; }
                  .subtitle { font-size: 18px; color: #64748b; letter-spacing: 6px; margin: 0 0 30px; }
                  .text { font-size: 18px; color: #475569; font-style: italic; margin-bottom: 15px; }
                  .name { font-size: 36px; font-weight: bold; color: #0f172a; margin: 0 0 15px; }
                  .course { font-size: 28px; font-weight: bold; color: #1e3a8a; margin: 0 0 40px; }
                  .signatures { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px; margin-top: auto; }
                  .sig-block { text-align: center; width: 180px; }
                  .sig-line { border-bottom: 1px solid #94a3b8; margin-bottom: 8px; padding-bottom: 8px; font-family: 'Brush Script MT', cursive; font-size: 24px; color: #334155; }
                  .sig-label { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-family: Arial, sans-serif; }
                  .seal { width: 60px; height: 60px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: #2563eb; font-size: 24px; }
                </style>
              </head>
              <body>
                <div class="certificate">
                  <div class="inner-border"></div>
                  <div>
                    <div class="icon">★</div>
                    <h1 class="title">CERTIFICATE</h1>
                    <p class="subtitle">OF COMPLETION</p>
                    <p class="text">This is to certify that</p>
                    <p class="name">${user?.firstName ?? user?.username ?? 'Student'}</p>
                    <p class="text">has successfully completed the course</p>
                    <p class="course">${course?.title}</p>
                  </div>
                  <div class="signatures">
                    <div class="sig-block">
                      <div class="sig-line">${course?.author.username}</div>
                      <div class="sig-label">Instructor</div>
                    </div>
                    <div class="seal">✓</div>
                    <div class="sig-block">
                      <div class="sig-line" style="font-family: 'Times New Roman', serif; font-size: 18px;">${completedAt}</div>
                      <div class="sig-label">Date Issued</div>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      } catch (printError) {
        console.error('Print fallback also failed:', printError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => router.push('/courses')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Course Completed
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6" />
            Certificate of Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Congratulations! You have successfully completed the course.
              </p>
              <Button
                onClick={generateCertificate}
                disabled={isGenerating}
                size="lg"
                className="mb-6 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </>
                )}
              </Button>
            </div>

            {/* Certificate Preview */}
            <div className="overflow-x-auto pb-4 flex justify-center">
              <div
                ref={certificateRef}
                className="relative bg-white shrink-0"
                style={{ 
                  width: '800px',
                  height: '560px',
                  border: '14px solid #1e3a8a', // Navy blue border
                  boxShadow: 'inset 0 0 0 4px #eab308', // Gold inner accent
                  padding: '40px',
                  boxSizing: 'border-box',
                  fontFamily: '"Times New Roman", Times, serif'
                }}
              >
                {/* Decorative Inner Border */}
                <div 
                  style={{
                    position: 'absolute',
                    top: '16px', left: '16px', right: '16px', bottom: '16px',
                    border: '2px solid #eab308',
                    opacity: 0.4,
                    pointerEvents: 'none'
                  }}
                />

                <div className="relative z-10 h-full flex flex-col justify-between pt-4">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {/* Gold Ribbon/Seal */}
                      <div style={{
                        width: '72px', height: '72px',
                        background: 'linear-gradient(135deg, #fde047, #eab308, #ca8a04)',
                        borderRadius: '50%',
                        border: '2px solid #fef08a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        <Award style={{ color: 'white', width: '36px', height: '36px' }} />
                      </div>
                    </div>
                    
                    <h1 style={{ color: '#1e3a8a', fontSize: '42px', fontWeight: 'bold', margin: '0 0 8px 0', letterSpacing: '4px' }}>
                      CERTIFICATE
                    </h1>
                    <h2 style={{ color: '#64748b', fontSize: '16px', letterSpacing: '6px', margin: '0 0 24px 0' }}>
                      OF COMPLETION
                    </h2>
                    
                    <p style={{ color: '#475569', fontSize: '18px', fontStyle: 'italic', margin: '0 0 12px 0' }}>
                      This is to certify that
                    </p>
                    
                    <p style={{ color: '#0f172a', fontSize: '32px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      {user?.firstName ?? user?.username ?? 'Student'}
                    </p>
                    
                    <p style={{ color: '#475569', fontSize: '18px', fontStyle: 'italic', margin: '0 0 24px 0' }}>
                      has successfully completed the course
                    </p>
                    
                    <p style={{ color: '#1e3a8a', fontSize: '26px', fontWeight: 'bold', margin: '0 0 12px 0' }}>
                      {course.title}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end px-12 pb-2">
                    <div className="text-center w-48">
                      <div style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '4px', marginBottom: '8px' }}>
                        {/* Simulated cursive signature font */}
                        <span style={{ fontFamily: '"Brush Script MT", cursive', fontSize: '24px', color: '#334155' }}>
                          {course.author.username}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Arial, sans-serif' }}>
                        Instructor
                      </p>
                    </div>
                    
                    <div className="text-center w-24">
                      <div style={{
                        width: '56px', height: '56px', margin: '0 auto',
                        background: '#eff6ff', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CheckCircle style={{ color: '#2563eb', width: '28px', height: '28px' }} />
                      </div>
                    </div>
                    
                    <div className="text-center w-48">
                      <div style={{ borderBottom: '1px solid #94a3b8', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px', color: '#334155' }}>
                          {completedAt}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Arial, sans-serif' }}>
                        Date Issued
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
