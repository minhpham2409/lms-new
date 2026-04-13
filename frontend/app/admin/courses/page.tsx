"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { adminApi } from "@/lib/api-service";
import type { Course, User } from "@/types";
import Link from "next/link";

export default function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    level: 'beginner',
    imageUrl: '',
    authorId: '',
  });

  const load = async () => {
    try {
      setIsLoading(true);
      const [coursesData, usersData] = await Promise.all([
        adminApi.getCourses(),
        adminApi.getUsers(),
      ]);
      setCourses(coursesData);
      setInstructors(usersData.filter((u) => u.role === 'teacher' || u.role === 'admin'));
    } catch {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditCourse(null);
    setForm({ title: '', description: '', price: '', level: 'beginner', imageUrl: '', authorId: '' });
    setShowCreate(true);
  };

  const openEdit = (course: Course) => {
    setEditCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      price: course.price?.toString() ?? '',
      level: course.level ?? 'beginner',
      imageUrl: course.imageUrl ?? '',
      authorId: course.authorId ?? '',
    });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      setSaving(true);
      const data = {
        title: form.title,
        description: form.description,
        price: form.price ? parseFloat(form.price) : 0,
        level: form.level,
        imageUrl: form.imageUrl || undefined,
        authorId: form.authorId || undefined,
      };
      if (editCourse) {
        await adminApi.updateCourse(editCourse.id, data);
        toast.success('Course updated');
      } else {
        await adminApi.createCourse(data);
        toast.success('Course created');
      }
      setShowCreate(false);
      load();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Course deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await adminApi.publishCourse(id);
      setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status: 'published', isPublished: true } : c));
      toast.success('Published');
    } catch {
      toast.error('Failed to publish');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-16 mb-6">
        <h1 className="text-3xl font-bold">Courses Management</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Course
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollments</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{course.title}</div>
                    </TableCell>
                    <TableCell>{course.author?.username ?? '—'}</TableCell>
                    <TableCell>
                      {course.price != null && course.price > 0
                        ? `${course.price.toLocaleString('vi-VN')}đ`
                        : 'Free'}
                    </TableCell>
                    <TableCell className="capitalize">{course.level ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status ?? 'draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>{course._count?.enrollments ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(course)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {course.status !== 'published' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handlePublish(course.id)}>
                            Publish
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &ldquo;{course.title}&rdquo; and all its data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(course.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {courses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No courses yet</div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (VND)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0 = free" />
              </div>
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Author</Label>
              <Select value={form.authorId} onValueChange={(v) => setForm({ ...form, authorId: v })}>
                <SelectTrigger><SelectValue placeholder="Select author" /></SelectTrigger>
                <SelectContent>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
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
