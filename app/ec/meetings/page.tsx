"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Users, CheckCircle, XCircle, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export default function EcMeetingsPage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [form, setForm] = useState({ title: "", agenda: "", scheduledAt: "", venue: "" });
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) { router.push("/dashboard"); return; }
    Promise.all([
      fetch("/api/meetings").then((r) => r.json()),
      fetch("/api/members/list?limit=200").then((r) => r.json()),
    ])
      .then(([meetingsData, membersData]) => {
        setMeetings(meetingsData.data || []);
        setMembers(membersData.data || []);
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false));
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const canCall = can("PRESIDENT") || can("SECRETARY");
  const { firstDay, daysInMonth } = buildCalendar(calYear, calMonth);

  function meetingDaysInMonth(): Set<number> {
    const s = new Set<number>();
    meetings.forEach((m) => {
      const d = new Date(m.scheduled_at);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) s.add(d.getDate());
    });
    return s;
  }
  const meetingDays = meetingDaysInMonth();

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduledAt || !form.venue) return;
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, agenda: form.agenda, scheduledAt: form.scheduledAt, venue: form.venue, calledBy: user?.role ?? "EC_OFFICER" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create"); return; }
      setMeetings((prev) => [data, ...prev]);
      setForm({ title: "", agenda: "", scheduledAt: "", venue: "" });
      setCreateOpen(false);
      toast.success(t("ecPanel.meetings.meetingScheduled") + ".");
    } catch {
      toast.error("Failed to create meeting.");
    } finally {
      setLoading(false);
    }
  }

  function openAttendance(meeting: any) {
    const init: Record<string, boolean> = {};
    members.forEach((m: any) => {
      const existing = meeting.attendance?.find((r: any) => r.member_id === m.id);
      init[m.id] = existing?.present ?? false;
    });
    setAttendanceMap(init);
    setAttendanceTarget(meeting);
  }

  async function saveAttendance() {
    if (!attendanceTarget) return;
    setLoading(true);
    try {
      const attendance = members.map((m: any) => ({ memberId: m.id, present: attendanceMap[m.id] ?? false }));
      const res = await fetch(`/api/meetings/${attendanceTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", attendance }),
      });
      if (!res.ok) { toast.error("Failed to save"); return; }
      setMeetings((prev) => prev.map((m) => m.id === attendanceTarget.id ? { ...m, status: "completed", attendance } : m));
      toast.success(t("ecPanel.meetings.saveAttendance") + ".");
    } catch {
      toast.error("Failed to save attendance.");
    } finally {
      setLoading(false);
      setAttendanceTarget(null);
    }
  }

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status !== "upcoming");

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">{t("ecPanel.backToPanel")}</button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <CalendarDays className="w-7 h-7 text-indigo-500" />
                  {t("ecPanel.meetings.title")}
                </h1>
              </div>
              {canCall && <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>{t("ecPanel.meetings.schedule")}</Button>}
            </div>

            {/* Calendar */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100">‹</button>
                <p className="font-semibold text-primary text-sm">{MONTHS_EN[calMonth]} {calYear}</p>
                <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100">›</button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                  const hasMeeting = meetingDays.has(day);
                  return (
                    <div key={day} className={cn("aspect-square flex items-center justify-center rounded-lg text-xs font-medium relative", isToday ? "bg-accent text-white" : hasMeeting ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-500")}>
                      {day}
                      {hasMeeting && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {fetchLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                {upcoming.length > 0 && (
                  <div className="mb-6">
                    <h2 className="font-heading text-lg font-semibold text-primary mb-3">{t("ecPanel.meetings.upcoming")} ({upcoming.length})</h2>
                    <div className="space-y-3">
                      {upcoming.map((meeting) => (
                        <div key={meeting.id} className="card border-l-4 border-indigo-400">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-primary">{meeting.title}</h3>
                              <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(meeting.scheduled_at).toLocaleString()}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.venue}</span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.called_by}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="info">Upcoming</Badge>
                              <Button size="sm" variant="ghost" onClick={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}>
                                {expandedId === meeting.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                          {expandedId === meeting.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <p className="text-sm text-gray-500 mb-3"><span className="font-medium text-primary">Agenda:</span> {meeting.agenda}</p>
                              <Button size="sm" leftIcon={<Users className="w-3.5 h-3.5" />} onClick={() => openAttendance(meeting)}>{t("ecPanel.meetings.markAttendance")}</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-primary mb-3">{t("ecPanel.meetings.past")} ({past.length})</h2>
                    <div className="space-y-3">
                      {past.map((meeting) => {
                        const attendance = meeting.attendance || [];
                        const present = attendance.filter((r: any) => r.present).length;
                        return (
                          <div key={meeting.id} className="card opacity-80">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-primary">{meeting.title}</h3>
                                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(meeting.scheduled_at)}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.venue}</span>
                                  {attendance.length > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{present}/{attendance.length} present</span>}
                                </div>
                              </div>
                              <Badge variant="success">Completed</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {meetings.length === 0 && (
                  <div className="card text-center py-16 text-gray-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No meetings yet.</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Create meeting modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t("ecPanel.meetings.schedule")} size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label={t("ecPanel.meetings.meetingTitle")} required>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. Term 8 Kickoff" required />
          </FormField>
          <FormField label={t("ecPanel.meetings.dateTime")} required>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))} required />
          </FormField>
          <FormField label={t("ecPanel.meetings.venue")} required>
            <Input value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} placeholder="e.g. CSEDU Seminar Room" required />
          </FormField>
          <FormField label={t("ecPanel.meetings.agenda")}>
            <Textarea value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))} rows={3} placeholder="Meeting agenda..." />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" isLoading={loading}>{t("ecPanel.meetings.schedule")}</Button>
          </div>
        </form>
      </Modal>

      {/* Attendance modal */}
      <Modal isOpen={!!attendanceTarget} onClose={() => setAttendanceTarget(null)} title={t("ecPanel.meetings.markAttendance")} size="md">
        <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
          {members.map((m: any) => (
            <label key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input type="checkbox" checked={attendanceMap[m.id] ?? false} onChange={(e) => setAttendanceMap((prev) => ({ ...prev, [m.id]: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm text-primary">{m.full_name}</span>
              <span className="text-xs text-gray-400 ml-auto">{m.student_id}</span>
            </label>
          ))}
          {members.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No members found.</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAttendanceTarget(null)}>{t("common.cancel")}</Button>
          <Button onClick={saveAttendance} isLoading={loading} leftIcon={<CheckCircle className="w-4 h-4" />}>{t("ecPanel.meetings.saveAttendance")}</Button>
        </div>
      </Modal>
    </PageLayout>
  );
}
