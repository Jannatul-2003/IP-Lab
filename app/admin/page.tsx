"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Users, Vote, DollarSign, Image, Bell, Settings, Activity, Lock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { mockMembers, mockNotices, mockElection, mockBudgets, mockStats } from "@/lib/mockData";
import { timeAgo } from "@/lib/utils";

const MOCK_USERS = [
  { id: "u10", email: "president@csedu.du.ac.bd", role: "PRESIDENT", status: "ACTIVE", lastLogin: "2026-04-23T10:00:00Z" },
  { id: "u11", email: "secretary@csedu.du.ac.bd", role: "SECRETARY", status: "ACTIVE", lastLogin: "2026-04-22T14:30:00Z" },
  { id: "u12", email: "ec@csedu.du.ac.bd", role: "EC_OFFICER", status: "ACTIVE", lastLogin: "2026-04-20T09:00:00Z" },
  { id: "u13", email: "member@csedu.du.ac.bd", role: "MEMBER", status: "ACTIVE", lastLogin: "2026-04-19T16:00:00Z" },
  { id: "u14", email: "advisor@csedu.du.ac.bd", role: "FACULTY_ADVISOR", status: "ACTIVE", lastLogin: "2026-04-18T11:00:00Z" },
];

const MOCK_AUDIT = [
  { id: "a1", action: "MEMBER_APPROVED", actor: "ec@csedu.du.ac.bd", target: "Mohammad Sajid Al Rafi Hasan", ts: "2026-04-24T08:00:00Z" },
  { id: "a2", action: "ELECTION_PHASE1_OPENED", actor: "secretary@csedu.du.ac.bd", target: "EC Election 2026", ts: "2026-04-23T10:00:00Z" },
  { id: "a3", action: "BUDGET_APPROVED", actor: "president@csedu.du.ac.bd", target: "General Term Budget ৳1,50,000", ts: "2026-04-22T14:00:00Z" },
  { id: "a4", action: "NOTICE_PUBLISHED", actor: "secretary@csedu.du.ac.bd", target: "EC Election 2026 Announcement", ts: "2026-04-20T10:00:00Z" },
  { id: "a5", action: "EVENT_PUBLISHED", actor: "ec@csedu.du.ac.bd", target: "Annual Programming Contest 2026", ts: "2026-04-01T00:00:00Z" },
];

const ROLE_COLOR: Record<string, string> = {
  PRESIDENT: "bg-yellow-100 text-yellow-700",
  SECRETARY: "bg-orange-100 text-orange-700",
  EC_OFFICER: "bg-purple-100 text-purple-700",
  MEMBER: "bg-blue-100 text-blue-700",
  FACULTY_ADVISOR: "bg-green-100 text-green-700",
  SYSTEM_ADMIN: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "audit">("overview");
  const [resetTarget, setResetTarget] = useState<(typeof MOCK_USERS)[0] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "SYSTEM_ADMIN") router.push("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "SYSTEM_ADMIN") return null;

  async function handleReset() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setResetTarget(null);
    toast.success(`Password reset email sent to ${resetTarget?.email}.`);
  }

  const tabs = [
    { key: "overview", label: t("admin.overview"), icon: <Activity className="w-4 h-4" /> },
    { key: "users", label: t("admin.users"), icon: <Users className="w-4 h-4" /> },
    { key: "audit", label: t("admin.auditLog"), icon: <Shield className="w-4 h-4" /> },
  ] as const;

  const overviewStats = [
    { label: t("admin.totalMembers"), value: mockStats.totalMembers, icon: "👥", color: "text-blue-600" },
    { label: t("admin.activeEvents"), value: mockStats.activeEvents, icon: "🎪", color: "text-green-600" },
    { label: t("admin.currentTerm"), value: `Term ${mockStats.currentTerm}`, icon: "📅", color: "text-accent" },
    { label: t("admin.completedElections"), value: mockStats.completedElections, icon: "🗳", color: "text-purple-600" },
  ];

  const modules = [
    { label: t("admin.memberManagement"), href: "/ec/members", icon: <Users className="w-5 h-5 text-blue-500" />, count: `${mockMembers.length} ${t("admin.members")}` },
    { label: t("admin.electionControl"), href: "/ec/elections", icon: <Vote className="w-5 h-5 text-purple-500" />, count: mockElection.status.replace("_", " ") },
    { label: t("admin.finance"), href: "/ec/finance", icon: <DollarSign className="w-5 h-5 text-green-500" />, count: `${mockBudgets.length} ${t("admin.budgets")}` },
    { label: t("admin.media"), href: "/ec/media", icon: <Image className="w-5 h-5 text-orange-500" />, count: `6 ${t("admin.items")}` },
    { label: t("admin.notices"), href: "/notices", icon: <Bell className="w-5 h-5 text-yellow-500" />, count: `${mockNotices.length} ${t("admin.notices")}` },
    { label: t("admin.settings"), href: "#", icon: <Settings className="w-5 h-5 text-gray-400" />, count: t("admin.systemConfig") },
  ];

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-red-500" />
                <span className="text-xs font-medium text-red-500 uppercase tracking-wider">{t("admin.systemAdmin")}</span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-primary">{t("admin.title")}</h1>
              <p className="text-gray-400 text-sm mt-1">{t("admin.subtitle")}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.key ? "bg-accent text-white shadow-sm" : "bg-white border border-slate-100 text-gray-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {overviewStats.map((s) => (
                    <div key={s.label} className="card text-center">
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Module shortcuts */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {modules.map((mod) => (
                    <button
                      key={mod.label}
                      onClick={() => mod.href !== "#" && router.push(mod.href)}
                      className="card text-left hover:border-accent/30 hover:shadow-card-hover transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {mod.icon}
                        <p className="font-semibold text-primary text-sm group-hover:text-accent transition-colors">{mod.label}</p>
                      </div>
                      <p className="text-xs text-gray-400">{mod.count}</p>
                    </button>
                  ))}
                </div>

                {/* Recent notices */}
                <div className="card">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4">{t("admin.recentNotices")}</h2>
                  <div className="space-y-2">
                    {mockNotices.slice(0, 3).map((n) => (
                      <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                        <span className="text-base">{n.noticeType === "Election" ? "🗳" : n.noticeType === "Policy" ? "📜" : "📢"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-primary truncate">{n.title}</p>
                          <p className="text-xs text-gray-400">{timeAgo(n.publishedAt)}</p>
                        </div>
                        <Badge variant="outline">{n.noticeType}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Users tab */}
            {activeTab === "users" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden p-0">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> {t("admin.systemUsers")}
                  </h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {MOCK_USERS.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary text-sm">{u.email}</p>
                        <p className="text-xs text-gray-400">{t("admin.lastLogin")}: {timeAgo(u.lastLogin)}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role] ?? "bg-gray-100 text-gray-500"}`}>
                        {u.role}
                      </span>
                      <StatusBadge status={u.status} />
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                        onClick={() => setResetTarget(u)}
                      >
                        {t("admin.resetPw")}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Audit log tab */}
            {activeTab === "audit" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-hidden p-0">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-400" /> {t("admin.auditLog")}
                  </h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {MOCK_AUDIT.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-primary text-sm">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-400">
                          {t("admin.by")} <span className="font-medium">{log.actor}</span> · {t("admin.target")}: {log.target}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(log.ts)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!resetTarget}
        onConfirm={handleReset}
        onCancel={() => setResetTarget(null)}
        title={t("admin.resetPwTitle")}
        message={`Send a password reset email to ${resetTarget?.email}?`}
        confirmLabel={t("admin.resetPwConfirm")}
        variant="info"
        isLoading={loading}
      />
    </PageLayout>
  );
}
