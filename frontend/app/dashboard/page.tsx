'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Trophy, TrendingUp, Play, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { enrollmentsApi, progressApi, certificatesApi } from '@/lib/api-service';
import type { Enrollment, Certificate } from '@/types';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      setLoading(true);
      setError(null);
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
          } catch {
            pMap[e.course.id] = e.progress ?? 0;
          }
        })
      );
      setProgressMap(pMap);
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getTotalLessons = () =>
    enrollments.reduce((acc, e) => {
      const count = e.course.sections?.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0) ?? 0;
      return acc + count;
    }, 0);

  const getAvgProgress = () => {
    if (!enrollments.length) return 0;
    const sum = enrollments.reduce((acc, e) => acc + (progressMap[e.course.id] ?? 0), 0);
    return Math.round(sum / enrollments.length);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadData}>Try Again</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1 w-full bg-gray-50/50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {session?.user?.name || 'Learner'}!
            </h1>
            <p className="text-gray-500">Track your learning progress</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enrollments.length}</div>
                <p className="text-xs text-gray-400 mt-1">Active learning paths</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Lessons</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalLessons()}</div>
                <p className="text-xs text-gray-400 mt-1">Across all courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getAvgProgress()}%</div>
                <p className="text-xs text-gray-400 mt-1">Overall completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Certificates</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certificates.length}</div>
                <p className="text-xs text-gray-400 mt-1">Earned so far</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              {enrollments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h3>
                      <p className="text-gray-500 mb-4">Start your learning journey today</p>
                      <Button asChild>
                        <Link href="/courses">Browse Courses</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {enrollments.map((enrollment) => {
                    const progress = progressMap[enrollment.course.id] ?? enrollment.progress ?? 0;
                    const totalLessons = enrollment.course.sections?.reduce(
                      (acc, s) => acc + (s.lessons?.length ?? 0), 0
                    ) ?? 0;
                    const completed = progress === 100;

                    return (
                      <Card key={enrollment.id} className="hover:shadow-md transition-shadow overflow-hidden">
                        {enrollment.course.imageUrl && (
                          <div className="h-36 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                            <img
                              src={enrollment.course.imageUrl}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {!enrollment.course.imageUrl && (
                          <div className="h-36 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white/70" />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base leading-tight line-clamp-2">
                              {enrollment.course.title}
                            </CardTitle>
                            <Badge variant={completed ? 'default' : 'secondary'} className="shrink-0">
                              {completed ? 'Done' : `${Math.round(progress)}%`}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            by {enrollment.course.author?.username}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-gray-400 mt-1">{totalLessons} lessons</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" asChild className="flex-1">
                              <Link href={`/courses/${enrollment.course.id}`}>
                                {progress === 0 ? (
                                  <><Play className="h-3 w-3 mr-1" /> Start</>
                                ) : (
                                  <><TrendingUp className="h-3 w-3 mr-1" /> Continue</>
                                )}
                              </Link>
                            </Button>
                            {completed && (
                              <Button variant="outline" size="sm" asChild>
                                <Link href="/certificates">
                                  <Award className="h-3 w-3 mr-1" /> Certificate
                                </Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="certificates">
              {certificates.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">No certificates yet</h3>
                      <p className="text-gray-500">Complete courses to earn certificates</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {certificates.map((cert) => (
                    <Card key={cert.id} className="border-yellow-200 bg-yellow-50/30">
                      <CardContent className="pt-6 flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{cert.course?.title ?? 'Course'}</h4>
                          <p className="text-sm text-gray-500">
                            Issued {new Date(cert.issuedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{cert.code}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
