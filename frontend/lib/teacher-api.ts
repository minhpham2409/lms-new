/**
 * Teacher API helpers — wraps all teacher-related REST calls
 */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ─── Courses ────────────────────────────────────────────────────────────────
export async function createCourse(token: string, data: {
  title: string; description?: string; price: number; thumbnail?: string; status?: string;
}) {
  const res = await fetch(`${API}/courses`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể tạo khóa học");
  return json;
}

export async function updateCourse(token: string, id: string, data: Record<string, any>) {
  const res = await fetch(`${API}/courses/${id}`, {
    method: "PUT", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể cập nhật");
  return json;
}

export async function getMyCourses(token: string) {
  const res = await fetch(`${API}/courses/my`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Không thể tải danh sách khóa học");
  return res.json();
}

export async function getCourse(id: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/courses/${id}`, { headers });
  if (!res.ok) throw new Error("Không tìm thấy khóa học");
  return res.json();
}

// ─── Sections ────────────────────────────────────────────────────────────────
export async function createSection(token: string, data: { title: string; courseId: string; order?: number }) {
  const res = await fetch(`${API}/sections`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể tạo chương");
  return json;
}

export async function updateSection(token: string, id: string, data: { title: string }) {
  const res = await fetch(`${API}/sections/${id}`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể cập nhật chương");
  return json;
}

export async function deleteSection(token: string, id: string) {
  const res = await fetch(`${API}/sections/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể xóa chương");
}

// ─── Lessons ─────────────────────────────────────────────────────────────────
export async function createLesson(token: string, data: {
  title: string; sectionId: string; content?: string; videoUrl?: string; duration?: number;
}) {
  const res = await fetch(`${API}/lessons`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể tạo bài học");
  return json;
}

export async function updateLesson(token: string, id: string, data: Record<string, any>) {
  const res = await fetch(`${API}/lessons/${id}`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể cập nhật bài học");
  return json;
}

export async function deleteLesson(token: string, id: string) {
  const res = await fetch(`${API}/lessons/${id}`, {
    method: "DELETE", headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Không thể xóa bài học");
}

// ─── Assignments ─────────────────────────────────────────────────────────────
export async function createAssignment(token: string, data: {
  title: string; lessonId: string; type: "essay" | "quiz"; description?: string; maxScore?: number; dueDate?: string;
}) {
  const res = await fetch(`${API}/assignments`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể tạo bài tập");
  return json;
}

export async function getAssignmentsByLesson(token: string, lessonId: string) {
  const res = await fetch(`${API}/assignments?lessonId=${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getSubmissions(token: string, assignmentId: string) {
  const res = await fetch(`${API}/assignments/${assignmentId}/submissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function gradeSubmission(token: string, submissionId: string, data: { score: number; feedback?: string }) {
  const res = await fetch(`${API}/submissions/${submissionId}/grade`, {
    method: "PATCH", headers: authHeaders(token), body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Không thể chấm điểm");
  return json;
}
