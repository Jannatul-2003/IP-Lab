"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Calendar, Bell, Vote, User, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useAuthContext, useLang } from "@/app/providers";
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

  const [events, setEvents] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [election, setElection] = useState<any>(null);
  const [memberProfile, setMemberProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      fetch("/api/events?status=PUBLISHED&limit=5").then((r) => r.json()),
      fetch("/api/notices?limit=3").then((r) => r.json()),
      fetch("/api/elections").then((r) => r.json()),
      fetch("/api/members/profile").then((r) => r.json()).catch(() => null),
    ])
      .then(([eventsData, noticesData, electionsData, profileData]) => {
        setEvents(eventsData.data || []);
        setNotices(noticesData.data || []);
        const elList = electionsData.data || [];
        setElection(elList.find((e: any) => e.status !== "COMPLETED") || null);
        if (profileData && !profileData.error) setMemberProfile(profileData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const hasActiveElection = election?.status === "PHASE1_OPEN" || election?.status === "PHASE2_OPEN";

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
                  <h1 className="font-heading text-2xl font-bold mt-0.5">{memberProfile?.full_name || user.email.split("@")[0]}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <RoleBadge role={user.role} className="bg-white/20 text-white border-white/20" />
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
            <StatCard icon={<User className="w-5 h-5 text-blue-500" />} label={t("dashboard.status")} value={memberProfile?.status || t("dashboard.activeStatus")} color="bg-blue-50" />
            <StatCard icon={<Calendar className="w-5 h-5 text-green-500" />} label={t("dashboard.rsvpedEventsLabel")} value={String(events.length)} color="bg-green-50" />
            <StatCard icon={<Bell className="w-5 h-5 text-orange-500" />} label={t("dashboard.newNotices")} value={String(notices.length)} color="bg-orange-50" />
            <StatCard icon={<Vote className="w-5 h-5 text-purple-500" />} label={t("dashboard.activeElectionLabel")} value={hasActiveElection ? t("dashboard.yes") : t("dashboard.no")} color="bg-purple-50" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Election Banner */}
            {hasActiveElection && election && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-3">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Vote className="w-8 h-8 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{t("dashboard.activeElection")}</p>
                      <p className="text-white/70 text-sm">{election.status.replace(/_/g, " ")} · {t("elections.termLabel")} {election.term?.term_number ?? "—"}</p>
                    </div>
                  </div>
                  <Link href={`/elections/${election.id}/vote`}>
                    <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/20">
                      {t("elections.vote")}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Upcoming Events */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
              <div className="card h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-500" /> {t("dashboard.upcomingEvents")}
                  </h2>
                  <Link href="/events" className="text-xs text-accent hover:underline flex items-center gap-1">
                    {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">{t("dashboard.noEvents")}</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex flex-col items-center justify-center flex-shrink-0 text-green-600">
                          <span className="text-xs font-bold">{new Date(event.event_date).getDate()}</span>
                          <span className="text-[10px]">{new Date(event.event_date).toLocaleString("en", { month: "short" })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">{event.title}</p>
                          <p className="text-xs text-gray-400 truncate">{event.venue} · {event._count?.event_rsvp || 0}/{event.capacity} {t("events.rsvpLabel")}</p>
                        </div>
                        <StatusBadge status={event.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Notices */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="card h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-semibold text-primary flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" /> {t("dashboard.recentNotices")}
                  </h2>
                  <Link href="/notices" className="text-xs text-accent hover:underline flex items-center gap-1">
                    {t("common.viewAll")} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
                ) : notices.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">{t("dashboard.noNotices")}</p>
                ) : (
                  <div className="space-y-3">
                    {notices.map((notice) => (
                      <div key={notice.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-sm font-semibold text-primary line-clamp-2">{notice.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notice.published_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
