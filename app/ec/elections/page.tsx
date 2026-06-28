"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Vote, Play, Square, Trophy, BarChart3, AlertTriangle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { ElectionStatus } from "@/types";

export default function EcElectionsPage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const [election, setElection] = useState<any>(null);
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [selectedPos, setSelectedPos] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) { router.push("/dashboard"); return; }
    fetch("/api/elections")
      .then((r) => r.json())
      .then(async (data) => {
        const list = data.data || [];
        const active = list.find((e: any) => e.status !== "COMPLETED") || list[0] || null;
        setElection(active);
        if (active) {
          const res = await fetch(`/api/elections/${active.id}/results`);
          const resData = await res.json();
          const byPos = resData.results || {};
          setResults(byPos);
          setSelectedPos(Object.keys(byPos)[0] || "");
        }
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false));
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const canControl = can("PRESIDENT") || can("SECRETARY");
  const status: ElectionStatus = election?.status || "DRAFT";

  type TransitionDef = { label: string; color: string; icon: React.ReactNode; variant: "danger" | "info" };
  const TRANSITIONS: Partial<Record<ElectionStatus, TransitionDef>> = {
    DRAFT: { label: t("ecPanel.elections.transitions.openPhase1"), color: "bg-purple-50 border-purple-100", icon: <Play className="w-4 h-4" />, variant: "info" },
    PHASE1_OPEN: { label: t("ecPanel.elections.transitions.closePhase1"), color: "bg-orange-50 border-orange-100", icon: <Square className="w-4 h-4" />, variant: "danger" },
    SHORTLISTING: { label: t("ecPanel.elections.transitions.openPhase2"), color: "bg-indigo-50 border-indigo-100", icon: <Play className="w-4 h-4" />, variant: "info" },
    PHASE2_OPEN: { label: t("ecPanel.elections.transitions.closePhase2"), color: "bg-red-50 border-red-100", icon: <Trophy className="w-4 h-4" />, variant: "danger" },
  };

  const steps: { label: string; key: ElectionStatus }[] = [
    { label: t("ecPanel.elections.steps.registration"), key: "DRAFT" },
    { label: t("ecPanel.elections.steps.phase1"), key: "PHASE1_OPEN" },
    { label: t("ecPanel.elections.steps.shortlisting"), key: "SHORTLISTING" },
    { label: t("ecPanel.elections.steps.phase2"), key: "PHASE2_OPEN" },
    { label: t("ecPanel.elections.steps.completed"), key: "COMPLETED" },
  ];

  const transition = TRANSITIONS[status];
  const currentStepIdx = steps.findIndex((s) => s.key === status);

  async function executeTransition() {
    if (!transition || !election) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/elections/${election.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to advance election"); return; }
      setElection(data);
      toast.success(`Election advanced to ${data.status.replace(/_/g, " ")}`);
    } catch {
      toast.error("Failed to advance election");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  const positionKeys = Object.keys(results);

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">
                {t("ecPanel.backToPanel")}
              </button>
              <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                <Vote className="w-7 h-7 text-purple-500" />
                {t("ecPanel.elections.title")}
              </h1>
              {!canControl && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {t("ecPanel.elections.noControl")}
                </p>
              )}
            </div>

            {fetchLoading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : !election ? (
              <div className="card text-center py-12 text-gray-400">No election found. Create one to get started.</div>
            ) : (
              <>
                <div className="card mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-heading text-xl font-bold text-primary">{t("ecPanel.elections.ecElectionLabel")} · Term {election.term?.term_number ?? "—"}</h2>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {t("ecPanel.elections.phase1Dates")} {formatDate(election.phase1_start)} – {formatDate(election.phase1_end)}
                      </p>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  <div className="flex gap-0">
                    {steps.map((step, i) => {
                      const done = i < currentStepIdx;
                      const active = i === currentStepIdx;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                            done ? "bg-green-500 border-green-500 text-white" :
                            active ? "bg-accent border-accent text-white ring-4 ring-accent/20" :
                            "bg-white border-slate-200 text-gray-400"
                          )}>
                            {done ? "✓" : i + 1}
                          </div>
                          <p className={cn("text-xs mt-1.5 text-center font-medium", active ? "text-accent" : done ? "text-green-600" : "text-gray-400")}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canControl && transition && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`card border mb-6 ${transition.color}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary">{t("ecPanel.elections.nextAction")}</p>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {t("ecPanel.elections.current")} <span className="font-medium text-primary">{status.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <Button variant={transition.variant === "danger" ? "danger" : "primary"} leftIcon={transition.icon} onClick={() => setConfirmOpen(true)}>
                        {transition.label}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {status === "COMPLETED" && (
                  <div className="card mb-6 bg-green-50 border border-green-100">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-green-500" />
                      <p className="font-semibold text-green-700">{t("ecPanel.elections.completed")}</p>
                    </div>
                  </div>
                )}

                {positionKeys.length > 0 && (
                  <div className="card">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        {t("ecPanel.elections.liveResults")}
                      </h2>
                      <div className="flex gap-1.5 flex-wrap">
                        {positionKeys.map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setSelectedPos(pos)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
                              selectedPos === pos ? "bg-accent text-white" : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                            )}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(results[selectedPos] || [])
                        .sort((a: any, b: any) => b.phase1_votes - a.phase1_votes)
                        .map((c: any, i: number) => {
                          const max = results[selectedPos][0]?.phase1_votes || 1;
                          const pct = Math.round((c.phase1_votes / max) * 100);
                          return (
                            <div key={c.id} className={cn("p-3 rounded-xl border", c.shortlisted ? "border-green-100 bg-green-50/50" : "border-slate-100 bg-slate-50/50")}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-gray-400"
                                  )}>{i + 1}</span>
                                  <p className="font-medium text-primary text-sm">{c.member?.full_name}</p>
                                  <span className="text-xs text-gray-400">{c.member?.student_id}</span>
                                  {c.shortlisted && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{t("ecPanel.elections.shortlisted")}</span>}
                                  {c.winner && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Winner</span>}
                                </div>
                                <p className="font-bold text-primary text-sm">{c.phase1_votes} {t("ecPanel.elections.votes")}</p>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-1.5">
                                <div className={cn("h-1.5 rounded-full transition-all duration-500", c.shortlisted ? "bg-green-500" : "bg-slate-400")} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={executeTransition}
        onCancel={() => setConfirmOpen(false)}
        title={`${t("common.confirm")}: ${transition?.label}`}
        message={`${t("common.thisActionIrreversible")}`}
        confirmLabel={t("common.confirm")}
        variant={transition?.variant ?? "info"}
        isLoading={loading}
      />
    </PageLayout>
  );
}
