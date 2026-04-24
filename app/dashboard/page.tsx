"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Calendar, Bell, Vote, User, ArrowRight, CheckCircle } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useAuthContext, useLang } from "@/app/providers";
import { mockEvents, mockNotices, mockElection } from "@/lib/mockData";
import { formatDate, timeAgo } from "@/lib/utils";

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold font-heading text-primary">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();

  if (!user) {
    router.push("/login");
    return null;
  }

  const rsvpEvents = mockEvents.filter((e) => e.userRsvp);
  const recentNotices = mockNotices.slice(0, 3);
  const hasActiveElection = mockElection.status === "PHASE1_OPEN" || mockElection.status === "PHASE2_OPEN";

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-hero rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255,255,255,0.3) 2px, transparent 0)`, backgroundSize: "40px 40px" }} />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/60 text-sm">{t("dashboard.welcome")},</p>
                  <h1 className="font-heading text-2xl font-bold mt-0.5">{user.email.split("@")[0]}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <RoleBadge role={user.role} className="bg-white/20 text-white border-white/20" />
                    {user.ecRole && <span className="text-xs text-white/60">· {user.ecRole}</span>}
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold font-heading flex-shrink-0">
                  {user.email[0].toUpperCase()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<User className="w-5 h-5 text-blue-500" />} label={t("dashboard.status")} value="Active" color="bg-blue-50" />
            <StatCard icon={<Calendar className="w-5 h-5 text-green-500" />} label="RSVPed Events" value={`${rsvpEvents.length}`} color="bg-green-50" />
            <StatCard icon={<Bell className="w-5 h-5 text-orange-500" />} label="New Notices" value={`${recentNotices.length}`} color="bg-orange-50" />
            <StatCard icon={<Vote className="w-5 h-5 text-purple-500" />} label="Active Election" value={hasActiveElection ? "Yes" : "No"} color="bg-purple-50" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Election Banner */}
            {hasActiveElection && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Vote className="w-8 h-8 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{t("dashboard.activeElection")}</p>
                      <p className="text-white/70 text-sm">EC Election 2026 — Phase 1 is open. Cast your vote!</p>
                    </div>
                  </div>
                  <Link href="/elections">
                    <Button className="bg-white text-purple-700 hover:bg-white/90 flex-shrink-0" size="sm">
                      Vote Now
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* RSVPed Events */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-xl font-semibold text-primary">{t("dashboard.upcomingEvents")}</h2>
                  <Link href="/events" className="text-xs text-accent hover:underline">View all</Link>
                </div>
                {rsvpEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-gray-400 text-sm mb-4">{t("dashboard.noRsvps")}</p>
                    <Link href="/events">
                      <Button size="sm">{t("dashboard.browseEvents")}</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rsvpEvents.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="group block">
                        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-xl flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-primary text-sm truncate group-hover:text-accent transition-colors">{event.title}</p>
                            <p className="text-xs text-gray-400">{formatDate(event.eventDate)}</p>
                          </div>
                          <StatusBadge status={event.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Notices */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="card">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-heading text-xl font-semibold text-primary">{t("dashboard.recentNotices")}</h2>
                  <Link href="/notices" className="text-xs text-accent hover:underline">All</Link>
                </div>
                <div className="space-y-4">
                  {recentNotices.map((notice) => (
                    <Link key={notice.id} href="/notices" className="group block">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm flex-shrink-0">
                          {notice.noticeType === "Election" ? "🗳" : notice.noticeType === "Policy" ? "📜" : "📢"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">{notice.title}</p>
                          <p className="text-xs text-gray-400">{timeAgo(notice.publishedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* EC Panel shortcut */}
          {can("EC_OFFICER") && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
              <Link href="/ec" className="group block">
                <div className="card flex items-center justify-between hover:border-accent/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">EC Management Panel</p>
                      <p className="text-xs text-gray-400">Manage members, elections, finance, and media.</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-accent transition-colors" />
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
