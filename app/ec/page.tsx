"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, Vote, DollarSign, Image, ArrowRight, CalendarDays } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAuthContext, useLang } from "@/app/providers";
import { isEcOfficer } from "@/lib/auth";

export default function EcPanelPage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingMeetings, setUpcomingMeetings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) { router.push("/dashboard"); return; }
    Promise.all([
      fetch("/api/members/list?status=PENDING&limit=1").then((r) => r.json()),
      fetch("/api/meetings?status=upcoming").then((r) => r.json()),
    ])
      .then(([membersData, meetingsData]) => {
        setPendingCount(membersData.pagination?.total || 0);
        setUpcomingMeetings((meetingsData.data || []).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const modules = [
    { href: "/ec/members", icon: <Users className="w-6 h-6" />, title: t("ecPanel.modules.members.title"), desc: t("ecPanel.modules.members.desc"), color: "bg-blue-50 text-blue-600", stat: loading ? "..." : `${pendingCount} ${t("ecPanel.modules.members.stat")}` },
    { href: "/ec/elections", icon: <Vote className="w-6 h-6" />, title: t("ecPanel.modules.elections.title"), desc: t("ecPanel.modules.elections.desc"), color: "bg-purple-50 text-purple-600", stat: t("ecPanel.modules.elections.stat") },
    { href: "/ec/finance", icon: <DollarSign className="w-6 h-6" />, title: t("ecPanel.modules.finance.title"), desc: t("ecPanel.modules.finance.desc"), color: "bg-green-50 text-green-600", stat: t("ecPanel.modules.finance.stat") },
    { href: "/ec/meetings", icon: <CalendarDays className="w-6 h-6" />, title: t("ecPanel.modules.meetings.title"), desc: t("ecPanel.modules.meetings.desc"), color: "bg-indigo-50 text-indigo-600", stat: loading ? "..." : `${upcomingMeetings} ${t("ecPanel.modules.meetings.upcoming")}` },
    { href: "/ec/media", icon: <Image className="w-6 h-6" />, title: t("ecPanel.modules.media.title"), desc: t("ecPanel.modules.media.desc"), color: "bg-orange-50 text-orange-600", stat: t("ecPanel.modules.media.stat") },
  ];

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-primary">{t("ecPanel.title")}</h1>
              <p className="text-gray-400 text-sm mt-1">{t("ecPanel.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod, i) => (
                <motion.div key={mod.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={mod.href} className="card block hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mod.color}`}>
                        {mod.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-primary group-hover:text-accent transition-colors">{mod.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
                        <p className="text-xs font-medium text-accent mt-2">{mod.stat}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
