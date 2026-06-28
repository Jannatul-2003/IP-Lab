"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Vote, Check, ChevronLeft } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { getInitials, cn } from "@/lib/utils";

export default function VotingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();
  const { t } = useLang();
  const toast = useToast();

  const [candidates, setCandidates] = useState<Record<string, any[]>>({});
  const [positions, setPositions] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [currentPos, setCurrentPos] = useState(0);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch(`/api/elections/${id}/candidates`)
      .then((r) => r.json())
      .then((data) => {
        const list: any[] = data.data || [];
        const byPosition: Record<string, any[]> = {};
        for (const c of list) {
          if (!byPosition[c.position]) byPosition[c.position] = [];
          byPosition[c.position].push(c);
        }
        setCandidates(byPosition);
        setPositions(Object.keys(byPosition));
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false));
  }, [id, user, router]);

  if (!user) return null;

  const position = positions[currentPos];
  const positionCandidates = candidates[position] || [];
  const allVoted = positions.length > 0 && positions.every((p) => votes[p]);

  function selectCandidate(candidateId: string) {
    setVotes((prev) => ({ ...prev, [position]: candidateId }));
  }

  async function submitVotes() {
    setLoading(true);
    try {
      const votePayload = positions.map((p) => ({ candidateId: votes[p], position: p }));
      const res = await fetch(`/api/elections/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votes: votePayload }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to submit votes"); return; }
      setSubmitted(true);
      toast.success("Your votes have been recorded!");
    } catch {
      toast.error("Failed to submit votes. Please try again.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  if (fetchLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <section className="py-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-3">{t("elections.voteSubmitted")}</h1>
            <p className="text-gray-500 mb-8">{t("elections.voteThankYou")}</p>
            <Button onClick={() => router.push("/elections")}>{t("elections.backToElections")}</Button>
          </div>
        </section>
      </PageLayout>
    );
  }

  if (positions.length === 0) {
    return (
      <PageLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center text-gray-400">
          No candidates registered yet.
          <div className="mt-6"><Button onClick={() => router.push("/elections")}>Back to Elections</Button></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <button onClick={() => router.push("/elections")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-primary mb-6">
            <ChevronLeft className="w-4 h-4" /> {t("elections.backToElections")}
          </button>

          <div className="flex items-center gap-3 mb-8">
            <Vote className="w-7 h-7 text-accent" />
            <h1 className="font-heading text-2xl font-bold text-primary">{t("elections.castYourVote")}</h1>
          </div>

          {/* Position tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {positions.map((pos, i) => (
              <button
                key={pos}
                onClick={() => setCurrentPos(i)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                  currentPos === i ? "bg-accent text-white" : "bg-slate-100 text-gray-500 hover:bg-slate-200"
                )}
              >
                {votes[pos] && <Check className="w-3 h-3" />}
                {pos}
              </button>
            ))}
          </div>

          <motion.div key={position} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card mb-6">
            <h2 className="font-heading text-lg font-semibold text-primary mb-4">{position}</h2>
            <div className="space-y-3">
              {positionCandidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCandidate(c.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                    votes[position] === c.id
                      ? "border-accent bg-accent/5"
                      : "border-slate-100 hover:border-accent/40 hover:bg-slate-50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {getInitials(c.member?.full_name || "?")}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-primary">{c.member?.full_name}</p>
                    <p className="text-xs text-gray-400">{c.member?.student_id}</p>
                  </div>
                  {votes[position] === c.id && (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentPos((p) => Math.max(0, p - 1))} disabled={currentPos === 0}>
              Previous
            </Button>
            {currentPos < positions.length - 1 ? (
              <Button onClick={() => setCurrentPos((p) => p + 1)} disabled={!votes[position]}>
                Next Position
              </Button>
            ) : (
              <Button onClick={() => setConfirmOpen(true)} disabled={!allVoted}>
                {t("elections.submitVotes")}
              </Button>
            )}
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={submitVotes}
        onCancel={() => setConfirmOpen(false)}
        title={t("elections.confirmVote")}
        message={t("elections.confirmVoteMessage")}
        confirmLabel={t("elections.submitVotes")}
        variant="info"
        isLoading={loading}
      />
    </PageLayout>
  );
}
