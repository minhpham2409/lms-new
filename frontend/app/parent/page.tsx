'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Users, UserPlus, BookOpen, TrendingUp, Clock } from 'lucide-react';
import { parentsApi } from '@/lib/api-service';
import type { ParentChild, Enrollment } from '@/types';

export default function ParentPage() {
  const { data: session, status } = useSession();
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ParentChild[]>([]);
  const [childCourses, setChildCourses] = useState<Record<string, Enrollment[]>>({});
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState('');
  const [linking, setLinking] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (!session?.accessToken) return;
    Promise.all([
      parentsApi.getChildren(),
      parentsApi.getPendingRequests().catch(() => []),
    ]).then(([c, p]) => {
      setChildren(c);
      setPendingRequests(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [session?.accessToken]);

  const loadChildCourses = async (childId: string) => {
    if (childCourses[childId]) {
      setSelectedChild(childId);
      return;
    }
    try {
      const courses = await parentsApi.getChildCourses(childId);
      setChildCourses((prev) => ({ ...prev, [childId]: courses }));
      setSelectedChild(childId);
    } catch {
      toast.error('Failed to load child courses');
    }
  };

  const linkChild = async () => {
    if (!childId.trim()) return;
    try {
      setLinking(true);
      await parentsApi.linkChild(childId);
      toast.success('Link request sent! The child must accept it.');
      setChildId('');
    } catch {
      toast.error('Failed to send link request');
    } finally {
      setLinking(false);
    }
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

  const selectedCourses = selectedChild ? (childCourses[selectedChild] ?? []) : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <MainNav />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6" /> Parent Dashboard
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Link a Child
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Child's user ID"
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                  />
                  <Button className="w-full" onClick={linkChild} disabled={linking || !childId}>
                    {linking ? 'Sending...' : 'Send Request'}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Enter your child&apos;s account ID. They must accept the request.
                  </p>
                </CardContent>
              </Card>

              {pendingRequests.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-yellow-700">Pending Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="text-sm p-2 bg-yellow-50 rounded flex items-center justify-between">
                        <span className="text-muted-foreground">{req.child?.username ?? req.childId}</span>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">My Children</CardTitle>
                </CardHeader>
                <CardContent>
                  {children.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No children linked yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {children.map((link) => (
                        <button
                          key={link.id}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            selectedChild === link.childId
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted border-transparent'
                          }`}
                          onClick={() => loadChildCourses(link.childId)}
                        >
                          <div className="font-medium text-sm">{link.child?.username ?? link.childId}</div>
                          <div className="text-xs text-muted-foreground">{link.child?.email}</div>
                          <Badge variant="secondary" className="text-xs mt-1">{link.status}</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              {!selectedChild ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-16">
                      <Users className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a child</h3>
                      <p className="text-gray-400">Click on a child to view their learning progress</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4 pb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-xl font-bold">{selectedCourses.length}</div>
                          <p className="text-xs text-muted-foreground">Courses</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="text-xl font-bold">
                            {selectedCourses.filter((e) => e.progress >= 100).length}
                          </div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-xl font-bold">
                            {selectedCourses.filter((e) => e.progress > 0 && e.progress < 100).length}
                          </div>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Course Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCourses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>Not enrolled in any courses</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedCourses.map((enrollment) => (
                            <div key={enrollment.id} className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{enrollment.course.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    by {enrollment.course.author?.username}
                                  </p>
                                </div>
                                <Badge
                                  variant={enrollment.progress >= 100 ? 'default' : 'secondary'}
                                  className="text-xs shrink-0"
                                >
                                  {Math.round(enrollment.progress ?? 0)}%
                                </Badge>
                              </div>
                              <Progress value={enrollment.progress ?? 0} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
