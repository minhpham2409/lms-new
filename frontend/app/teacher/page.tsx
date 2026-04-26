'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Plus,
  Star,
  Users,
  TrendingUp,
} from 'lucide-react';
import { coursesApi } from '@/lib/api-service';
import type { Course } from '@/types';
import {
  DashboardStatCard,
  SimpleBarChart,
} from '@/components/dashboard/dashboard-chart-components';

interface TeacherStats {
  totalCourses: number;
  publishedCourses: number;
  totalStudents: number;
  avgRating: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      coursesApi.getMyCourses(),
    ])
      .then(([data]) => {
        setCourses(data || []);
        const stats = {
          totalCourses: data?.length || 0,
          publishedCourses: data?.filter((c: Course) => c.status === 'published').length || 0,
          totalStudents: data?.reduce((sum: number, c: Course) => sum + (c._count?.enrollments || 0), 0) || 0,
          avgRating: data?.length
            ? data.reduce((sum: number, c: Course) => sum + (c.averageRating || 0), 0) / data.length
            : 0,
        };
        setStats(stats);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const courseStatusData = [
    {
      label: 'Đã xuất bản',
      value: stats?.publishedCourses || 0,
      color: 'bg-green-500',
    },
    {
      label: 'Nháp',
      value: (stats?.totalCourses || 0) - (stats?.publishedCourses || 0),
      color: 'bg-gray-400',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
            Bảng điều khiển giáo viên
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Quản lý khóa học và theo dõi học sinh
          </p>
        </div>
        <Link href="/teacher/courses/new">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tạo khóa học
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            icon={<BookOpen className="h-6 w-6" />}
            label="Tổng khóa học"
            value={stats.totalCourses}
            type="primary"
          />
          <DashboardStatCard
            icon={<Users className="h-6 w-6" />}
            label="Học sinh"
            value={stats.totalStudents}
            change="+8"
            type="success"
          />
          <DashboardStatCard
            icon={<Star className="h-6 w-6" />}
            label="Đánh giá trung bình"
            value={stats.avgRating.toFixed(1)}
            type="info"
          />
          <DashboardStatCard
            icon={<TrendingUp className="h-6 w-6" />}
            label="Đã xuất bản"
            value={stats.publishedCourses}
            type="warning"
          />
        </div>
      )}

      {/* Chart */}
      {stats && (
        <SimpleBarChart
          title="Phân bố trạng thái khóa học"
          data={courseStatusData}
        />
      )}

      {/* Courses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Khóa học của tôi
          </h2>
          <Link
            href="/teacher/courses"
            className="text-sm text-blue-700 hover:text-blue-800 font-medium"
          >
            Xem tất cả →
          </Link>
        </div>
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Bạn chưa có khóa học nào
            </p>
            <Link href="/teacher/courses/new">
              <Button className="bg-blue-700 hover:bg-blue-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Tạo khóa học đầu tiên
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <div
                key={course.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                {course.imageUrl && (
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 capitalize">
                      {course.status === 'published' ? 'Xuất bản' : 'Nháp'}
                    </Badge>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {course._count?.enrollments || 0} học sinh
                    </div>
                    {course.averageRating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        {course.averageRating.toFixed(1)} / 5
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/teacher/courses/${course.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Chỉnh sửa
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
