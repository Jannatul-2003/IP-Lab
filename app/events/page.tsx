"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Filter } from "lucide-react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { useLang, useAuthContext } from "@/app/providers";
import { formatDate, eventTypeIcon, cn } from "@/lib/utils";

type FilterType = "all" | "workshop" | "seminar" | "carnival" | "sports" | "general";

export default function EventsPage() {
  const { t } = useLang();
  const { user } = useAuthContext();
  const [filter, setFilter] = useState<FilterType>("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data.data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const filtered = filter === "all" ? events : events.filter((e) => e.event_type === filter);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: t("events.filter.all") },
    { value: "workshop", label: t("events.filter.workshop") },
    { value: "seminar", label: t("events.filter.seminar") },
    { value: "carnival", label: t("events.filter.carnival") },
    { value: "sports", label: t("events.filter.sports") },
    { value: "general", label: t("events.filter.general") },
  ];

  function toggleRsvp(id: string) {
    if (!user) return;
    setRsvpd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title={t("events.title")} subtitle={t("events.subtitle")} />
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            Loading events...
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("events.title")} subtitle={t("events.subtitle")} />

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <Filter className="w-4 h-4 text-gray-400" />
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  filter === f.value
                    ? "bg-accent text-white shadow-sm"
                    : "bg-white border border-slate-200 text-gray-500 hover:border-accent/50 hover:text-accent"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">🎪</div>
              <p>{t("events.noEvents")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((event, i) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={i}
                  isRsvpd={rsvpd.has(event.id)}
                  canRsvp={!!user}
                  onRsvp={() => toggleRsvp(event.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
}

function EventCard({
  event,
  index,
  isRsvpd,
  canRsvp,
  onRsvp,
  t,
}: {
  event: any;
  index: number;
  isRsvpd: boolean;
  canRsvp: boolean;
  onRsvp: () => void;
  t: (k: string) => string;
}) {
  const capacity = event.capacity || 1;
  const rsvpCount = event.rsvp_count || 0;
  const pct = Math.round((rsvpCount / capacity) * 100);
  const isFull = rsvpCount >= capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="card flex flex-col group hover:border-accent/30"
    >
      {/* Type banner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{eventTypeIcon(event.event_type)}</span>
          <span className="badge bg-surface text-primary capitalize text-xs">{event.event_type || 'general'}</span>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <Link href={`/events/${event.id}`}>
        <h3 className="font-heading text-xl font-semibold text-primary mb-2 dark:text-accent transition-colors leading-snug group-hover:text-sky-300">
          {event.title}
        </h3>
      </Link>

      <div className="space-y-2 mb-4 flex-1">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          {formatDate(event.event_date as string, "dd MMM yyyy, hh:mm a")}
        </div>
        {event.venue && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {event.venue}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="w-4 h-4 flex-shrink-0" />
          {rsvpCount} / {capacity} {t("events.capacity")}
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-red-400" : pct >= 60 ? "bg-yellow-400" : "bg-green-400")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct}% Full</p>
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/events/${event.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">{t("events.details")}</Button>
        </Link>
        {event.status === "PUBLISHED" && !isFull && canRsvp && (
          <Button
            size="sm"
            variant={isRsvpd ? "ghost" : "primary"}
            onClick={onRsvp}
            className={cn("flex-shrink-0", isRsvpd && "border border-slate-200")}
          >
            {isRsvpd ? t("events.cancelRsvp") : t("events.rsvp")}
          </Button>
        )}
        {isFull && <span className="text-xs text-red-400 font-medium px-2">{t("events.full")}</span>}
      </div>
    </motion.div>
  );
}
