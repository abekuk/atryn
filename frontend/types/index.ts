// --- Auth ---
export interface AuthResponse {
  token: string;
  user: StudentUser | ProfessorUser;
}

export interface StudentUser {
  id: number | string;
  role: "student";
  name: string;
  email: string;
  program: string;
  year: number;
  interests: string;
}

export interface ProfessorUser {
  id: number | string;
  role: "professor";
  name: string;
  email: string;
  department: string;
  labName: string;
}

export type AppUser = StudentUser | ProfessorUser;

// --- Lab ---
export interface Lab {
  id: number | string;
  labName: string;
  professorId: number | null;
  professorName?: string;
  professorEmail?: string;
  topics: string;
  description: string;
  department?: string;
  aiDescription?: string;
}

// --- Submission ---
export interface Submission {
  id: number | string;
  studentId: number | string;
  labId: number | string;
  videoUrl: string;
  status: "pending" | "shortlisted" | "rejected";
  createdAt: string;
  // Joined fields
  studentName?: string;
  studentEmail?: string;
  studentProgram?: string;
  studentYear?: number;
  studentInterests?: string;
  labName?: string;
}

// --- Chat ---
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  labs?: Lab[];
  timestamp: number;
}

export interface ChatResponse {
  reply: string;
  labs?: Lab[];
}
