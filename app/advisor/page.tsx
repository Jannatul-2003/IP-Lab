"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Eye, Users, DollarSign, Vote, FileText } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { useAuthContext, useLang } from "@/app/providers";
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

  const [members, setMembers] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "FACULTY_ADVISOR") { router.push("/dashboard"); return; }
    Promise.all([
      fetch("/api/members/list?limit=100").then((r) => r.json()),
      fetch("/api/finance/budgets").then((r) => r.json()),
      fetch("/api/finance/expenditures").then((r) => r.json()),
      fetch("/api/elections").then((r) => r.json()),
      fetch("/api/notices?limit=5").then((r) => r.json()),
    ])
      .then(([membersData, budgetsData, expendituresData, electionsData, noticesData]) => {
        setMembers(membersData.data || []);
        setBudgets(budgetsData.data || []);
        setExpenditures(expendituresData.data || []);
        const elList = electionsData.data || [];
        setElection(elList.find((e: any) => e.status !== "COMPLETED") || elList[0] || null);
        setNotices(noticesData.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user || user.role !== "FACULTY_ADVISOR") return null;

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const pendingMembers = members.filter((m) => m.status === "PENDING");
  const totalBudget = budgets.filter((b) => b.status === "approved").reduce((s, b) => s + b.total_amount_bdt, 0);
  const totalSpent = expenditures.reduce((s, e) => s + e.amount_bdt, 0);

  const stats = [
    { label: t("advisor.activeMembers"), value: String(activeMembers.length), icon: "👥", color: "text-blue-600" },
    { label: t("advisor.pendingApps"), value: String(pendingMembers.length), icon: "⏳", color: "text-orange-500" },
    { label: t("advisor.approvedBudget"), value: formatCurrency(totalBudget), icon: "💰", color: "text-green-600" },
    { label: t("advisor.totalSpent"), value: formatCurrency(totalSpent), icon: "📤", color: "text-red-500" },
  ];

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div>
              <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                <Eye className="w-7 h-7 text-amber-500" />
                {t("advisor.title")}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{t("advisor.subtitle")}</p>
            </div>

            <ReadOnlyBanner label={t("advisor.readOnlyBanner")} />

            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="card text-center">
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Election status */}
                {election && (
                  <div className="card">
                    <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                      <Vote className="w-5 h-5 text-purple-500" /> {t("advisor.electionStatus")}
                    </h2>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">{t("elections.ecElection")} · Term {election.term?.term_number ?? "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(election.phase1_start)} – {formatDate(election.phase1_end)}</p>
                      </div>
                      <StatusBadge status={election.status} />
                    </div>
                  </div>
                )}

                {/* Recent Members */}
                <div className="card">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> {t("advisor.recentMembers")}
                  </h2>
                  <div className="space-y-2">
                    {members.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">{getInitials(m.full_name)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary">{m.full_name}</p>
                          <p className="text-xs text-gray-400">{m.student_id} · Batch {m.batch_year}</p>
                        </div>
                        <StatusBadge status={m.status} />
                      </div>
                    ))}
                    {members.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No members yet.</p>}
                  </div>
                </div>

                {/* Finance summary */}
                <div className="card">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" /> {t("advisor.financeSummary")}
                  </h2>
                  <div className="space-y-2">
                    {budgets.map((b) => {
                      const spent = expenditures.filter((ex) => ex.budget_id === b.id).reduce((s, ex) => s + ex.amount_bdt, 0);
                      const pct = b.total_amount_bdt > 0 ? Math.min(100, Math.round((spent / b.total_amount_bdt) * 100)) : 0;
                      return (
                        <div key={b.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-primary">{formatCurrency(b.total_amount_bdt)}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.status === "approved" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{b.status}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pct}% utilised</p>
                        </div>
                      );
                    })}
                    {budgets.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No budgets yet.</p>}
                  </div>
                </div>

                {/* Notices */}
                <div className="card">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" /> {t("advisor.recentNotices")}
                  </h2>
                  <div className="space-y-2">
                    {notices.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl border border-slate-100">
                        <p className="text-sm font-medium text-primary">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.published_at)} · {n.notice_type}</p>
                      </div>
                    ))}
                    {notices.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No notices yet.</p>}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
