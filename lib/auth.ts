import { User, UserRole } from "@/types";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User, token: string): void {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("access_token", token);
}

export function clearAuth(): void {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
}

const ROLE_LEVEL: Record<UserRole, number> = {
  GUEST: 0,
  MEMBER: 1,
  VOLUNTEER: 2,
  EC_OFFICER: 3,
  PRESIDENT: 4,
  SECRETARY: 4,
  FACULTY_ADVISOR: 5,
  SYSTEM_ADMIN: 6,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === "FACULTY_ADVISOR") {
    return requiredRole === "FACULTY_ADVISOR" || requiredRole === "GUEST" || requiredRole === "MEMBER";
  }
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

export function canWrite(userRole: UserRole): boolean {
  return userRole !== "GUEST" && userRole !== "FACULTY_ADVISOR";
}

export function isEcOfficer(role: UserRole): boolean {
  return ["EC_OFFICER", "PRESIDENT", "SECRETARY", "SYSTEM_ADMIN"].includes(role);
}

export function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() >= payload.exp * 1000;
}
