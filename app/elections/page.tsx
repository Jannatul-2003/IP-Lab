"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Vote } from "lucide-react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useAuthContext, useLang } from "@/app/providers";
import { formatDate, cn } from "@/lib/utils";

const EC_POSITIONS_KEYS = [
  "about.ecRoles.president",
  "about.ecRoles.generalSecretary",
  "about.ecRoles.treasurer",
  "about.ecRoles.culturalSecretary",
  "about.ecRoles.sportsSecretary",
  "about.ecRoles.publicationSecretary",
  "about.ecRoles.itSecretary",
  "about.ecRoles.socialServiceSecretary",
  "about.ecRoles.officeSecretary",
  "about.ecRoles.executiveMember",
  "about.ecRoles.executiveMember",
];

export default function ElectionsPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();

  const [election, setElection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetch("/api/elections")
      .then((r) => r.json())
      .then((data) => {
        const list = data.data || [];
        // Show the most recent non-COMPLETED election, or the latest one
        const active = list.find((e: any) => e.status !== "COMPLETED") || list[0] || null;
        setElection(active);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const isPhase1Open = election?.status === "PHASE1_OPEN";
  const isPhase2Open = election?.status === "PHASE2_OPEN";
  const isActive = isPhase1Open || isPhase2Open;

  const steps = election
    ? [
        { label: t("elections.registrationStep"), desc: t("elections.registrationDesc"), done: true, active: false },
        { label: t("elections.phase1Step"), desc: `${formatDate(election.phase1_start)} – ${formatDate(election.phase1_end)}`, done: false, active: isPhase1Open },
        { label: t("elections.shortlistingStep"), desc: `Top ${election.shortlist_n} per position auto-shortlisted`, done: false, active: election.status === "SHORTLISTING" },
        { label: t("elections.phase2Step"), desc: election.phase2_start ? `${formatDate(election.phase2_start)} – ${formatDate(election.phase2_end)}` : t("elections.shortlistingStep"), done: false, active: isPhase2Open },
        { label: t("elections.resultsStep"), desc: t("elections.resultsDesc"), done: election.status === "COMPLETED", active: false },
      ]
    : [];

  const rules = [
    t("elections.rule1"), t("elections.rule2"), t("elections.rule3"),
    t("elections.rule4"), t("elections.rule5"), t("elections.rule6"),
  ];

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title={t("elections.title")} subtitle={t("elections.subtitle")} />
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("elections.title")} subtitle={t("elections.subtitle")} />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {!election ? (
            <div className="card text-center py-12 text-gray-400">No active election found.</div>
          ) : (
            <>
              {/* Status card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-primary">{t("elections.ecElection")}</h2>
                    <p className="text-gray-400 text-sm mt-1">{t("elections.termLabel")} {election.term?.term_number ?? "—"}</p>
                  </div>
                  <StatusBadge status={election.status} />
                </div>

                <div className="space-y-0">
                  {steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                          step.done ? "bg-green-500 text-white" :
                          step.active ? "bg-accent text-white ring-4 ring-accent/20" :
                          "bg-slate-100 text-gray-400"
                        )}>
                          {step.done ? "✓" : i + 1}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={cn("w-0.5 h-10 my-1", step.done || step.active ? "bg-accent/30" : "bg-slate-100")} />
                        )}
                      </div>
                      <div className="pb-8">
                        <p className={cn("font-semibold text-sm", step.active ? "text-accent" : step.done ? "text-green-600" : "text-gray-400")}>
                          {step.label} {step.active && t("elections.current")}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {isActive && (
                  <div className={cn(
                    "flex items-center gap-3 p-4 rounded-xl",
                    isPhase1Open ? "bg-purple-50 border border-purple-100" : "bg-indigo-50 border border-indigo-100"
                  )}>
                    <Vote className={cn("w-8 h-8 flex-shrink-0", isPhase1Open ? "text-purple-500" : "text-indigo-500")} />
                    <div className="flex-1">
                      <p className="font-semibold text-primary text-sm">
                        {isPhase1Open ? t("elections.phase1") : t("elections.phase2")} {t("elections.isOpen")}
                      </p>
                      <p className="text-xs text-gray-400">{t("elections.voteCta")}</p>
                    </div>
                    <Link href={`/elections/${election.id}/vote`}>
                      <Button size="sm">{t("elections.vote")}</Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </>
          )}

          {/* Positions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <h2 className="font-heading text-xl font-semibold text-primary mb-5">{t("elections.positions")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EC_POSITIONS_KEYS.map((key, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">{i + 1}</div>
                  <p className="font-medium text-primary text-sm">{t(key)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rules */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
            <h2 className="font-heading text-xl font-semibold text-primary mb-4">{t("elections.rulesTitle")}</h2>
            <ul className="space-y-3 text-sm text-gray-500">
              {rules.map((rule, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent font-bold flex-shrink-0">›</span>
                  {rule}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
