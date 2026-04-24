"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Vote, DollarSign, Image, ArrowRight, Activity } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAuthContext, useLang } from "@/app/providers";
import { mockStats, mockMembers } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";

const modules = [
  {
    href: "/ec/members",
    icon: <Users className="w-6 h-6" />,
    title: "Member Management",
    desc: "Review applications, manage status, view all members.",
    color: "bg-blue-50 text-blue-600",
    stat: `${mockMembers.filter((m) => m.status === "PENDING").length} pending`,
  },
  {
    href: "/ec/elections",
    icon: <Vote className="w-6 h-6" />,
    title: "Election Control",
    desc: "Manage election lifecycle and view live results.",
    color: "bg-purple-50 text-purple-600",
    stat: "Phase 1 Open",
  },
  {
    href: "/ec/finance",
    icon: <DollarSign className="w-6 h-6" />,
    title: "Finance",
    desc: "Budgets, expenditures, and financial reports.",
    color: "bg-green-50 text-green-600",
    stat: "3 budgets",
  },
  {
    href: "/ec/media",
    icon: <Image className="w-6 h-6" />,
    title: "Media & Gallery",
    desc: "Upload event photos and newsletters.",
    color: "bg-orange-50 text-orange-600",
    stat: "6 items",
  },
];

export default function EcPanelPage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();

  if (!user || !isEcOfficer(user.role)) {
    router.push("/dashboard");
    return null;
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-primary">{t("nav.ecPanel")}</h1>
              <p className="text-gray-400 mt-1">CSEDU Students&apos; Club — Term 8 Management</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Members", value: String(mockStats.totalMembers), icon: "👥" },
                { label: "Active Events", value: String(mockStats.activeEvents), icon: "🎪" },
                { label: "Current Term", value: `Term ${mockStats.currentTerm}`, icon: "📅" },
                { label: "Pending Apps", value: `${mockMembers.filter((m) => m.status === "PENDING").length}`, icon: "⏳" },
              ].map((s, i) => (
                <div key={i} className="card text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="font-heading text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Modules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {modules.map((mod, i) => {
                if (mod.href === "/ec/elections" && !can("PRESIDENT") && !can("SECRETARY")) return null;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Link href={mod.href} className="group block">
                      <div className="card hover:border-accent/30 group-hover:shadow-card-hover transition-all">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mod.color}`}>
                            {mod.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-heading text-lg font-semibold text-primary group-hover:text-accent transition-colors">
                                {mod.title}
                              </h3>
                              <span className="badge bg-surface text-primary text-xs">{mod.stat}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">{mod.desc}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Recent activity placeholder */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-gray-400" />
                <h2 className="font-heading text-lg font-semibold text-primary">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {[
                  { action: "Member application approved", actor: "EC Officer", time: "2 hours ago", icon: "✅" },
                  { action: "EC Election Phase 1 opened", actor: "Secretary", time: "1 day ago", icon: "🗳" },
                  { action: "Budget approved for Annual Contest", actor: "President", time: "2 days ago", icon: "💰" },
                  { action: "3 new member applications received", actor: "System", time: "3 days ago", icon: "📋" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary font-medium">{item.action}</p>
                      <p className="text-xs text-gray-400">by {item.actor}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
