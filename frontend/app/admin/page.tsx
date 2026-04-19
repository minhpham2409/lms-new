'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api-service';
import Link from 'next/link';
import { Users, FileText, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { DashboardStatCard, SimpleBarChart, SimplePieChart } from '@/components/dashboard/dashboard-chart-components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User, Order } from '@/types';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  totalRevenue: number;
  usersByRole: Record<string, number>;
  coursesByStatus: Record<string, number>;
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentCourses: Array<{
    id: string;
    title: string;
    status: string;
    author: { id: string; username: string };
    _count: { enrollments: number };
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'orders'>('overview');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    adminApi.getDashboard()
      .then(setStats)
      .catch((error) => {
        console.error('Failed to load admin dashboard:', error);
        setStats({
          totalUsers: 0,
          totalCourses: 0,
          totalLessons: 0,
          totalRevenue: 0,
          usersByRole: {},
          coursesByStatus: {},
          recentUsers: [],
          recentCourses: [],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const loadAllUsers = async () => {
    if (allUsers.length > 0) return;
    try {
      setLoadingUsers(true);
      const data = await adminApi.getUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAllCourses = async () => {
    if (allCourses.length > 0) return;
    try {
      setLoadingCourses(true);
      const data = await adminApi.getCourses();
      setAllCourses(data);
    } catch (error) {
      console.error('Failed to load courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadAllOrders = async () => {
    if (allOrders.length > 0) return;
    try {
      setLoadingOrders(true);
      const data = await adminApi.getOrders();
      setAllOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'users') loadAllUsers();
    else if (tab === 'courses') loadAllCourses();
    else if (tab === 'orders') loadAllOrders();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Không thể tải dữ liệu dashboard.
      </div>
    );
  }

  const userRoleData = [
    { label: 'Học sinh', value: stats.usersByRole.student || 0, color: 'bg-blue-500' },
    { label: 'Giáo viên', value: stats.usersByRole.teacher || 0, color: 'bg-green-500' },
    { label: 'Phụ huynh', value: stats.usersByRole.parent || 0, color: 'bg-purple-500' },
    { label: 'Admin', value: stats.usersByRole.admin || 0, color: 'bg-red-500' },
  ];

  const courseStatusData = [
    { label: 'Nháp', value: stats.coursesByStatus.draft || 0, color: 'bg-gray-400' },
    { label: 'Chờ duyệt', value: stats.coursesByStatus.pending || 0, color: 'bg-yellow-500' },
    { label: 'Đã xuất bản', value: stats.coursesByStatus.published || 0, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
          Bảng điều khiển quản trị
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Tổng quan nền tảng và các chỉ số quan trọng
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('overview')}
          className="rounded-none border-b-2 border-transparent"
        >
          Tổng quan
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('users')}
          className="rounded-none border-b-2 border-transparent"
        >
          Người dùng ({stats.totalUsers})
        </Button>
        <Button
          variant={activeTab === 'courses' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('courses')}
          className="rounded-none border-b-2 border-transparent"
        >
          Khóa học ({stats.totalCourses})
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => handleTabChange('orders')}
          className="rounded-none border-b-2 border-transparent"
        >
          Đơn hàng
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardStatCard
              icon={<Users className="h-6 w-6" />}
              label="Tổng người dùng"
              value={stats.totalUsers}
              type="primary"
            />
            <DashboardStatCard
              icon={<FileText className="h-6 w-6" />}
              label="Khóa học"
              value={stats.totalCourses}
              type="success"
            />
            <DashboardStatCard
              icon={<TrendingUp className="h-6 w-6" />}
              label="Bài học"
              value={stats.totalLessons}
              type="info"
            />
            <DashboardStatCard
              icon={<DollarSign className="h-6 w-6" />}
              label="Doanh thu"
              value={`${(stats.totalRevenue || 0).toLocaleString('vi-VN')} đ`}
              type="warning"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleBarChart title="Người dùng theo vai trò" data={userRoleData} />
            <SimplePieChart title="Trạng thái khóa học" data={courseStatusData} />
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Người dùng gần đây
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Tên</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Vai trò</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-3 text-gray-900 dark:text-gray-50 font-medium">{user.username}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'parent' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'student' ? 'Học sinh' :
                           user.role === 'teacher' ? 'Giáo viên' :
                           user.role === 'parent' ? 'Phụ huynh' :
                           'Admin'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Courses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
              Khóa học gần đây
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Tên khóa học</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Giáo viên</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Học sinh</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCourses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-3 text-gray-900 dark:text-gray-50 font-medium">
                        <Link href={`/admin/courses/${course.id}`} className="hover:text-blue-600">
                          {course.title}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course.author?.username}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          course.status === 'published' ? 'bg-green-100 text-green-700' :
                          course.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.status === 'published' && 'Đã xuất bản'}
                          {course.status === 'pending' && 'Chờ duyệt'}
                          {course.status === 'draft' && 'Nháp'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course._count?.enrollments || 0} học sinh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Tất cả người dùng ({allUsers.length})
          </h2>
          {loadingUsers ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Tên</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Vai trò</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-3 text-gray-900 dark:text-gray-50 font-medium">{user.username}</td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-3">
                        <Badge className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Tất cả khóa học ({allCourses.length})
          </h2>
          {loadingCourses ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Tên khóa học</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Giáo viên</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Giá</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Học sinh</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-3 text-gray-900 dark:text-gray-50 font-medium">
                        <Link href={`/admin/courses/${course.id}`} className="hover:text-blue-600">
                          {course.title}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course.author?.username || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`capitalize ${
                          course.status === 'published' ? 'bg-green-500' :
                          course.status === 'pending' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}>
                          {course.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course.price || '0'} đ
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course._count?.enrollments || 0}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
            Tất cả đơn hàng ({allOrders.length})
          </h2>
          {loadingOrders ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">ID Đơn hàng</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Khách hàng</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Tổng tiền</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Trạng thái</th>
                    <th className="text-left py-3 px-3 text-gray-700 dark:text-gray-300 font-semibold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="py-3 px-3 text-gray-900 dark:text-gray-50 font-medium font-mono text-xs">
                        {order.id}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {(order as any).user?.username || '—'}
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {(order.totalAmount || 0).toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3">
                        <Badge className={`capitalize ${
                          order.status === 'completed' ? 'bg-green-500' :
                          order.status === 'pending' ? 'bg-yellow-500' :
                          order.status === 'cancelled' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
