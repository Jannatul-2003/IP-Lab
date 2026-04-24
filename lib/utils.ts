import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, pattern = "dd MMM yyyy"): string {
  try {
    return format(parseISO(dateStr), pattern);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  return formatDate(dateStr, "dd MMM yyyy, hh:mm a");
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "…";
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidStudentId(id: string): boolean {
  return /^\d{2,4}-\d{2,4}$/.test(id);
}

export function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    GUEST: "Guest",
    MEMBER: "Member",
    VOLUNTEER: "Volunteer",
    EC_OFFICER: "EC Officer",
    PRESIDENT: "President",
    SECRETARY: "Secretary",
    FACULTY_ADVISOR: "Faculty Advisor",
    SYSTEM_ADMIN: "System Admin",
  };
  return labels[role] ?? role;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    SUSPENDED: "bg-orange-100 text-orange-700",
    CANCELLED: "bg-red-100 text-red-700",
    DRAFT: "bg-gray-100 text-gray-600",
    PUBLISHED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    PHASE1_OPEN: "bg-purple-100 text-purple-700",
    PHASE2_OPEN: "bg-indigo-100 text-indigo-700",
    approved: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}

export function eventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    workshop: "🔧",
    seminar: "🎓",
    carnival: "🎪",
    sports: "⚽",
    general: "📋",
  };
  return icons[type] ?? "📋";
}

export const MOCK_DELAY = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));
