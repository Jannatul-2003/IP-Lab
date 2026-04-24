import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-surface text-primary",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    outline: "border border-accent text-accent bg-transparent",
  };

  return (
    <span className={cn("badge", variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ACTIVE: { label: "Active", variant: "success" },
    PENDING: { label: "Pending", variant: "warning" },
    SUSPENDED: { label: "Suspended", variant: "danger" },
    CANCELLED: { label: "Cancelled", variant: "danger" },
    DRAFT: { label: "Draft", variant: "default" },
    PUBLISHED: { label: "Published", variant: "info" },
    COMPLETED: { label: "Completed", variant: "success" },
    PHASE1_OPEN: { label: "Phase 1 Open", variant: "info" },
    PHASE2_OPEN: { label: "Phase 2 Open", variant: "info" },
    approved: { label: "Approved", variant: "success" },
    pending: { label: "Pending", variant: "warning" },
    rejected: { label: "Rejected", variant: "danger" },
    RSVP_CLOSED: { label: "RSVP Closed", variant: "warning" },
    SHORTLISTING: { label: "Shortlisting", variant: "warning" },
    PHASE1_CLOSED: { label: "Phase 1 Closed", variant: "default" },
  };

  const config = map[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
