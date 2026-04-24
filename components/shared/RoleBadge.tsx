import React from "react";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  GUEST: { label: "Guest", color: "bg-gray-100 text-gray-600" },
  MEMBER: { label: "Member", color: "bg-blue-100 text-blue-700" },
  VOLUNTEER: { label: "Volunteer", color: "bg-teal-100 text-teal-700" },
  EC_OFFICER: { label: "EC Officer", color: "bg-purple-100 text-purple-700" },
  PRESIDENT: { label: "President", color: "bg-yellow-100 text-yellow-800" },
  SECRETARY: { label: "Secretary", color: "bg-orange-100 text-orange-700" },
  FACULTY_ADVISOR: { label: "Faculty Advisor", color: "bg-green-100 text-green-700" },
  SYSTEM_ADMIN: { label: "System Admin", color: "bg-red-100 text-red-700" },
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const config = roleConfig[role] ?? { label: role, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("badge font-semibold", config.color, className)}>
      {config.label}
    </span>
  );
}
