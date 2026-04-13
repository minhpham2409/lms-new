'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { MainNav } from '@/components/layout/main-nav';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  Eye,
  Send,
  LayoutList,
} from 'lucide-react';
import { coursesApi } from '@/lib/api-service';
import type { Course } from '@/types';

export default function TeacherPage() {
  const { data: session, status } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    level: 'beginner',
    imageUrl: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/signin');
    if (status === 'authenticated' && session?.user?.role === 'student') redirect('/dashboard');
  }, [status, session]);

  useEffect(() => {
    if (!session?.accessToken) return;
    coursesApi.getMyCourses()
      .then(setCourses)
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const openCreate = () => {
    setForm({ title: '', description: '', price: '', level: 'beginner', imageUrl: '' });
    setEditCourse(null);
    setShowCreate(true);
  };

  const openEdit = (course: Course) => {
    setForm({
      title: course.title,
      description: course.description,
      price: course.price?.toString() ?? '',
      level: course.level ?? 'beginner',
      imageUrl: course.imageUrl ?? '',
    });
    setEditCourse(course);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      setSaving(true);
      const data = {
        title: form.title,
        description: form.description,
        price: form.price ? parseFloat(form.price) : 0,
        level: form.level,
        imageUrl: form.imageUrl || undefined,
      };
      if (editCourse) {
        const updated = await coursesApi.update(editCourse.id, data);
        setCourses((prev) => prev.map((c) => (c.id === editCourse.id ? updated : c)));
        toast.success('Course updated!');
      } else {
        const created = await coursesApi.create(data);
        setCourses((prev) => [created, ...prev]);
        toast.success('Course created!');
      }
      setShowCreate(false);
    } catch {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try {
      await coursesApi.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success('Course deleted');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const handleSubmitReview = async (courseId: string) => {
    try {
      await coursesApi.submitForReview(courseId);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, status: 'pending' } : c))
      );
      toast.success('Submitted for review!');
    } catch {
      toast.error('Failed to submit for review');
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + (c._count?.enrollments ?? 0), 0);
  const publishedCount = courses.filter((c) => c.status === 'published').length;

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <MainNav />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" /> Teacher Dashboard
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Manage your courses and students
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> New Course
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <p className="text-xs text-muted-foreground">Total Courses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{publishedCount}</div>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h3>
                  <p className="text-gray-500 mb-6">Create your first course to start teaching</p>
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" /> Create Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                    {course.imageUrl && (
                      <img src={course.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={
                          course.status === 'published' ? 'default' :
                          course.status === 'pending' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {course.status ?? 'draft'}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-tight line-clamp-2">{course.title}</CardTitle>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course._count?.enrollments ?? 0} students
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {course.sections?.length ?? 0} sections
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        {course.price != null && course.price > 0
                          ? `${course.price.toLocaleString('vi-VN')}đ`
                          : 'Free'}
                      </span>
                      {course.level && (
                        <Badge variant="outline" className="text-xs capitalize">{course.level}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="flex-1" asChild>
                        <Link href={`/teacher/courses/${course.id}`}>
                          <LayoutList className="h-3.5 w-3.5 mr-1" />
                          Manage
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2"
                        onClick={() => openEdit(course)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {course.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-2 text-blue-600"
                          onClick={() => handleSubmitReview(course.id)}
                          title="Submit for review"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2 text-red-500"
                        onClick={() => handleDelete(course.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Course title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Course description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (VND)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0 = free"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editCourse ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
