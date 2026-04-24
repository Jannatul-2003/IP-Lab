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
import { useAuthContext } from "@/app/providers";
import { mockElection } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { ElectionStatus } from "@/types";

const MOCK_RESULTS: Record<string, { id: string; name: string; studentId: string; phase1Votes: number; shortlisted: boolean }[]> = {
  President: [
    { id: "c1", name: "Ahmed Hossain", studentId: "20-44001", phase1Votes: 47, shortlisted: true },
    { id: "c2", name: "Nusrat Jahan", studentId: "20-44023", phase1Votes: 38, shortlisted: true },
    { id: "c3", name: "Rafiqul Islam", studentId: "20-44056", phase1Votes: 29, shortlisted: true },
    { id: "c4", name: "Sadia Hoque", studentId: "20-44072", phase1Votes: 14, shortlisted: false },
  ],
  "General Secretary": [
    { id: "c5", name: "Tasneem Akter", studentId: "21-46001", phase1Votes: 52, shortlisted: true },
    { id: "c6", name: "Shahriar Ahmed", studentId: "21-46022", phase1Votes: 41, shortlisted: true },
    { id: "c7", name: "Mitu Rahman", studentId: "21-46045", phase1Votes: 33, shortlisted: true },
  ],
  Treasurer: [
    { id: "c8", name: "Mahfuz Alam", studentId: "21-46080", phase1Votes: 44, shortlisted: true },
    { id: "c9", name: "Sumaiya Islam", studentId: "21-46091", phase1Votes: 37, shortlisted: true },
    { id: "c10", name: "Raihan Kabir", studentId: "21-46110", phase1Votes: 26, shortlisted: true },
  ],
};

const TRANSITIONS: Partial<Record<ElectionStatus, { label: string; next: ElectionStatus; color: string; icon: React.ReactNode; variant: "danger" | "info" }>> = {
  DRAFT: { label: "Open Phase 1 Voting", next: "PHASE1_OPEN", color: "bg-purple-50 border-purple-100", icon: <Play className="w-4 h-4" />, variant: "info" },
  PHASE1_OPEN: { label: "Close Phase 1 & Shortlist", next: "SHORTLISTING", color: "bg-orange-50 border-orange-100", icon: <Square className="w-4 h-4" />, variant: "danger" },
  SHORTLISTING: { label: "Open Phase 2 Voting", next: "PHASE2_OPEN", color: "bg-indigo-50 border-indigo-100", icon: <Play className="w-4 h-4" />, variant: "info" },
  PHASE2_OPEN: { label: "Close Phase 2 & Finalize", next: "COMPLETED", color: "bg-red-50 border-red-100", icon: <Trophy className="w-4 h-4" />, variant: "danger" },
};

export default function EcElectionsPage() {
  const { user, can } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<ElectionStatus>(mockElection.status);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPos, setSelectedPos] = useState(Object.keys(MOCK_RESULTS)[0]);

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) router.push("/dashboard");
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const canControl = can("PRESIDENT") || can("SECRETARY");
  const transition = TRANSITIONS[status];

  const steps: { label: string; key: ElectionStatus }[] = [
    { label: "Registration", key: "DRAFT" },
    { label: "Phase 1", key: "PHASE1_OPEN" },
    { label: "Shortlisting", key: "SHORTLISTING" },
    { label: "Phase 2", key: "PHASE2_OPEN" },
    { label: "Completed", key: "COMPLETED" },
  ];
  const currentStepIdx = steps.findIndex((s) => s.key === status);

  async function executeTransition() {
    if (!transition) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setStatus(transition.next);
    setLoading(false);
    setConfirmOpen(false);
    toast.success(`Election phase updated to: ${transition.next.replace("_", " ")}`);
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">
                ← EC Panel
              </button>
              <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                <Vote className="w-7 h-7 text-purple-500" />
                Election Control
              </h1>
              {!canControl && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Phase controls require PRESIDENT or SECRETARY role.
                </p>
              )}
            </div>

            <div className="card mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-xl font-bold text-primary">EC Election 2026 — Term 8</h2>
                  <p className="text-gray-400 text-sm mt-0.5">
                    Phase 1: {formatDate(mockElection.phase1Start)} – {formatDate(mockElection.phase1End)}
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
              <div className="flex mt-1">
                {steps.slice(0, -1).map((_, i) => (
                  <div key={i} className={cn("flex-1 h-0.5 mt-[-20px] mx-4", i < currentStepIdx ? "bg-green-400" : "bg-slate-100")} />
                ))}
              </div>
            </div>

            {canControl && transition && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card border mb-6 ${transition.color}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-primary">Next Action</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Current: <span className="font-medium text-primary">{status.replace("_", " ")}</span>
                      {" → "}Next: <span className="font-medium text-accent">{transition.next.replace("_", " ")}</span>
                    </p>
                  </div>
                  <Button
                    variant={transition.variant === "danger" ? "danger" : "primary"}
                    leftIcon={transition.icon}
                    onClick={() => setConfirmOpen(true)}
                  >
                    {transition.label}
                  </Button>
                </div>
              </motion.div>
            )}

            {status === "COMPLETED" && (
              <div className="card mb-6 bg-green-50 border border-green-100">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-green-500" />
                  <p className="font-semibold text-green-700">Election Completed — Results Published</p>
                </div>
              </div>
            )}

            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Live Results — Phase 1
                </h2>
                <div className="flex gap-1.5">
                  {Object.keys(MOCK_RESULTS).map((pos) => (
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
                {MOCK_RESULTS[selectedPos]
                  .sort((a, b) => b.phase1Votes - a.phase1Votes)
                  .map((c, i) => {
                    const max = MOCK_RESULTS[selectedPos][0].phase1Votes;
                    const pct = Math.round((c.phase1Votes / max) * 100);
                    return (
                      <div key={c.id} className={cn("p-3 rounded-xl border", c.shortlisted ? "border-green-100 bg-green-50/50" : "border-slate-100 bg-slate-50/50")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              i === 0 ? "bg-yellow-400 text-white" :
                              i === 1 ? "bg-slate-300 text-white" :
                              i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-gray-400"
                            )}>
                              {i + 1}
                            </span>
                            <p className="font-medium text-primary text-sm">{c.name}</p>
                            <span className="text-xs text-gray-400">{c.studentId}</span>
                            {c.shortlisted && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Shortlisted</span>}
                          </div>
                          <p className="font-bold text-primary text-sm">{c.phase1Votes} votes</p>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className={cn("h-1.5 rounded-full transition-all duration-500", c.shortlisted ? "bg-green-500" : "bg-slate-400")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={executeTransition}
        onCancel={() => setConfirmOpen(false)}
        title={`Confirm: ${transition?.label}`}
        message={`This will transition the election from "${status.replace("_", " ")}" to "${transition?.next.replace("_", " ")}". This action cannot be undone.`}
        confirmLabel="Confirm"
        variant={transition?.variant ?? "info"}
        isLoading={loading}
      />
    </PageLayout>
  );
}
