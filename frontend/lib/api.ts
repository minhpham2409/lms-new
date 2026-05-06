/**
 * Comprehensive LMS API library — covers ALL backend endpoints
 */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function h(token: string) { return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; }
function auth(token: string) { return { Authorization: `Bearer ${token}` }; }

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  register: (data: any) =>
    fetch(`${API}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  refresh: (token: string) =>
    fetch(`${API}/auth/refresh`, { method: "POST", headers: h(token) }),
  logout: (token: string) =>
    fetch(`${API}/auth/logout`, { method: "POST", headers: h(token) }),
  getProfile: (token: string) =>
    fetch(`${API}/auth/profile`, { headers: auth(token) }),
  updateProfile: (token: string, data: any) =>
    fetch(`${API}/auth/profile`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    fetch(`${API}/auth/change-password`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    fetch(`${API}/auth/forgot-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) =>
    fetch(`${API}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword }) }),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (token: string) => fetch(`${API}/users`, { headers: auth(token) }),
  getById: (token: string, id: string) => fetch(`${API}/users/${id}`, { headers: auth(token) }),
  getProfile: (token: string) => fetch(`${API}/users/profile`, { headers: auth(token) }),
  update: (token: string, id: string, data: any) =>
    fetch(`${API}/users/${id}`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Courses ─────────────────────────────────────────────────────────────────
export const coursesApi = {
  create: (token: string, data: any) => fetch(`${API}/courses`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: () => fetch(`${API}/courses`),
  search: (q: string) => fetch(`${API}/courses/search?q=${encodeURIComponent(q)}`),
  getMy: (token: string) => fetch(`${API}/courses/my`, { headers: auth(token) }),
  getMyStats: (token: string) => fetch(`${API}/courses/my/stats`, { headers: auth(token) }),
  getById: (id: string, token?: string) => fetch(`${API}/courses/${id}`, { headers: token ? auth(token) : {} }),
  update: (token: string, id: string, data: any) => fetch(`${API}/courses/${id}`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
  delete: (token: string, id: string) => fetch(`${API}/courses/${id}`, { method: "DELETE", headers: auth(token) }),
  submitReview: (token: string, id: string) => fetch(`${API}/courses/${id}/submit-review`, { method: "POST", headers: auth(token) }),
  getReviews: (id: string) => fetch(`${API}/courses/${id}/reviews`),
};

// ─── Sections ────────────────────────────────────────────────────────────────
export const sectionsApi = {
  create: (token: string, data: any) => fetch(`${API}/sections`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: (token: string, courseId?: string) => fetch(`${API}/sections${courseId ? `?courseId=${courseId}` : ''}`, { headers: auth(token) }),
  getById: (token: string, id: string) => fetch(`${API}/sections/${id}`, { headers: auth(token) }),
  update: (token: string, id: string, data: any) => fetch(`${API}/sections/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  delete: (token: string, id: string) => fetch(`${API}/sections/${id}`, { method: "DELETE", headers: auth(token) }),
  reorder: (token: string, data: any) => fetch(`${API}/sections/reorder`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Lessons ─────────────────────────────────────────────────────────────────
export const lessonsApi = {
  create: (token: string, data: any) => fetch(`${API}/lessons`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: (token: string, sectionId?: string) => fetch(`${API}/lessons${sectionId ? `?sectionId=${sectionId}` : ''}`, { headers: auth(token) }),
  getById: (id: string, token?: string) => fetch(`${API}/lessons/${id}`, { headers: token ? auth(token) : {} }),
  update: (token: string, id: string, data: any) => fetch(`${API}/lessons/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  delete: (token: string, id: string) => fetch(`${API}/lessons/${id}`, { method: "DELETE", headers: auth(token) }),
};

// ─── Materials ───────────────────────────────────────────────────────────────
export const materialsApi = {
  create: (token: string, data: any) => fetch(`${API}/materials`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: (token: string, lessonId?: string) => fetch(`${API}/materials${lessonId ? `?lessonId=${lessonId}` : ''}`, { headers: auth(token) }),
  getById: (token: string, id: string) => fetch(`${API}/materials/${id}`, { headers: auth(token) }),
  update: (token: string, id: string, data: any) => fetch(`${API}/materials/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  delete: (token: string, id: string) => fetch(`${API}/materials/${id}`, { method: "DELETE", headers: auth(token) }),
};

// ─── Assignments ─────────────────────────────────────────────────────────────
export const assignmentsApi = {
  create: (token: string, data: any) => fetch(`${API}/assignments`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: (token: string, lessonId?: string) => fetch(`${API}/assignments${lessonId ? `?lessonId=${lessonId}` : ''}`, { headers: auth(token) }),
  getById: (token: string, id: string) => fetch(`${API}/assignments/${id}`, { headers: auth(token) }),
  update: (token: string, id: string, data: any) => fetch(`${API}/assignments/${id}`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
  delete: (token: string, id: string) => fetch(`${API}/assignments/${id}`, { method: "DELETE", headers: auth(token) }),
  getMySubmission: (token: string, id: string) => fetch(`${API}/assignments/${id}/my-submission`, { headers: auth(token) }),
  submit: (token: string, id: string, data: any) => fetch(`${API}/assignments/${id}/submit`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getSubmissions: (token: string, id: string) => fetch(`${API}/assignments/${id}/submissions`, { headers: auth(token) }),
};

// ─── Submissions ─────────────────────────────────────────────────────────────
export const submissionsApi = {
  grade: (token: string, id: string, data: { score: number; feedback?: string }) =>
    fetch(`${API}/submissions/${id}/grade`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Quizzes ─────────────────────────────────────────────────────────────────
export const quizzesApi = {
  create: (token: string, data: any) => fetch(`${API}/quizzes`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getById: (token: string, id: string) => fetch(`${API}/quizzes/${id}`, { headers: auth(token) }),
  getAttempts: (token: string, id: string) => fetch(`${API}/quizzes/${id}/attempts`, { headers: auth(token) }),
  submit: (token: string, id: string, data: any) => fetch(`${API}/quizzes/${id}/submit`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getResult: (token: string, id: string) => fetch(`${API}/quizzes/${id}/result`, { headers: auth(token) }),
};

// ─── Questions ───────────────────────────────────────────────────────────────
export const questionsApi = {
  create: (token: string, data: any) => fetch(`${API}/questions`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Comments ────────────────────────────────────────────────────────────────
export const commentsApi = {
  getByLesson: (lessonId: string, token?: string) => fetch(`${API}/lessons/${lessonId}/comments`, { headers: token ? auth(token) : {} }),
  create: (token: string, lessonId: string, data: { content: string }) =>
    fetch(`${API}/lessons/${lessonId}/comments`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  reply: (token: string, lessonId: string, commentId: string, data: { content: string }) =>
    fetch(`${API}/lessons/${lessonId}/comments/${commentId}/reply`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (token: string, data: { courseId: string; rating: number; comment: string }) =>
    fetch(`${API}/reviews`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  update: (token: string, id: string, data: any) =>
    fetch(`${API}/reviews/${id}`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Enrollments ─────────────────────────────────────────────────────────────
export const enrollmentsApi = {
  create: (token: string, courseId: string) => fetch(`${API}/enrollments`, { method: "POST", headers: h(token), body: JSON.stringify({ courseId }) }),
  getMyCourses: (token: string) => fetch(`${API}/enrollments/my-courses`, { headers: auth(token) }),
  updateProgress: (token: string, data: any) => fetch(`${API}/enrollments/progress`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
  unenroll: (token: string, courseId: string) => fetch(`${API}/enrollments/${courseId}`, { method: "DELETE", headers: auth(token) }),
  getStatus: (token: string, courseId: string) => fetch(`${API}/enrollments/${courseId}/status`, { headers: auth(token) }),
};

// ─── Cart ────────────────────────────────────────────────────────────────────
export const cartApi = {
  get: (token: string) => fetch(`${API}/cart`, { headers: auth(token) }),
  add: (token: string, courseId: string) => fetch(`${API}/cart/add`, { method: "POST", headers: h(token), body: JSON.stringify({ courseId }) }),
  removeItem: (token: string, itemId: string) => fetch(`${API}/cart/item/${itemId}`, { method: "DELETE", headers: auth(token) }),
  applyCoupon: (token: string, code: string) => fetch(`${API}/cart/apply-coupon`, { method: "POST", headers: h(token), body: JSON.stringify({ code }) }),
  clear: (token: string) => fetch(`${API}/cart/clear`, { method: "DELETE", headers: auth(token) }),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (token: string, data?: any) => fetch(`${API}/orders`, { method: "POST", headers: h(token), body: JSON.stringify(data || {}) }),
  getMy: (token: string) => fetch(`${API}/orders/me`, { headers: auth(token) }),
  getById: (token: string, id: string) => fetch(`${API}/orders/${id}`, { headers: auth(token) }),
};

// ─── Payments ────────────────────────────────────────────────────────────────
export const paymentsApi = {
  generateQR: (token: string, data: any) => fetch(`${API}/payments/qr`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  webhook: (data: any) => fetch(`${API}/payments/webhook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (token: string) => fetch(`${API}/notifications`, { headers: auth(token) }),
  markAllRead: (token: string) => fetch(`${API}/notifications/read-all`, { method: "PUT", headers: auth(token) }),
  markRead: (token: string, id: string) => fetch(`${API}/notifications/${id}/read`, { method: "PUT", headers: auth(token) }),
  delete: (token: string, id: string) => fetch(`${API}/notifications/${id}`, { method: "DELETE", headers: auth(token) }),
};

// ─── Coupons ─────────────────────────────────────────────────────────────────
export const couponsApi = {
  create: (token: string, data: any) => fetch(`${API}/coupons`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getAll: (token: string) => fetch(`${API}/coupons`, { headers: auth(token) }),
  getByCode: (code: string, token?: string) => fetch(`${API}/coupons/${code}`, { headers: token ? auth(token) : {} }),
};

// ─── Certificates ────────────────────────────────────────────────────────────
export const certificatesApi = {
  getAll: (token: string) => fetch(`${API}/certificates`, { headers: auth(token) }),
  generate: (token: string, data: { courseId: string }) => fetch(`${API}/certificates/generate`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  getByCode: (code: string) => fetch(`${API}/certificates/${code}`),
};

// ─── Progress ────────────────────────────────────────────────────────────────
export const progressApi = {
  getAll: (token: string) => fetch(`${API}/progress`, { headers: auth(token) }),
  getCourse: (token: string, courseId: string) => fetch(`${API}/progress/course/${courseId}`, { headers: auth(token) }),
  updateCourse: (token: string, courseId: string, data: any) => fetch(`${API}/progress/course/${courseId}`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
  getVideo: (token: string, courseId: string) => fetch(`${API}/progress/video/${courseId}`, { headers: auth(token) }),
  getVideoLesson: (token: string, lessonId: string) => fetch(`${API}/progress/video/lesson/${lessonId}`, { headers: auth(token) }),
  updateVideo: (token: string, data: any) => fetch(`${API}/progress/video`, { method: "PUT", headers: h(token), body: JSON.stringify(data) }),
};

// ─── Parents ─────────────────────────────────────────────────────────────────
export const parentsApi = {
  linkChild: (token: string, data: { childUsername: string }) => fetch(`${API}/parents/link-child`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  acceptLinkRequest: (token: string, id: string) => fetch(`${API}/parents/link-request/${id}/accept`, { method: "POST", headers: auth(token) }),
  rejectLinkRequest: (token: string, id: string) => fetch(`${API}/parents/link-request/${id}/reject`, { method: "POST", headers: auth(token) }),
  deleteLinkRequest: (token: string, id: string) => fetch(`${API}/parents/link-requests/${id}`, { method: "DELETE", headers: auth(token) }),
  unlinkChild: (token: string, childId: string) => fetch(`${API}/parents/children/${childId}/link`, { method: "DELETE", headers: auth(token) }),
  getOutgoingRequests: (token: string) => fetch(`${API}/parents/link-requests/outgoing`, { headers: auth(token) }),
  getIncomingRequests: (token: string) => fetch(`${API}/parents/link-requests/incoming`, { headers: auth(token) }),
  getMyChildren: (token: string) => fetch(`${API}/parents/me/children`, { headers: auth(token) }),
  getChildProgress: (token: string, id: string) => fetch(`${API}/parents/children/${id}/progress`, { headers: auth(token) }),
  getChildCourses: (token: string, id: string) => fetch(`${API}/parents/children/${id}/courses`, { headers: auth(token) }),
  getChildDashboard: (token: string, id: string) => fetch(`${API}/parents/children/${id}/dashboard`, { headers: auth(token) }),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: (token: string) => fetch(`${API}/admin/dashboard`, { headers: auth(token) }),
  getUsers: (token: string) => fetch(`${API}/admin/users`, { headers: auth(token) }),
  createUser: (token: string, data: any) => fetch(`${API}/admin/users`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  updateUser: (token: string, id: string, data: any) => fetch(`${API}/admin/users/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  deleteUser: (token: string, id: string) => fetch(`${API}/admin/users/${id}`, { method: "DELETE", headers: auth(token) }),
  getOrders: (token: string) => fetch(`${API}/admin/orders`, { headers: auth(token) }),
  getCourses: (token: string) => fetch(`${API}/admin/courses`, { headers: auth(token) }),
  createCourse: (token: string, data: any) => fetch(`${API}/admin/courses`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  updateCourse: (token: string, id: string, data: any) => fetch(`${API}/admin/courses/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  publishCourse: (token: string, id: string) => fetch(`${API}/admin/courses/${id}/publish`, { method: "PUT", headers: auth(token) }),
  rejectCourse: (token: string, id: string) => fetch(`${API}/admin/courses/${id}/reject`, { method: "PUT", headers: auth(token) }),
  deleteCourse: (token: string, id: string) => fetch(`${API}/admin/courses/${id}`, { method: "DELETE", headers: auth(token) }),
  getLessons: (token: string) => fetch(`${API}/admin/lessons`, { headers: auth(token) }),
  createLesson: (token: string, data: any) => fetch(`${API}/admin/lessons`, { method: "POST", headers: h(token), body: JSON.stringify(data) }),
  updateLesson: (token: string, id: string, data: any) => fetch(`${API}/admin/lessons/${id}`, { method: "PATCH", headers: h(token), body: JSON.stringify(data) }),
  deleteLesson: (token: string, id: string) => fetch(`${API}/admin/lessons/${id}`, { method: "DELETE", headers: auth(token) }),
};
