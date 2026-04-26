"use client";
import React from "react";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { useLang } from "@/app/providers";

const roleConfig: Record<UserRole, { color: string }> = {
  GUEST: { color: "bg-gray-100 text-gray-600" },
  MEMBER: { color: "bg-blue-100 text-blue-700" },
  VOLUNTEER: { color: "bg-teal-100 text-teal-700" },
  EC_OFFICER: { color: "bg-purple-100 text-purple-700" },
  PRESIDENT: { color: "bg-yellow-100 text-yellow-800" },
  SECRETARY: { color: "bg-orange-100 text-orange-700" },
  FACULTY_ADVISOR: { color: "bg-green-100 text-green-700" },
  SYSTEM_ADMIN: { color: "bg-red-100 text-red-700" },
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const { t } = useLang();
  const config = roleConfig[role] ?? { color: "bg-gray-100 text-gray-600" };
  return (
    <span className={cn("badge font-semibold", config.color, className)}>
      {t(`roles.${role}`)}
    </span>
  );
}
