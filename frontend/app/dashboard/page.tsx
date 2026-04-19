'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UnifiedPageShell } from '@/components/layout/unified-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Play,
  CheckCircle,
  Award,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  enrollmentsApi,
  progressApi,
  certificatesApi,
  parentsApi,
} from '@/lib/api-service';
import type { Enrollment, Certificate, ParentChild } from '@/types';
import {
  DashboardStatCard,
  SimpleBarChart,
} from '@/components/dashboard/dashboard-chart-components';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [parentInvites, setParentInvites] = useState<ParentChild[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.role) return;
    const r = session.user.role;
    if (r === 'admin') router.replace('/admin');
    else if (r === 'teacher') router.replace('/teacher');
    else if (r === 'parent') router.replace('/parent');
  }, [status, session, router]);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      const [enrollmentsData, certsData] = await Promise.all([
        enrollmentsApi.getMyCourses(),
        certificatesApi.getMine().catch(() => []),
      ]);
      setEnrollments(enrollmentsData);
      setCertificates(certsData);

      const pMap: Record<string, number> = {};
      await Promise.all(
        enrollmentsData.map(async (e) => {
          try {
            const p = await progressApi.getCourse(e.course.id);
            pMap[e.course.id] = p.overallProgress ?? 0;
          } catch {}
        })
      );
      setProgressMap(pMap);

      try {
        const invites = await parentsApi.getIncomingForStudent();
        setParentInvites(invites || []);
      } catch (err) {
        console.error('Failed to load parent invites:', err);
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      loadData();
    }
  }, [session?.accessToken, loadData]);

  const handleAcceptInvite = async (id: string) => {
    setAcceptingId(id);
    try {
      await parentsApi.acceptParentLink(id);
      toast.success('Chấp nhận lời mời từ phụ huynh');
      setParentInvites((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể chấp nhận lời mời'
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectInvite = async (id: string) => {
    setRejectingId(id);
    try {
      await parentsApi.rejectParentLink(id);
      toast.success('Từ chối lời mời từ phụ huynh');
      setParentInvites((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể từ chối lời mời'
      );
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <UnifiedPageShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </UnifiedPageShell>
    );
  }

  const avgProgress =
    enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + (progressMap[e.course.id] ?? 0), 0) /
        enrollments.length
      : 0;

  const courseProgressData = enrollments.slice(0, 5).map((e) => ({
    label: e.course.title.substring(0, 15),
    value: progressMap[e.course.id] ?? 0,
    color: 'bg-blue-500',
  }));

  return (
    <UnifiedPageShell>
      <div className="space-y-6 py-12 px-4 md:px-6 max-w-6xl mx-auto">
        <div>
          <h1 className="section-title mb-2">Bảng điều khiển học sinh</h1>
          <p className="section-content">
            Theo dõi tiến độ học tập và các khóa học của bạn
          </p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DashboardStatCard
              icon={<BookOpen className="h-6 w-6" />}
              label="Khóa học"
              value={enrollments.length}
              type="primary"
            />
            <DashboardStatCard
              icon={<Award className="h-6 w-6" />}
              label="Chứng chỉ"
              value={certificates.length}
              type="success"
            />
            <DashboardStatCard
              icon={<Trophy className="h-6 w-6" />}
              label="Tiến độ trung bình"
              value={`${Math.round(avgProgress)}%`}
              type="info"
            />
          </div>
        )}

        {/* Chart */}
        {courseProgressData.length > 0 && (
          <SimpleBarChart
            title="Tiến độ các khóa học"
            data={courseProgressData}
          />
        )}

        {/* Parent Invites */}
        {parentInvites.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-amber-900 dark:text-amber-50">
              Lời mời từ phụ huynh
            </h2>
            <div className="space-y-3">
              {parentInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-amber-100 dark:border-amber-900"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-50">
                      {invite.parent?.username}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {invite.parent?.email}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.id)}
                      disabled={acceptingId === invite.id}
                    >
                      {acceptingId === invite.id ? 'Đang xử lý...' : 'Chấp nhận'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectInvite(invite.id)}
                      disabled={rejectingId === invite.id}
                    >
                      {rejectingId === invite.id ? 'Đang xử lý...' : 'Từ chối'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="in-progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="in-progress">Đang học</TabsTrigger>
            <TabsTrigger value="completed">Hoàn thành</TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4">
            {enrollments.filter((e) => (progressMap[e.course.id] ?? 0) < 100).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Bạn chưa đăng ký khóa học nào
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments
                  .filter((e) => (progressMap[e.course.id] ?? 0) < 100)
                  .map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      progress={progressMap[enrollment.course.id] ?? 0}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {enrollments.filter((e) => (progressMap[e.course.id] ?? 0) === 100).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Bạn chưa hoàn thành khóa học nào
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments
                  .filter((e) => (progressMap[e.course.id] ?? 0) === 100)
                  .map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      progress={progressMap[enrollment.course.id] ?? 0}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Certificates */}
        {certificates.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-50">
              Chứng chỉ của bạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-6"
                >
                  <Award className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                    {cert.course?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Hoàn thành:{' '}
                    {new Date(cert.issuedAt).toLocaleDateString('vi-VN')}
                  </p>
                  <Link href={`/certificates/${cert.id}`}>
                    <Button variant="outline" size="sm" className="mt-3">
                      Xem chứng chỉ
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </UnifiedPageShell>
  );
}

interface CourseCardProps {
  enrollment: Enrollment;
  progress: number;
}

function CourseCard({ enrollment, progress }: CourseCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition">
      {enrollment.course.imageUrl && (
        <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 overflow-hidden">
          <img
            src={enrollment.course.imageUrl}
            alt={enrollment.course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-50 line-clamp-2">
            {enrollment.course.title}
          </h3>
          {progress === 100 && (
            <Badge className="ml-2 bg-green-100 text-green-700">Hoàn thành</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Giáo viên: {enrollment.course.author?.username}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tiến độ</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Link href={`/courses/${enrollment.course.id}`}>
          <Button className="w-full mt-4 bg-blue-700 hover:bg-blue-800 text-white">
            <Play className="w-4 h-4 mr-2" />
            Tiếp tục học
          </Button>
        </Link>
      </div>
    </div>
  );
}
