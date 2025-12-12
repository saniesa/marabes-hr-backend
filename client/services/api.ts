import axios from "axios";
import {
  Course,
  Employee,
  TimeOffRequest,
  UserScore,
  EvaluationCategory,
  AttendanceRecord,
} from "../types";

const API_BASE = "http://localhost:5000/api"; // <-- added /api prefix

// Set token in headers
const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

// ===== AUTH =====
export const login = async (email: string, password: string) => {
  const res = await axios.post(`${API_BASE.replace("/api","")}/auth/login`, { email, password }); // auth can stay outside /api
  if (res.data.token) {
    localStorage.setItem("marabes_token", res.data.token);
    setAuthToken(res.data.token);
  }
  return res.data;
};


// Existing functions: login, logout, etc.

export const updateTheme = async (userId: number, theme: string) => {
  const res = await axios.patch(`${API_BASE}/auth/theme`, { userId, theme });
  return res.data; // returns updated user
};
export const logout = () => {
  localStorage.removeItem("marabes_token");
  setAuthToken(null);
};

// Initialize token on load
const token = localStorage.getItem("marabes_token");
if (token) setAuthToken(token);

// ===== USERS =====
export const getUsers = async (): Promise<Employee[]> => {
  const res = await axios.get(`${API_BASE}/users`);
  return res.data;
};

export const getUserByEmail = async (email: string): Promise<Employee | undefined> => {
  const users = await getUsers();
  return users.find((u) => u.email === email);
};

export const addUser = async (user: Omit<Employee, "id">) => {
  const res = await axios.post(`${API_BASE}/users`, user);
  return res.data;
};

export const updateUser = async (user: Employee) => {
  const res = await axios.put(`${API_BASE}/users/${user.id}`, user);
  return res.data;
};

export const deleteUser = async (id: string) => {
  await axios.delete(`${API_BASE}/users/${id}`);
};

// ===== TIME OFF =====
export const getTimeOffRequests = async (): Promise<TimeOffRequest[]> => {
  const res = await axios.get(`${API_BASE}/timeoff`);
  return res.data;
};

export const addTimeOffRequest = async (req: Omit<TimeOffRequest, "id" | "status">) => {
  const res = await axios.post(`${API_BASE}/timeoff`, req);
  return res.data;
};

export const updateTimeOffStatus = async (id: string, status: string, note?: string) => {
  const res = await axios.put(`${API_BASE}/timeoff/${id}`, { status, note });
  return res.data;
};

// ===== CATEGORIES =====
export const getCategories = async (): Promise<EvaluationCategory[]> => {
  const res = await axios.get(`${API_BASE}/categories`);
  return res.data;
};

export const addCategory = async (name: string) => {
  const res = await axios.post(`${API_BASE}/categories`, { name });
  return res.data;
};

// ===== SCORES =====
export const getScores = async (): Promise<UserScore[]> => {
  const res = await axios.get(`${API_BASE}/scores`);
  return res.data;
};

export const getScoresByUser = async (userId: string): Promise<UserScore[]> => {
  const res = await axios.get(`${API_BASE}/scores?userId=${userId}`);
  return res.data;
};

export const getScoresByCategory = async (categoryId: string): Promise<UserScore[]> => {
  const res = await axios.get(`${API_BASE}/scores?categoryId=${categoryId}`);
  return res.data;
};

export const addScore = async (score: Omit<UserScore, "id">) => {
  const res = await axios.post(`${API_BASE}/scores`, score);
  return res.data;
};

export const updateScore = async (id: string, score: number, feedback?: string) => {
  const res = await axios.put(`${API_BASE}/scores/${id}`, { score, feedback });
  return res.data;
};

export const deleteScore = async (id: string) => {
  await axios.delete(`${API_BASE}/scores/${id}`);
};

export const getUserAverageScore = async (userId: string) => {
  const res = await axios.get(`${API_BASE}/scores/average/${userId}`);
  return res.data;
};

export const getCategoryStats = async () => {
  const res = await axios.get(`${API_BASE}/scores/category-stats`);
  return res.data;
};

export const getGlobalTrend = async () => {
  const res = await axios.get(`${API_BASE}/scores/global-trend`);
  return res.data;
};

// ===== COURSES =====
export const getCourses = async (): Promise<Course[]> => {
  const res = await axios.get(`${API_BASE}/courses`);
  return res.data;
};

export const addCourse = async (course: Omit<Course, "id" | "enrolledCount">) => {
  const res = await axios.post(`${API_BASE}/courses`, course);
  return res.data;
};

// ===== ENROLLMENTS =====
export const getEnrollments = async (userId: string) => {
  const res = await axios.get(`${API_BASE}/enrollments/${userId}`);
  return res.data;
};

export const enrollCourse = async (userId: string, courseId: string) => {
  const res = await axios.post(`${API_BASE}/enrollments`, { userId, courseId });
  return res.data;
};

// ===== ATTENDANCE =====
export const getTodayAttendance = async (userId: string): Promise<AttendanceRecord | null> => {
  const res = await axios.get(`${API_BASE}/attendance/${userId}/today`);
  return res.data;
};

export const clockIn = async (userId: string) => {
  const res = await axios.post(`${API_BASE}/attendance/${userId}/clockin`);
  return res.data;
};

export const clockOut = async (userId: string) => {
  const res = await axios.post(`${API_BASE}/attendance/${userId}/clockout`);
  return res.data;
};

export const getAttendanceHistory = async (userId: string) => {
  const res = await axios.get(`${API_BASE}/attendance/${userId}/history`);
  return res.data;
};
