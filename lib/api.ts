import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    const apiError: ApiError = {
      type: error.response?.data?.type || "about:blank",
      title: error.response?.data?.title || "Error",
      status: error.response?.status || 500,
      detail: error.response?.data?.detail || "An unexpected error occurred.",
    };
    return Promise.reject(apiError);
  }
);

async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<T>(url, config);
  return res.data;
}

async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<T>(url, data, config);
  return res.data;
}

async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.patch<T>(url, data, config);
  return res.data;
}

async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete<T>(url, config);
  return res.data;
}

export const api = { get, post, patch, delete: del };

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    post<{ accessToken: string }>("/auth/login", { email, password }),
  logout: () => post("/auth/logout"),
};

// Members
export const membersApi = {
  apply: (data: unknown) => post("/members/apply", data),
  list: (page = 1, limit = 20) =>
    get(`/members?page=${page}&limit=${limit}`),
  get: (id: string) => get(`/members/${id}`),
  update: (id: string, data: unknown) => patch(`/members/${id}`, data),
  pending: (page = 1) => get(`/members/pending?page=${page}&limit=20`),
  approve: (id: string) => post(`/members/${id}/approve`),
  reject: (id: string, reason: string) =>
    post(`/members/${id}/reject`, { reason }),
  cancel: (id: string, grounds: string) =>
    post(`/members/${id}/cancel`, { grounds }),
};

// Elections
export const electionsApi = {
  create: (data: unknown) => post("/elections", data),
  list: (page = 1) => get(`/elections?page=${page}&limit=20`),
  get: (id: string) => get(`/elections/${id}`),
  openPhase1: (id: string) => post(`/elections/${id}/open-phase1`),
  closePhase1: (id: string) => post(`/elections/${id}/close-phase1`),
  openPhase2: (id: string) => post(`/elections/${id}/open-phase2`),
  closePhase2: (id: string) => post(`/elections/${id}/close-phase2`),
  registerCandidate: (id: string, data: unknown) =>
    post(`/elections/${id}/candidates`, data),
  candidates: (id: string) => get(`/elections/${id}/candidates`),
  vote: (id: string, data: unknown) => post(`/elections/${id}/vote`, data),
  results: (id: string) => get(`/elections/${id}/results`),
};

// Events
export const eventsApi = {
  create: (data: unknown) => post("/events", data),
  list: (page = 1) => get(`/events?page=${page}&limit=20`),
  get: (id: string) => get(`/events/${id}`),
  update: (id: string, data: unknown) => patch(`/events/${id}`, data),
  rsvp: (id: string) => post(`/events/${id}/rsvp`),
  cancelRsvp: (id: string) => del(`/events/${id}/rsvp`),
  createVolunteerRole: (id: string, data: unknown) =>
    post(`/events/${id}/volunteer-roles`, data),
  assignVolunteer: (eventId: string, roleId: string, data: unknown) =>
    post(`/events/${eventId}/volunteer-roles/${roleId}/assign`, data),
};

// Notices
export const noticesApi = {
  create: (data: unknown) => post("/notices", data),
  list: (page = 1) => get(`/notices?page=${page}&limit=20`),
  get: (id: string) => get(`/notices/${id}`),
};

// Finance
export const financeApi = {
  createBudget: (data: unknown) => post("/finance/budgets", data),
  listBudgets: (page = 1) => get(`/finance/budgets?page=${page}&limit=20`),
  approveBudget: (id: string) => post(`/finance/budgets/${id}/approve`),
  logExpenditure: (data: unknown) => post("/finance/expenditures", data),
  termReport: (termId: string) => get(`/finance/reports/term/${termId}`),
};

// Media
export const mediaApi = {
  getUploadUrl: (data: unknown) => post("/media/upload-url", data),
  confirm: (data: unknown) => post("/media/confirm", data),
  list: (page = 1) => get(`/media?page=${page}&limit=20`),
};
