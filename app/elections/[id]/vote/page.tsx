"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Vote, Check, ArrowLeft, Lock } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { mockElection } from "@/lib/mockData";
import { getInitials, cn } from "@/lib/utils";

const MOCK_CANDIDATES: Record<string, { id: string; name: string; studentId: string; phase1Votes: number }[]> = {
  "President": [
    { id: "c1", name: "Ahmed Hossain", studentId: "20-44001", phase1Votes: 47 },
    { id: "c2", name: "Nusrat Jahan", studentId: "20-44023", phase1Votes: 38 },
    { id: "c3", name: "Rafiqul Islam", studentId: "20-44056", phase1Votes: 29 },
  ],
  "General Secretary": [
    { id: "c4", name: "Tasneem Akter", studentId: "21-46001", phase1Votes: 52 },
    { id: "c5", name: "Shahriar Ahmed", studentId: "21-46022", phase1Votes: 41 },
    { id: "c6", name: "Mitu Rahman", studentId: "21-46045", phase1Votes: 33 },
  ],
  "Treasurer": [
    { id: "c7", name: "Mahfuz Alam", studentId: "21-46080", phase1Votes: 44 },
    { id: "c8", name: "Sumaiya Islam", studentId: "21-46091", phase1Votes: 37 },
    { id: "c9", name: "Raihan Kabir", studentId: "21-46110", phase1Votes: 26 },
  ],
};

const POSITIONS = Object.keys(MOCK_CANDIDATES);

export default function VotingPage() {
  useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useLang();
  const toast = useToast();

  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPos, setCurrentPos] = useState(0);

  if (!user) { router.push("/login"); return null; }

  const position = POSITIONS[currentPos];
  const candidates = MOCK_CANDIDATES[position];
  const allVoted = POSITIONS.every((p) => votes[p]);

  function selectCandidate(candidateId: string) {
    setVotes((prev) => ({ ...prev, [position]: candidateId }));
  }

  async function submitVotes() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setConfirmOpen(false);
    setSubmitted(true);
    toast.success("Your votes have been recorded. Voter identity anonymized.");
  }

  if (submitted) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center pt-20 bg-slate-50">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card max-w-md w-full mx-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-primary mb-3">Votes Cast!</h2>
            <p className="text-gray-400 text-sm mb-2">Your votes have been recorded anonymously.</p>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-300 mb-6">
              <Lock className="w-3 h-3" /> Voter identity anonymized per constitutional mandate
            </div>
            <Button onClick={() => router.push("/elections")} className="w-full">Back to Elections</Button>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {/* Header */}
          <div className="card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Vote className="w-6 h-6 text-purple-500" />
              <div>
                <h1 className="font-heading text-xl font-bold text-primary">
                  {mockElection.status === "PHASE1_OPEN" ? t("elections.phase1") : t("elections.phase2")}
                </h1>
                <p className="text-xs text-gray-400">EC Election 2026 — Term 8</p>
              </div>
            </div>
            {/* Progress */}
            <div className="flex gap-1.5">
              {POSITIONS.map((p, i) => (
                <div
                  key={p}
                  onClick={() => setCurrentPos(i)}
                  className={cn(
                    "flex-1 h-2 rounded-full cursor-pointer transition-all",
                    i === currentPos ? "bg-accent" :
                    votes[p] ? "bg-green-400" : "bg-slate-100"
                  )}
                  title={p}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Position {currentPos + 1} of {POSITIONS.length}: <strong>{position}</strong>
            </p>
          </div>

          {/* Candidates */}
          <motion.div key={position} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 mb-6">
            {candidates.map((c) => {
              const isSelected = votes[position] === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectCandidate(c.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                    isSelected
                      ? "border-accent bg-accent/5 shadow-glow-sm"
                      : "border-slate-100 bg-white hover:border-accent/40"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      isSelected ? "bg-accent text-white" : "bg-surface text-primary"
                    )}>
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.studentId}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "border-accent bg-accent" : "border-slate-300"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setCurrentPos((p) => Math.max(0, p - 1))}
              disabled={currentPos === 0}
              className="flex-1"
            >
              {t("common.previous")}
            </Button>
            {currentPos < POSITIONS.length - 1 ? (
              <Button
                onClick={() => setCurrentPos((p) => p + 1)}
                disabled={!votes[position]}
                className="flex-1"
              >
                {t("common.next")}
              </Button>
            ) : (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!allVoted}
                className="flex-1"
              >
                Submit All Votes
              </Button>
            )}
          </div>

          {!allVoted && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Vote for all {POSITIONS.length} positions to submit.
            </p>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={submitVotes}
        onCancel={() => setConfirmOpen(false)}
        title="Submit Your Votes?"
        message="Once submitted, your votes cannot be changed. Your voter identity will be anonymized per constitutional requirements."
        confirmLabel="Yes, Submit"
        variant="info"
        isLoading={loading}
      />
    </PageLayout>
  );
}
