export interface User { id: number; email: string; full_name: string; created_at: string }
export interface TokenResponse { access_token: string; token_type: string; user: User }

export interface ResumeListItem {
  id: number; title: string; original_name: string; file_type: string; file_size: number; created_at: string;
}
export interface ResumeDetail extends ResumeListItem {
  extracted_text: string;
  info: { email: string | null; phone: string | null; word_count: number };
}

export interface Job { id: number; title: string; company: string; description: string; created_at: string }
export interface JobInput { title: string; company: string; description: string }

export interface AnalysisResult {
  match_score: number; summary: string; matching_skills: string[]; missing_skills: string[];
  relevant_experience: string[]; education_analysis: string; keywords: string[]; suggestions: string[];
}
export interface Analysis {
  id: number; resume_id: number; job_id: number; resume_title: string; job_title: string; company: string;
  match_score: number; result: AnalysisResult; model_name: string; prompt_version: string;
  created_at: string; disclaimer: string;
}
export interface AnalysisListItem {
  id: number; resume_title: string; job_title: string; company: string; match_score: number; created_at: string;
}

export const STATUSES = ["applied", "shortlisted", "interview", "rejected", "offered"] as const;
export type ApplicationStatus = (typeof STATUSES)[number];
export interface Note { id: number; content: string; created_at: string }
export interface Application {
  id: number; company: string; position: string; status: ApplicationStatus; applied_on: string | null;
  interview_date: string | null; job_id: number | null; created_at: string; notes: Note[];
}
export interface ApplicationInput {
  company: string; position: string; status: ApplicationStatus; applied_on?: string | null;
  interview_date?: string | null; note?: string | null;
}

export interface DashboardSummary {
  total_resumes: number; total_jobs: number; total_analyses: number; average_match_score: number | null;
  recent_analyses: AnalysisListItem[]; applications_by_status: Record<ApplicationStatus, number>;
}

export interface ChatMessage { role: "user" | "assistant"; content: string }
export interface ChatResponse { reply: string; tools_used: string[] }
