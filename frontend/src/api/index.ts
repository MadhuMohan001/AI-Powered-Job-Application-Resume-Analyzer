import { api } from "./client";
import type {
  Analysis, AnalysisListItem, Application, ApplicationInput, ApplicationStatus, ChatMessage, ChatResponse,
  DashboardSummary, Job, JobInput, ResumeDetail, ResumeListItem, TokenResponse, User,
} from "../types";

export const authApi = {
  register: (d: { email: string; full_name: string; password: string }) =>
    api.post<TokenResponse>("/auth/register", d).then((r) => r.data),
  login: (d: { email: string; password: string }) => api.post<TokenResponse>("/auth/login", d).then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data),
  update: (d: { full_name?: string; password?: string }) => api.patch<User>("/auth/me", d).then((r) => r.data),
};

export const resumeApi = {
  upload: (file: File, title?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    return api.post<ResumeDetail>("/resumes/upload", form).then((r) => r.data);
  },
  list: () => api.get<ResumeListItem[]>("/resumes").then((r) => r.data),
  get: (id: number) => api.get<ResumeDetail>(`/resumes/${id}`).then((r) => r.data),
  remove: (id: number) => api.delete(`/resumes/${id}`),
};

export const jobApi = {
  create: (d: JobInput) => api.post<Job>("/jobs", d).then((r) => r.data),
  list: () => api.get<Job[]>("/jobs").then((r) => r.data),
  remove: (id: number) => api.delete(`/jobs/${id}`),
};

export const analysisApi = {
  analyze: (resume_id: number, job_id: number) =>
    api.post<Analysis>("/analysis/analyze", { resume_id, job_id }).then((r) => r.data),
  history: () => api.get<AnalysisListItem[]>("/analysis/history").then((r) => r.data),
  get: (id: number) => api.get<Analysis>(`/analysis/${id}`).then((r) => r.data),
  remove: (id: number) => api.delete(`/analysis/${id}`),
};

export const assistantApi = {
  chat: (d: { resume_id: number; job_id?: number; message: string; history: ChatMessage[] }) =>
    api.post<ChatResponse>("/assistant/chat", d).then((r) => r.data),
};

export const applicationApi = {
  list: (status?: ApplicationStatus) =>
    api.get<Application[]>("/applications", { params: status ? { status } : {} }).then((r) => r.data),
  create: (d: ApplicationInput) => api.post<Application>("/applications", d).then((r) => r.data),
  update: (id: number, d: Partial<ApplicationInput>) =>
    api.patch<Application>(`/applications/${id}`, d).then((r) => r.data),
  remove: (id: number) => api.delete(`/applications/${id}`),
  addNote: (id: number, content: string) =>
    api.post<Application>(`/applications/${id}/notes`, { content }).then((r) => r.data),
};

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};
