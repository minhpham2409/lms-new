'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/unified-page-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  BookOpen,
  Edit3,
  Save,
  X,
  Trophy,
  Calendar,
  CheckCircle,
  Award,
  Users,
  GraduationCap,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { enrollmentsApi, authApi, certificatesApi } from '@/lib/api-service';
import type { Enrollment, Certificate } from '@/types';

function AccountSettingsCard({
  session,
  isEditing,
  setIsEditing,
  editData,
  setEditData,
  saving,
  onSave,
}: {
  session: NonNullable<ReturnType<typeof useSession>['data']>;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editData: { firstName: string; lastName: string; bio: string };
  setEditData: Dispatch<SetStateAction<{ firstName: string; lastName: string; bio: string }>>;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Account</CardTitle>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-4 h-4 mr-2" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            {isEditing ? (
              <Input
                value={editData.firstName}
                onChange={(e) => setEditData((d) => ({ ...d, firstName: e.target.value }))}
                placeholder="First name"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded-md">
                {(session.user as { firstName?: string }).firstName || '—'}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            {isEditing ? (
              <Input
                value={editData.lastName}
                onChange={(e) => setEditData((d) => ({ ...d, lastName: e.target.value }))}
                placeholder="Last name"
              />
            ) : (
              <p className="text-sm p-2 bg-muted rounded-md">
                {(session.user as { lastName?: string }).lastName || '—'}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <p className="text-sm p-2 bg-muted rounded-md">{session.user?.email}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <p className="text-sm p-2 bg-muted rounded-md capitalize">{session.user?.role}</p>
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2 pt-2">
            <Button onClick={onSave} size="sm" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '', bio: '' });

  const role = session?.user?.role;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  useEffect(() => {
    if (!session?.accessToken) return;
    if (role === 'parent' || role === 'teacher') {
      setLoading(false);
      return;
    }
    Promise.all([
      enrollmentsApi.getMyCourses(),
      certificatesApi.getMine().catch(() => []),
    ])
      .then(([e, c]) => {
        setEnrollments(e);
        setCertificates(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.accessToken, role]);

  useEffect(() => {
    if (session?.user) {
      setEditData({
        firstName: (session.user as { firstName?: string }).firstName ?? '',
        lastName: (session.user as { lastName?: string }).lastName ?? '',
        bio: '',
      });
    }
  }, [session]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await authApi.updateProfile(editData);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) return null;

  if (role === 'parent') {
    return (
      <DashboardLayout contentClassName="py-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Parent account</h1>
            <p className="text-muted-foreground mt-1">
              Manage links to your children&apos;s learner accounts and view their progress from the Family overview — not from course enrollment here.
            </p>
            <Badge variant="outline" className="capitalize mt-2">
              parent
            </Badge>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Family overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Send link requests, accept status, and see each child&apos;s study summary.
            </p>
            <Button asChild>
              <Link href="/parent">
                Open parent dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Alerts about your account and links appear in the notification center.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications">Open notifications</Link>
            </Button>
          </CardContent>
        </Card>

        <AccountSettingsCard
          session={session}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editData={editData}
          setEditData={setEditData}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
    );
  }

  if (role === 'teacher') {
    return (
      <DashboardLayout contentClassName="py-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Teacher account</h1>
            <p className="text-muted-foreground mt-1">
              Create and submit courses for admin approval from the teaching dashboard. This page is only for your account details.
            </p>
            <Badge variant="outline" className="capitalize mt-2">
              teacher
            </Badge>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Teaching
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-muted-foreground">Courses, sections, lessons, and review workflow.</p>
            <Button asChild>
              <Link href="/teacher">
                Open teacher dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/notifications">Open notifications</Link>
            </Button>
          </CardContent>
        </Card>

        <AccountSettingsCard
          session={session}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editData={editData}
          setEditData={setEditData}
          saving={saving}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
    );
  }

  const completedCourses = enrollments.filter((e) => e.progress >= 100).length;
  const totalLessons = enrollments.reduce(
    (acc, e) => acc + (e.course.sections?.reduce((s, sec) => s + (sec.lessons?.length ?? 0), 0) ?? 0),
    0,
  );

  return (
    <DashboardLayout contentClassName="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{session.user?.name || 'User'}</h1>
            <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {session.user?.email}
            </p>
            {session.user?.role === 'student' && (
              <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
                <span className="font-medium text-foreground">Parent link:</span> your parent can enter this
                account&apos;s <span className="font-medium">email</span> or <span className="font-medium">username</span>{' '}
                on their Parent page (no need to copy a long ID). Optional:{' '}
                <span className="font-mono">{(session.user as { id?: string }).id}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member
              </Badge>
              <Badge variant="outline" className="capitalize">
                {session.user?.role ?? 'student'}
              </Badge>
              {certificates.length > 0 && (
                <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-700 border-yellow-200">
                  <Trophy className="w-3 h-3" />
                  {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{enrollments.length}</div>
              <p className="text-xs text-muted-foreground">Enrolled Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{completedCourses}</div>
              <p className="text-xs text-muted-foreground">Completed Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalLessons}</div>
              <p className="text-xs text-muted-foreground">Total Lessons</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">No courses enrolled yet</p>
                <Button asChild>
                  <Link href="/courses">Browse Courses</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-4 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{enrollment.course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">by {enrollment.course.author?.username}</p>
                    </div>
                    <Badge variant={enrollment.progress >= 100 ? 'default' : 'secondary'} className="ml-2 shrink-0">
                      {enrollment.progress >= 100 ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(enrollment.progress ?? 0)}%</span>
                    </div>
                    <Progress value={enrollment.progress ?? 0} className="h-1.5" />
                    <div className="flex justify-end mt-2">
                      <Button asChild size="sm">
                        <Link href={`/courses/${enrollment.course.id}`}>
                          {enrollment.progress >= 100 ? 'Review' : 'Continue'}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Trophy className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">No certificates yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete courses to earn certificates</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="border-yellow-200 bg-yellow-50/30">
                  <CardContent className="pt-5 flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-full shrink-0">
                      <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{cert.course?.title ?? 'Course'}</h4>
                      <p className="text-sm text-muted-foreground">Issued {new Date(cert.issuedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{cert.code}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <AccountSettingsCard
            session={session}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editData={editData}
            setEditData={setEditData}
            saving={saving}
            onSave={handleSave}
          />

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive updates about your courses</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/notifications">Configure</Link>
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Privacy</h4>
                    <p className="text-sm text-muted-foreground">Manage your data</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/privacy">Privacy policy</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
