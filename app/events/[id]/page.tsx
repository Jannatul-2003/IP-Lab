"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft, Check } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useLang, useAuthContext } from "@/app/providers";
import { formatDate, eventTypeIcon, cn } from "@/lib/utils";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuthContext();
  const toast = useToast();

  const [event, setEvent] = useState<any>(null);
  const [isRsvpd, setIsRsvpd] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/events"); return; }
        setEvent(data);
        setRsvpCount(data.rsvpCount || data._count?.event_rsvp || 0);
      })
      .catch(() => router.push("/events"))
      .finally(() => setFetchLoading(false));
  }, [id, router]);

  if (fetchLoading || !event) {
    return (
      <PageLayout>
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
      </PageLayout>
    );
  }

  const pct = Math.round((rsvpCount / event.capacity) * 100);
  const isFull = rsvpCount >= event.capacity;

  async function handleRsvp() {
    if (!user) { router.push("/login"); return; }
    if (isRsvpd) { setConfirmOpen(true); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to RSVP"); return; }
      setIsRsvpd(true);
      setRsvpCount((c) => c + 1);
      toast.success(t("events.rsvpd") + "!");
    } catch {
      toast.error("Failed to RSVP");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelRsvp() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to cancel RSVP"); return; }
      setIsRsvpd(false);
      setRsvpCount((c) => Math.max(0, c - 1));
      toast.success(t("events.cancelRsvp") + ".");
    } catch {
      toast.error("Failed to cancel RSVP");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <PageLayout>
      <section className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/events")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t("events.backToEvents")}
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Event type icon + status */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{eventTypeIcon(event.event_type)}</span>
              <StatusBadge status={event.status} />
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-6">{event.title}</h1>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="card flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t("events.date")}</p>
                  <p className="font-semibold text-primary">{formatDate(event.event_date)}</p>
                </div>
              </div>
              <div className="card flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t("events.venue")}</p>
                  <p className="font-semibold text-primary">{event.venue || t("events.tbd")}</p>
                </div>
              </div>
              <div className="card flex items-center gap-3 text-sm">
                <Users className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{t("events.capacity")}</p>
                  <p className="font-semibold text-primary">{rsvpCount} / {event.capacity}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="card mb-6">
                <h2 className="font-heading text-lg font-semibold text-primary mb-3">{t("events.about")}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Capacity bar */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-500">{t("events.rsvpProgress")}</span>
                <span className={cn("font-semibold", isFull ? "text-red-500" : "text-accent")}>{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={cn("h-2 rounded-full transition-all", isFull ? "bg-red-400" : pct > 80 ? "bg-orange-400" : "bg-accent")} style={{ width: `${pct}%` }} />
              </div>
              {event.rsvp_deadline && (
                <p className="text-xs text-gray-400 mt-2">{t("events.rsvpDeadline")}: {formatDate(event.rsvp_deadline)}</p>
              )}
            </div>

            {/* RSVP CTA */}
            <div className="flex gap-3">
              {isRsvpd ? (
                <Button variant="outline" leftIcon={<Check className="w-4 h-4 text-green-500" />} onClick={handleRsvp} isLoading={loading}>
                  {t("events.rsvpd")}
                </Button>
              ) : (
                <Button onClick={handleRsvp} isLoading={loading} disabled={isFull || event.status !== "PUBLISHED"}>
                  {isFull ? t("events.full") : t("events.rsvp")}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleCancelRsvp}
        onCancel={() => setConfirmOpen(false)}
        title={t("events.cancelRsvpTitle")}
        message={t("events.cancelRsvpMessage")}
        confirmLabel={t("events.cancelRsvp")}
        variant="danger"
        isLoading={loading}
      />
    </PageLayout>
  );
}
