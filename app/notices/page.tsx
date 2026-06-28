"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { useLang } from "@/app/providers";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import { NoticeType } from "@/types";

const typeColors: Record<string, string> = {
  Election: "bg-purple-100 text-purple-700 border-purple-200",
  General: "bg-blue-100 text-blue-700 border-blue-200",
  Policy: "bg-orange-100 text-orange-700 border-orange-200",
  Membership: "bg-green-100 text-green-700 border-green-200",
  Event: "bg-teal-100 text-teal-700 border-teal-200",
};

const typeEmoji: Record<string, string> = {
  Election: "🗳",
  Policy: "📜",
  Event: "🎪",
  Membership: "👥",
  General: "📢",
};

const NOTICE_TYPE_KEYS: string[] = ["all", "General", "Election", "Policy", "Membership", "Event"];

export default function NoticesPage() {
  const { t } = useLang();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotices() {
      try {
        const url = new URL('/api/notices', window.location.origin);
        if (filter !== "all") {
          url.searchParams.set('type', filter);
        }
        const response = await fetch(url.toString());
        const data = await response.json();
        setNotices(data.data || []);
      } catch (error) {
        console.error('Failed to fetch notices:', error);
        setNotices([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNotices();
  }, [filter]);

  const typeLabel = (type: string) =>
    type === "all" ? t("notices.filterAll") : t(`notices.types.${type}`);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title={t("notices.title")} subtitle={t("notices.subtitle")} />
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 text-center text-gray-400">
            Loading notices...
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("notices.title")} subtitle={t("notices.subtitle")} />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {NOTICE_TYPE_KEYS.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  filter === type
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white border border-slate-200 text-gray-500 hover:border-accent/50 hover:text-accent"
                )}
              >
                {typeLabel(type)}
              </button>
            ))}
          </div>

          {notices.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p>{t("notices.noNotices")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice, i) => {
                const isOpen = expanded === notice.id;
                const noticeType = notice.notice_type || "General";
                const colorClass = typeColors[noticeType] ?? "bg-gray-100 text-gray-600 border-gray-200";
                const emoji = typeEmoji[noticeType] ?? "📢";

                return (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200"
                  >
                    <button
                      className="w-full text-left p-5"
                      onClick={() => setExpanded(isOpen ? null : notice.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start gap-4">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center flex-shrink-0 mt-1">
                          <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-lg">{emoji}</div>
                          {i < notices.length - 1 && <div className="w-0.5 h-6 bg-slate-100 mt-2" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn("badge border", colorClass)}>
                              {noticeType}
                            </span>
                            <span className="text-xs text-gray-400">{timeAgo(notice.published_at)}</span>
                            {notice.author_role && (
                              <span className="text-xs text-gray-400">· {t("notices.by")} {notice.author_role}</span>
                            )}
                          </div>
                          <h3 className="font-heading font-semibold text-primary text-lg leading-snug">{notice.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notice.published_at as string, "dd MMMM yyyy")}</p>
                        </div>

                        <span className={cn("text-gray-300 transition-transform duration-200 flex-shrink-0 mt-1", isOpen && "rotate-180")}>
                          ▼
                        </span>
                      </div>
                    </button>

                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pl-[72px] text-gray-500 leading-relaxed text-sm border-t border-slate-50 pt-4">
                        {notice.content}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
