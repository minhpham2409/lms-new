import axios from 'axios';
import type {
  Course, Section, Lesson, Enrollment, VideoProgress,
  Assignment, Submission, Quiz, QuizAttempt, Question,
  CartItem, Order, Payment, Coupon, CouponPreview,
  Review, Comment, Notification, Certificate, ParentChild, User,
  CreateCourseData, UpdateCourseData, CreateSectionData,
  CreateLessonData, UpdateLessonData, ProgressData,
  ParentChildDashboard,
  LearningSummary,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // Send cookies (refresh_token) with every request
});

function toCoursePayload(data: Partial<CreateCourseData & UpdateCourseData> & {
  thumbnail?: string;
  status?: string;
  authorId?: string;
  instructorId?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.price !== undefined) payload.price = data.price;
  if (data.imageUrl !== undefined) payload.thumbnail = data.imageUrl;
  if (data.thumbnail !== undefined) payload.thumbnail = data.thumbnail;
  if (data.status !== undefined) payload.status = data.status;
  if (data.authorId !== undefined) payload.authorId = data.authorId;
  if (data.instructorId !== undefined) payload.authorId = data.instructorId;
  return payload;
}

// ─── In-memory access token (not in localStorage) ─────────────────────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─── Request interceptor: attach access token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: auto-refresh on 401 ──────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (v: string | null) => void; reject: (e: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      typeof window !== 'undefined'
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint — cookie will be sent automatically
        const { data } = await api.post('/auth/refresh');
        const newToken = data.access_token;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed. Keep navigation under the current page's control;
        // a background request must not unexpectedly kick the user to login.
        setAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string; firstName?: string; lastName?: string; role?: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email?: string; username?: string; password: string }) =>
    api.post('/auth/login', {
      username: data.username ?? data.email,
      password: data.password,
    }).then(r => r.data),
  getProfile: (): Promise<User> =>
    api.get('/auth/profile').then(r => r.data),
  updateProfile: (data: Partial<User>) =>
    api.put('/auth/profile', data).then(r => r.data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/auth/change-password', { oldPassword: data.currentPassword, newPassword: data.newPassword }).then(r => r.data),
  refreshToken: () =>
    api.post('/auth/refresh').then(r => r.data),
};

export const studentLearningApi = {
  getSummary: (): Promise<LearningSummary> =>
    api.get('/users/me/learning-summary').then(r => r.data),
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export const coursesApi = {
  getAll: (): Promise<Course[]> =>
    api.get('/courses').then(r => r.data),
  search: (q: string): Promise<Course[]> =>
    api.get(`/courses/search?q=${encodeURIComponent(q)}`).then(r => r.data),
  getMyCourses: (): Promise<Course[]> =>
    api.get('/courses/my').then(r => r.data),
  getTeacherStats: () =>
    api.get('/courses/my/stats').then(r => r.data),
  getById: (id: string): Promise<Course> =>
    api.get(`/courses/${id}`).then(r => r.data),
  create: (data: CreateCourseData): Promise<Course> =>
    api.post('/courses', toCoursePayload(data)).then(r => r.data),
  update: (id: string, data: UpdateCourseData): Promise<Course> =>
    api.put(`/courses/${id}`, toCoursePayload(data)).then(r => r.data),
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
    api.patch(`/sections/${id}`, data).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/sections/${id}`).then(r => r.data),
  reorder: (courseId: string, sections: { id: string; order: number }[]) =>
    api
      .post(`/sections/reorder?courseId=${encodeURIComponent(courseId)}`, { sections })
      .then((r) => r.data),
};

// ─── Lessons ─────────────────────────────────────────────────────────────────

export const lessonsApi = {
  create: (data: CreateLessonData): Promise<Lesson> =>
    api.post('/lessons', data).then(r => r.data),
  update: (id: string, data: UpdateLessonData): Promise<Lesson> =>
    api.patch(`/lessons/${id}`, data).then(r => r.data),
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
    api.get(`/enrollments/${courseId}/status`).then(r => ({ enrolled: r.data.isEnrolled ?? r.data.enrolled ?? false })),
  unenroll: (courseId: string) =>
    api.delete(`/enrollments/${courseId}`).then(r => r.data),
};

// ─── Progress ────────────────────────────────────────────────────────────────

export const progressApi = {
  getCourse: (courseId: string): Promise<ProgressData> =>
    api.get(`/progress/course/${courseId}`).then(r => r.data),
  getCourseVideos: (courseId: string): Promise<VideoProgress[]> =>
    api.get(`/progress/video/${courseId}`).then(r => r.data),
  getLesson: (lessonId: string): Promise<VideoProgress> =>
    api.get(`/progress/video/lesson/${lessonId}`).then(r => r.data),
  updateVideo: (data: { lessonId: string; watchTime: number; watchedPercentage: number }) =>
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
  /** Student: own essay submission or null */
  getMySubmission: (assignmentId: string): Promise<Submission | null> =>
    api.get(`/assignments/${assignmentId}/my-submission`).then(r => r.data),
  gradeSubmission: (_assignmentId: string, submissionId: string, data: { score: number; feedback?: string }): Promise<Submission> =>
    api.put(`/submissions/${submissionId}/grade`, data).then(r => r.data),
};

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export const quizzesApi = {
  create: (data: { assignmentId: string; timeLimit?: number }): Promise<Quiz> =>
    api.post('/quizzes', data).then(r => r.data),
  addQuestion: (quizId: string, data: { content: string; options: { id: string; text: string }[]; answer: string; score?: number }): Promise<Question> =>
    api.post('/questions', { quizId, ...data }).then(r => r.data),
  getById: (id: string): Promise<Quiz> =>
    api.get(`/quizzes/${id}`).then(r => r.data),
  submit: (id: string, data: { answers: { questionId: string; answerId: string }[] }): Promise<QuizAttempt> =>
    api.post(`/quizzes/${id}/submit`, data).then(r => r.data),
  getResult: (id: string): Promise<QuizAttempt & { breakdown: { question: string; correct: boolean; score: number }[] }> =>
    api.get(`/quizzes/${id}/result`).then(r => r.data),
  /** Teacher/admin: all attempts with scores */
  getAttempts: (quizId: string): Promise<
    (QuizAttempt & { student?: User; createdAt?: string })[]
  > =>
    api.get(`/quizzes/${quizId}/attempts`).then(r => r.data),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartApi = {
  get: (): Promise<CartItem[]> =>
    api.get('/cart').then(r => r.data.items || []),
  addItem: (courseId: string): Promise<CartItem> =>
    api.post('/cart/add', { courseId }).then(r => r.data),
  removeItem: (itemId: string) =>
    api.delete(`/cart/item/${itemId}`).then(r => r.data),
  applyCoupon: (data: { couponCode: string; courseIds: string[] }): Promise<CouponPreview> =>
    api.post('/cart/apply-coupon', { code: data.couponCode }).then(r => r.data),
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const ordersApi = {
  getMine: (): Promise<Order[]> =>
    api.get('/orders/me').then(r => r.data),
  getById: (id: string): Promise<Order> =>
    api.get(`/orders/${id}`).then(r => r.data),
  create: (data: { courseIds: string[]; couponCode?: string }): Promise<Order> =>
    api.post('/orders', data).then(r => r.data),
};

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  /** Reuses existing pending QR unless forceRegenerate is true */
  createQr: (orderId: string, opts?: { forceRegenerate?: boolean }): Promise<Payment> =>
    api
      .post('/payments/qr', { orderId, forceRegenerate: opts?.forceRegenerate === true })
      .then(r => r.data),
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export const couponsApi = {
  getAll: (): Promise<Coupon[]> =>
    api.get('/coupons').then(r => r.data),
  create: (data: { code: string; discount: number; maxUses?: number; expiresAt?: string }): Promise<Coupon> =>
    api.post('/coupons', data).then(r => r.data),
  getByCode: (code: string): Promise<Coupon> =>
    api.get(`/coupons/${encodeURIComponent(code)}`).then(r => r.data),
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviewsApi = {
  getByCourse: (courseId: string): Promise<Review[]> =>
    api.get(`/courses/${courseId}/reviews`).then(r => r.data),
  create: (data: { courseId: string; rating: number; comment?: string }): Promise<Review> =>
    api.post('/reviews', data).then(r => r.data),
  update: (id: string, data: { rating?: number; comment?: string }): Promise<Review> =>
    api.put(`/reviews/${id}`, data).then(r => r.data),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  getByLesson: (lessonId: string): Promise<Comment[]> =>
    api.get(`/lessons/${lessonId}/comments`).then(r => r.data),
  create: (lessonId: string, data: { content: string }): Promise<Comment> =>
    api.post(`/lessons/${lessonId}/comments`, data).then(r => r.data),
  reply: (
    lessonId: string,
    commentId: string,
    data: { content: string },
  ): Promise<Comment> =>
    api
      .post(`/lessons/${lessonId}/comments/${commentId}/reply`, data)
      .then((r) => r.data),
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
    api.post('/certificates/generate', { courseId }).then(r => r.data),
  verify: (code: string): Promise<Certificate> =>
    api.get(`/certificates/${code}`).then(r => r.data),
};

// ─── Parents ──────────────────────────────────────────────────────────────────

export const parentsApi = {
  /** Student UUID, email, or username (email/username easier than copying UUID). */
  linkChild: (identifier: string): Promise<ParentChild> =>
    api.post('/parents/link-child', { identifier }).then(r => r.data),
  /** Student accepts a pending parent link (link row id). */
  acceptIncomingLink: (linkId: string): Promise<ParentChild> =>
    api.post(`/parents/link-request/${linkId}/accept`).then(r => r.data),
  /** Student declines a pending parent link. */
  rejectIncomingLink: (linkId: string): Promise<{ success: boolean }> =>
    api.post(`/parents/link-request/${linkId}/reject`).then(r => r.data),
  getChildren: (): Promise<ParentChild[]> =>
    api.get('/parents/me/children').then(r => r.data),
  /** Parent: requests waiting for the student to accept. */
  getOutgoingPending: (): Promise<ParentChild[]> =>
    api.get('/parents/link-requests/outgoing').then(r => r.data),
  /** Student: pending parent link requests. */
  getIncomingForStudent: (): Promise<ParentChild[]> =>
    api.get('/parents/link-requests/incoming').then(r => r.data),
  /** Parent cancels own pending link request. */
  cancelOutgoingRequest: (linkId: string): Promise<{ success: boolean }> =>
    api.delete(`/parents/link-requests/${linkId}`).then(r => r.data),
  /** Parent removes link after acceptance. */
  unlinkChild: (childId: string): Promise<{ success: boolean }> =>
    api.delete(`/parents/children/${childId}/link`).then(r => r.data),
  /** Enrollments / progress snapshot for linked child (same shape as enrollments). */
  getChildProgress: (childId: string): Promise<Enrollment[]> =>
    api.get(`/parents/children/${childId}/progress`).then(r => r.data),
  getChildCourses: (childId: string): Promise<Enrollment[]> =>
    api.get(`/parents/children/${childId}/courses`).then(r => r.data),
  getChildDashboard: (childId: string): Promise<ParentChildDashboard> =>
    api.get(`/parents/children/${childId}/dashboard`).then(r => r.data),
};

/** Lesson file attachments (teacher). */
export const materialsApi = {
  listByLesson: (lessonId: string) =>
    api.get(`/materials?lessonId=${encodeURIComponent(lessonId)}`).then(r => r.data),
  getById: (id: string) => api.get(`/materials/${id}`).then(r => r.data),
  create: (data: {
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    lessonId: string;
    description?: string;
  }) => api.post('/materials', data).then(r => r.data),
  update: (id: string, data: Partial<{ title: string; description: string; fileUrl: string }>) =>
    api.patch(`/materials/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/materials/${id}`).then(r => r.data),
};

/** Grouped re-exports for teacher course authoring (all map to existing modules). */
export const teacherToolkit = {
  courses: coursesApi,
  sections: sectionsApi,
  lessons: lessonsApi,
  assignments: assignmentsApi,
  quizzes: quizzesApi,
  materials: materialsApi,
  reviews: reviewsApi,
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getDashboard: () =>
    api.get('/admin/dashboard').then(r => r.data),
  getOrders: (): Promise<Order[]> =>
    api.get('/admin/orders').then(r => r.data),
  getUsers: (): Promise<User[]> =>
    api.get('/admin/users').then(r => r.data),
  createUser: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/admin/users', data).then(r => r.data),
  updateUser: (id: string, data: Partial<User>) =>
    api.patch(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`).then(r => r.data),
  getCourses: (): Promise<Course[]> =>
    api.get('/admin/courses').then(r => r.data),
  createCourse: (data: CreateCourseData & { authorId?: string }): Promise<Course> =>
    api.post('/admin/courses', toCoursePayload(data)).then(r => r.data),
  updateCourse: (id: string, data: UpdateCourseData): Promise<Course> =>
    api.patch(`/admin/courses/${id}`, toCoursePayload(data)).then(r => r.data),
  deleteCourse: (id: string) =>
    api.delete(`/admin/courses/${id}`).then(r => r.data),
  publishCourse: (id: string) =>
    api.put(`/admin/courses/${id}/publish`).then(r => r.data),
  rejectCourse: (id: string) =>
    api.put(`/admin/courses/${id}/reject`).then(r => r.data),
};

// ─── Wallets & Payouts ────────────────────────────────────────────────────────

export const walletsApi = {
  // Teacher endpoints
  getMyWallet: () =>
    api.get('/wallets/me').then(r => r.data),
  updateBankInfo: (data: { bankName: string; bankAccount: string; bankOwner: string }) =>
    api.put('/wallets/bank-info', data).then(r => r.data),
  requestPayout: (amount: number) =>
    api.post('/wallets/payouts', { amount }).then(r => r.data),
  getMyPayouts: () =>
    api.get('/wallets/payouts/me').then(r => r.data),

  // Admin payout management
  getAllPayouts: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/wallets/admin/payouts', { params }).then(r => r.data),
  approvePayout: (id: string, data: { bankTransferRef?: string; adminNote?: string }) =>
    api.patch(`/wallets/admin/payouts/${id}/approve`, data).then(r => r.data),
  rejectPayout: (id: string, data: { adminNote: string }) =>
    api.patch(`/wallets/admin/payouts/${id}/reject`, data).then(r => r.data),
  getPlatformFee: () =>
    api.get('/wallets/admin/configs/fee').then(r => r.data),
  updatePlatformFee: (percentage: number) =>
    api.put('/wallets/admin/configs/fee', { percentage }).then(r => r.data),
};

export default api;
