"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, Users, DollarSign, Vote, FileText, BookOpen } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { useAuthContext, useLang } from "@/app/providers";
import { mockMembers, mockBudgets, mockExpenditures, mockElection, mockNotices } from "@/lib/mockData";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

function ReadOnlyBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm mb-6">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function AdvisorPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "FACULTY_ADVISOR") router.push("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "FACULTY_ADVISOR") return null;

  const activeMembers = mockMembers.filter((m) => m.status === "ACTIVE");
  const pendingMembers = mockMembers.filter((m) => m.status === "PENDING");
  const totalBudget = mockBudgets.filter((b) => b.status === "approved").reduce((s, b) => s + b.totalAmountBdt, 0);
  const totalSpent = mockExpenditures.reduce((s, e) => s + e.amountBdt, 0);

  const stats = [
    { label: t("advisor.activeMembers"), value: activeMembers.length, icon: "👥", color: "text-blue-600" },
    { label: t("advisor.pendingApps"), value: pendingMembers.length, icon: "⏳", color: "text-orange-500" },
    { label: t("advisor.approvedBudget"), value: formatCurrency(totalBudget), icon: "💰", color: "text-green-600" },
    { label: t("advisor.totalSpent"), value: formatCurrency(totalSpent), icon: "📤", color: "text-red-500" },
  ];

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                <BookOpen className="w-7 h-7 text-green-600" />
                {t("advisor.title")}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">{t("advisor.subtitle")}</p>
            </div>

            <ReadOnlyBanner label={t("advisor.readOnly")} />

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Members overview */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> {t("advisor.members")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-slate-100">
                      <th className="pb-3 font-medium">{t("advisor.name")}</th>
                      <th className="pb-3 font-medium">{t("advisor.studentId")}</th>
                      <th className="pb-3 font-medium">{t("advisor.batch")}</th>
                      <th className="pb-3 font-medium">{t("advisor.status")}</th>
                      <th className="pb-3 font-medium">{t("advisor.joined")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mockMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                              {getInitials(m.fullName)}
                            </div>
                            <span className="font-medium text-primary">{m.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-400">{m.studentId}</td>
                        <td className="py-3 text-gray-400">{m.batchYear}</td>
                        <td className="py-3"><StatusBadge status={m.status} /></td>
                        <td className="py-3 text-gray-400 text-xs">
                          {m.joinedDate ? formatDate(m.joinedDate) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Finance overview */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" /> {t("advisor.financeSummary")}
              </h2>
              <div className="space-y-2">
                {mockBudgets.map((b) => {
                  const spent = mockExpenditures.filter((ex) => ex.budgetId === b.id).reduce((s, ex) => s + ex.amountBdt, 0);
                  return (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                      <div>
                        <p className="font-medium text-primary">
                          {b.eventId ? t("advisor.eventBudget") : t("advisor.generalBudget")}
                        </p>
                        <p className="text-xs text-gray-400">{t("advisor.spent")}: {formatCurrency(spent)} / {formatCurrency(b.totalAmountBdt)}</p>
                      </div>
                      <StatusBadge status={b.status.toUpperCase()} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Election status */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <Vote className="w-5 h-5 text-purple-500" /> {t("advisor.currentElection")}
              </h2>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div>
                  <p className="font-semibold text-primary">{t("advisor.electionLabel")}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {t("advisor.phase1")}: {formatDate(mockElection.phase1Start)} – {formatDate(mockElection.phase1End)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t("advisor.phase2")}: {mockElection.phase2Start ? `${formatDate(mockElection.phase2Start)} – ${formatDate(mockElection.phase2End!)}` : t("advisor.pending")}
                  </p>
                </div>
                <StatusBadge status={mockElection.status} />
              </div>
            </div>

            {/* Recent notices */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" /> {t("advisor.recentNotices")}
              </h2>
              <div className="space-y-3">
                {mockNotices.slice(0, 4).map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg flex-shrink-0">
                      {n.noticeType === "Election" ? "🗳" : n.noticeType === "Policy" ? "📜" : "📢"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary text-sm">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-xs text-gray-300 mt-1">{t("advisor.by")} {n.authorRole} · {formatDate(n.publishedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
