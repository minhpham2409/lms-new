import axios from 'axios';
import { getSession } from 'next-auth/react';
import type {
  Course, Section, Lesson, Enrollment, VideoProgress,
  Assignment, Submission, Quiz, QuizAttempt, Question,
  CartItem, Order, Payment, Coupon, CouponPreview,
  Review, Comment, Notification, Certificate, ParentChild, User,
  CreateCourseData, UpdateCourseData, CreateSectionData,
  CreateLessonData, UpdateLessonData, ProgressData,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  getProfile: (): Promise<User> =>
    api.get('/auth/profile').then(r => r.data),
  updateProfile: (data: Partial<User>) =>
    api.put('/auth/profile', data).then(r => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data).then(r => r.data),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export const coursesApi = {
  getAll: (): Promise<Course[]> =>
    api.get('/courses').then(r => r.data),
  search: (q: string): Promise<Course[]> =>
    api.get(`/courses/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  getMyCourses: (): Promise<Course[]> =>
    api.get('/courses/my-courses').then(r => r.data),
  getById: (id: string): Promise<Course> =>
    api.get(`/courses/${id}`).then(r => r.data),
  create: (data: CreateCourseData): Promise<Course> =>
    api.post('/courses', data).then(r => r.data),
  update: (id: string, data: UpdateCourseData): Promise<Course> =>
    api.put(`/courses/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/courses/${id}`).then(r => r.data),
  submitForReview: (id: string) =>
    api.post(`/courses/${id}/submit-review`).then(r => r.data),
  getReviews: (id: string): Promise<Review[]> =>
    api.get(`/courses/${id}/reviews`).then(r => r.data),
};

// ─── Sections ────────────────────────────────────────────────────────────────

export const sectionsApi = {
  getByCourse: (courseId: string): Promise<Section[]> =>
    api.get(`/sections?courseId=${courseId}`).then(r => r.data),
  create: (courseId: string, data: CreateSectionData): Promise<Section> =>
    api.post(`/sections`, { ...data, courseId }).then(r => r.data),
  update: (id: string, data: Partial<CreateSectionData>): Promise<Section> =>
    api.put(`/sections/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/sections/${id}`).then(r => r.data),
};

// ─── Lessons ─────────────────────────────────────────────────────────────────

export const lessonsApi = {
  create: (data: CreateLessonData): Promise<Lesson> =>
    api.post('/lessons', data).then(r => r.data),
  update: (id: string, data: UpdateLessonData): Promise<Lesson> =>
    api.put(`/lessons/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/lessons/${id}`).then(r => r.data),
  getById: (id: string): Promise<Lesson> =>
    api.get(`/lessons/${id}`).then(r => r.data),
};

// ─── Enrollments ─────────────────────────────────────────────────────────────

export const enrollmentsApi = {
  getMyCourses: (): Promise<Enrollment[]> =>
    api.get('/enrollments/my-courses').then(r => r.data),
  enroll: (courseId: string): Promise<Enrollment> =>
    api.post('/enrollments', { courseId }).then(r => r.data),
  checkStatus: (courseId: string): Promise<{ enrolled: boolean }> =>
    api.get(`/enrollments/${courseId}/status`).then(r => r.data),
  unenroll: (courseId: string) =>
    api.delete(`/enrollments/${courseId}`).then(r => r.data),
};

// ─── Progress ────────────────────────────────────────────────────────────────

export const progressApi = {
  getCourse: (courseId: string): Promise<ProgressData> =>
    api.get(`/progress/video/${courseId}`).then(r => r.data),
  getLesson: (lessonId: string): Promise<VideoProgress> =>
    api.get(`/progress/video/lesson/${lessonId}`).then(r => r.data),
  updateVideo: (data: { lessonId: string; watchTime?: number; completed?: boolean }) =>
    api.put('/progress/video', data).then(r => r.data),
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export const assignmentsApi = {
  getByLesson: (lessonId: string): Promise<Assignment[]> =>
    api.get(`/assignments?lessonId=${lessonId}`).then(r => r.data),
  getById: (id: string): Promise<Assignment> =>
    api.get(`/assignments/${id}`).then(r => r.data),
  create: (data: { title: string; description?: string; type: string; lessonId: string; dueDate?: string; maxScore?: number; minScore?: number }): Promise<Assignment> =>
    api.post('/assignments', data).then(r => r.data),
  update: (id: string, data: Partial<Assignment>) =>
    api.put(`/assignments/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/assignments/${id}`).then(r => r.data),
  submit: (id: string, data: { content?: string; fileUrl?: string }): Promise<Submission> =>
    api.post(`/assignments/${id}/submit`, data).then(r => r.data),
  getSubmissions: (id: string): Promise<Submission[]> =>
    api.get(`/assignments/${id}/submissions`).then(r => r.data),
  gradeSubmission: (assignmentId: string, submissionId: string, data: { score: number; feedback?: string }): Promise<Submission> =>
    api.put(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, data).then(r => r.data),
};

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export const quizzesApi = {
  create: (data: { assignmentId: string; timeLimit?: number }): Promise<Quiz> =>
    api.post('/quizzes', data).then(r => r.data),
  addQuestion: (quizId: string, data: { content: string; options: string[]; answer: string; score?: number }): Promise<Question> =>
    api.post(`/quizzes/${quizId}/questions`, data).then(r => r.data),
  getById: (id: string): Promise<Quiz> =>
    api.get(`/quizzes/${id}`).then(r => r.data),
  submit: (id: string, data: { answers: Record<string, string> }): Promise<QuizAttempt> =>
    api.post(`/quizzes/${id}/submit`, data).then(r => r.data),
  getResult: (id: string): Promise<QuizAttempt & { breakdown: { question: string; correct: boolean; score: number }[] }> =>
    api.get(`/quizzes/${id}/result`).then(r => r.data),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartApi = {
  get: (): Promise<CartItem[]> =>
    api.get('/cart').then(r => r.data),
  addItem: (courseId: string): Promise<CartItem> =>
    api.post('/cart', { courseId }).then(r => r.data),
  removeItem: (courseId: string) =>
    api.delete(`/cart/${courseId}`).then(r => r.data),
  applyCoupon: (data: { couponCode: string; courseIds: string[] }): Promise<CouponPreview> =>
    api.post('/cart/apply-coupon', data).then(r => r.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  getAll: (): Promise<Order[]> =>
    api.get('/orders').then(r => r.data),
  getById: (id: string): Promise<Order> =>
    api.get(`/orders/${id}`).then(r => r.data),
  create: (data: { courseIds: string[]; couponCode?: string }): Promise<Order> =>
    api.post('/orders', data).then(r => r.data),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  createQr: (orderId: string): Promise<Payment> =>
    api.post('/payments/qr', { orderId }).then(r => r.data),
  getStatus: (orderId: string): Promise<Payment> =>
    api.get(`/payments/${orderId}`).then(r => r.data),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const couponsApi = {
  getAll: (): Promise<Coupon[]> =>
    api.get('/coupons').then(r => r.data),
  create: (data: { code: string; discount: number; maxUses?: number; expiresAt?: string }): Promise<Coupon> =>
    api.post('/coupons', data).then(r => r.data),
  update: (id: string, data: Partial<Coupon>) =>
    api.put(`/coupons/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/coupons/${id}`).then(r => r.data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  getByCourse: (courseId: string): Promise<Review[]> =>
    api.get(`/reviews?courseId=${courseId}`).then(r => r.data),
  create: (data: { courseId: string; rating: number; comment?: string }): Promise<Review> =>
    api.post('/reviews', data).then(r => r.data),
  update: (id: string, data: { rating?: number; comment?: string }): Promise<Review> =>
    api.put(`/reviews/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/reviews/${id}`).then(r => r.data),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  getByLesson: (lessonId: string): Promise<Comment[]> =>
    api.get(`/comments?lessonId=${lessonId}`).then(r => r.data),
  create: (data: { lessonId: string; content: string; parentId?: string }): Promise<Comment> =>
    api.post('/comments', data).then(r => r.data),
  update: (id: string, data: { content: string }): Promise<Comment> =>
    api.put(`/comments/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/comments/${id}`).then(r => r.data),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  getAll: (): Promise<Notification[]> =>
    api.get('/notifications').then(r => r.data),
  markRead: (id: string): Promise<Notification> =>
    api.put(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    api.put('/notifications/read-all').then(r => r.data),
  delete: (id: string) =>
    api.delete(`/notifications/${id}`).then(r => r.data),
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificatesApi = {
  getMine: (): Promise<Certificate[]> =>
    api.get('/certificates').then(r => r.data),
  generate: (courseId: string): Promise<Certificate> =>
    api.post('/certificates', { courseId }).then(r => r.data),
  verify: (code: string): Promise<Certificate> =>
    api.get(`/certificates/verify/${code}`).then(r => r.data),
};

// ─── Parents ──────────────────────────────────────────────────────────────────

export const parentsApi = {
  linkChild: (childId: string): Promise<ParentChild> =>
    api.post('/parents/link', { childId }).then(r => r.data),
  acceptLink: (parentId: string): Promise<ParentChild> =>
    api.put(`/parents/accept/${parentId}`).then(r => r.data),
  getChildren: (): Promise<ParentChild[]> =>
    api.get('/parents/children').then(r => r.data),
  getPendingRequests: (): Promise<ParentChild[]> =>
    api.get('/parents/pending').then(r => r.data),
  getChildProgress: (childId: string): Promise<ProgressData[]> =>
    api.get(`/parents/children/${childId}/progress`).then(r => r.data),
  getChildCourses: (childId: string): Promise<Enrollment[]> =>
    api.get(`/parents/children/${childId}/courses`).then(r => r.data),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard').then(r => r.data),
  getUsers: (): Promise<User[]> =>
    api.get('/admin/users').then(r => r.data),
  createUser: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/admin/users', data).then(r => r.data),
  updateUser: (id: string, data: Partial<User>) =>
    api.put(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),
  getCourses: (): Promise<Course[]> =>
    api.get('/admin/courses').then(r => r.data),
  createCourse: (data: CreateCourseData & { authorId?: string }): Promise<Course> =>
    api.post('/admin/courses', data).then(r => r.data),
  updateCourse: (id: string, data: UpdateCourseData): Promise<Course> =>
    api.put(`/admin/courses/${id}`, data).then(r => r.data),
  deleteCourse: (id: string) =>
    api.delete(`/admin/courses/${id}`).then(r => r.data),
  publishCourse: (id: string) =>
    api.put(`/admin/courses/${id}/publish`).then(r => r.data),
  createSection: (courseId: string, data: CreateSectionData): Promise<Section> =>
    api.post(`/admin/courses/${courseId}/sections`, data).then(r => r.data),
  createLesson: (sectionId: string, data: Omit<CreateLessonData, 'sectionId'>): Promise<Lesson> =>
    api.post(`/admin/sections/${sectionId}/lessons`, data).then(r => r.data),
};

export default api;
