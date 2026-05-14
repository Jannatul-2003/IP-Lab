"use client";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, CheckCircle, XCircle, MinusCircle, Users } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { mockMembers } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, getInitials } from "@/lib/utils";
import { Member, MemberStatus } from "@/types";

type ActionType = "approve" | "reject" | "cancel";

export default function EcMembersPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: ActionType; member: Member } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"pending" | "active">("pending");

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) router.push("/dashboard");
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = !q || m.fullName.toLowerCase().includes(q) || m.studentId.includes(q);
      const targetStatus = tab === "pending" ? "PENDING" : "ACTIVE";
      return matchSearch && m.status === targetStatus;
    });
  }, [members, search, tab]);

  async function executeAction(type: ActionType, member: Member) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const nextStatus: Record<ActionType, MemberStatus> = {
      approve: "ACTIVE",
      reject: "SUSPENDED",
      cancel: "CANCELLED",
    };
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus[type], joinedDate: type === "approve" ? new Date().toISOString().split("T")[0] : m.joinedDate } : m))
    );
    setLoading(false);
    setConfirmAction(null);
    const msgs: Record<ActionType, string> = {
      approve: `${member.fullName} ${t("membership.approve")}.`,
      reject: `${member.fullName} ${t("membership.reject")}.`,
      cancel: `${member.fullName} ${t("membership.cancel")}.`,
    };
    if (type === "approve") toast.success(msgs[type]);
    else toast.warning(msgs[type]);
  }

  const pendingCount = members.filter((m) => m.status === "PENDING").length;
  const activeCount = members.filter((m) => m.status === "ACTIVE").length;

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1 flex items-center gap-1">
                  {t("membership.backToPanel")}
                </button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <Users className="w-7 h-7 text-blue-500" />
                  {t("membership.title")}
                </h1>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: t("membership.total"), value: members.length, color: "text-primary" },
                { label: t("membership.pendingTab"), value: pendingCount, color: "text-orange-500" },
                { label: t("membership.activeTab"), value: activeCount, color: "text-green-600" },
              ].map((s) => (
                <div key={s.label} className="card text-center">
                  <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(["pending", "active"] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    tab === tabKey ? "bg-accent text-white shadow-sm" : "bg-white text-gray-500 hover:bg-slate-100 border border-slate-100"
                  }`}
                >
                  {tabKey === "pending"
                    ? `${t("membership.pendingTab")} (${pendingCount})`
                    : `${t("membership.activeTab")} (${activeCount})`}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="card mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("membership.searchPlaceholder")}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-slate-50"
                />
              </div>
            </div>

            {/* Members list */}
            <div className="card overflow-hidden p-0">
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t("membership.noFound")}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  <AnimatePresence>
                    {filtered.map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                          {getInitials(member.fullName)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-primary text-sm">{member.fullName}</p>
                          <p className="text-xs text-gray-400">
                            {member.studentId} · {t("membership.batch")} {member.batchYear}
                            {member.phone && ` · ${member.phone}`}
                          </p>
                          {member.joinedDate && (
                            <p className="text-xs text-gray-300 mt-0.5">{t("membership.joined")} {formatDate(member.joinedDate)}</p>
                          )}
                        </div>

                        <StatusBadge status={member.status} />

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {member.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                                onClick={() => setConfirmAction({ type: "approve", member })}
                              >
                                {t("membership.approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                                onClick={() => setConfirmAction({ type: "reject", member })}
                              >
                                {t("membership.reject")}
                              </Button>
                            </>
                          )}
                          {member.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<MinusCircle className="w-3.5 h-3.5 text-red-400" />}
                              onClick={() => setConfirmAction({ type: "cancel", member })}
                              className="text-red-400 hover:text-red-600"
                            >
                              {t("membership.cancel")}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction?.type === "approve"}
        onConfirm={() => confirmAction && executeAction("approve", confirmAction.member)}
        onCancel={() => setConfirmAction(null)}
        title={t("membership.approveTitle")}
        message={`${t("membership.approve")} ${confirmAction?.member.fullName}?`}
        confirmLabel={t("membership.approveConfirm")}
        variant="info"
        isLoading={loading}
      />
      <ConfirmDialog
        isOpen={confirmAction?.type === "reject"}
        onConfirm={() => confirmAction && executeAction("reject", confirmAction.member)}
        onCancel={() => setConfirmAction(null)}
        title={t("membership.rejectTitle")}
        message={`${t("membership.reject")} ${confirmAction?.member.fullName}? ${t("common.thisActionIrreversible")}`}
        confirmLabel={t("membership.rejectConfirm")}
        variant="danger"
        isLoading={loading}
      />
      <ConfirmDialog
        isOpen={confirmAction?.type === "cancel"}
        onConfirm={() => confirmAction && executeAction("cancel", confirmAction.member)}
        onCancel={() => setConfirmAction(null)}
        title={t("membership.cancelTitle")}
        message={`${t("membership.cancel")} ${confirmAction?.member.fullName}?`}
        confirmLabel={t("membership.cancelConfirm")}
        variant="danger"
        isLoading={loading}
      />
    </PageLayout>
  );
}
