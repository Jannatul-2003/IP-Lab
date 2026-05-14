"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, ArrowLeft, Check } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toaster";
import { useLang, useAuthContext } from "@/app/providers";
import { mockEvents } from "@/lib/mockData";
import { formatDate, eventTypeIcon, cn } from "@/lib/utils";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuthContext();
  const toast = useToast();

  const event = mockEvents.find((e) => e.id === id) ?? mockEvents[0];
  const [isRsvpd, setIsRsvpd] = useState(event.userRsvp ?? false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const pct = Math.round(((event.rsvpCount ?? 0) / event.capacity) * 100);
  const isFull = (event.rsvpCount ?? 0) >= event.capacity;

  async function handleRsvp() {
    if (!user) { router.push("/login"); return; }
    if (isRsvpd) { setConfirmOpen(true); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsRsvpd(true);
    setLoading(false);
    toast.success(t("events.rsvpd") + "!");
  }

  async function handleCancelRsvp() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsRsvpd(false);
    setLoading(false);
    setConfirmOpen(false);
    toast.success(t("events.cancelRsvp") + ".");
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> {t("events.backToEvents")}
          </button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">{eventTypeIcon(event.eventType)}</span>
                  <span className="badge bg-surface text-primary capitalize">{t(`events.filter.${event.eventType}`)}</span>
                  <StatusBadge status={event.status} />
                </div>
                <h1 className="font-heading text-3xl font-bold text-primary leading-tight">{event.title}</h1>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("events.dateTime")}</p>
                  <p className="font-medium text-primary text-sm">{formatDate(event.eventDate, "dd MMM yyyy")}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.eventDate, "hh:mm a")}</p>
                </div>
              </div>
              {event.venue && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("events.venue")}</p>
                    <p className="font-medium text-primary text-sm">{event.venue}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("events.capacity")}</p>
                  <p className="font-medium text-primary text-sm">{event.rsvpCount} / {event.capacity}</p>
                  <div className="h-1 w-20 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div className={cn("h-full rounded-full", pct >= 90 ? "bg-red-400" : "bg-green-400")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h2 className="font-heading text-lg font-semibold text-primary mb-3">{t("events.about")}</h2>
                <p className="text-gray-500 leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* RSVP deadline */}
            {event.rsvpDeadline && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6 text-sm text-yellow-700">
                <strong>{t("events.rsvpDeadline")}:</strong> {formatDate(event.rsvpDeadline, "dd MMM yyyy, hh:mm a")}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              {event.status === "PUBLISHED" && !isFull && (
                <Button
                  onClick={handleRsvp}
                  isLoading={loading}
                  variant={isRsvpd ? "ghost" : "primary"}
                  leftIcon={isRsvpd ? <Check className="w-4 h-4" /> : undefined}
                  className={cn("min-w-[140px]", isRsvpd && "border border-slate-200")}
                >
                  {isRsvpd ? t("events.rsvpd") : t("events.rsvp")}
                </Button>
              )}
              {isFull && <span className="text-red-500 font-medium text-sm">{t("events.fullCapacity")}</span>}
              {!user && event.status === "PUBLISHED" && (
                <p className="text-sm text-gray-400">
                  <a href="/login" className="text-accent hover:underline">{t("events.signIn")}</a> {t("events.signInToRsvp")}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleCancelRsvp}
        onCancel={() => setConfirmOpen(false)}
        title={t("events.cancelRsvpTitle")}
        message={t("events.cancelRsvpMessage")}
        confirmLabel={t("events.cancelRsvpConfirm")}
        isLoading={loading}
      />
    </PageLayout>
  );
}
