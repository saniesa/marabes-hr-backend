export type Role = "ADMIN" | "EMPLOYEE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
}

export interface Employee extends User {
  jobPosition: string;
  birthday: string;
  dateHired: string;
  phone: string;
  address: string;
  department: string;
}

export interface TimeOffRequest {
  id: string;
  userId: string;
  userName: string; // Denormalized for simpler list view
  type: "Vacation" | "Sick" | "Personal";
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  reason: string;
}

export interface EvaluationCategory {
  id: string;
  name: string; // e.g., 'Bookkeeping', 'VAT', 'Yearwork'
}

export interface UserScore {
  id: string;        // was number → must be string
  userId: string;    // was number → must be string
  userName: string;
  categoryId: string; // was number → must be string
  score: number;
  date: string;
  feedback?: string;
  status: "PRESENT" | "ABSENT";
}

export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  enrolledCount: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  dateEnrolled: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // ISO string
  clockOutTime?: string; // ISO string
  status: "CLOCKED_IN" | "CLOCKED_OUT";
}
