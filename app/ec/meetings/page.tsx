"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Users, CheckCircle, XCircle, FileText, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext } from "@/app/providers";
import { mockMeetings, mockMembers } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";
import { formatDateTime, formatDate, cn } from "@/lib/utils";
import { Meeting, MeetingAttendanceRecord } from "@/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export default function EcMeetingsPage() {
  const { user, can } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [createOpen, setCreateOpen] = useState(false);
  const [attendanceTarget, setAttendanceTarget] = useState<Meeting | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ title: "", agenda: "", scheduledAt: "", venue: "" });
  const [formErrors, setFormErrors] = useState<Partial<typeof form>>({});

  // attendance state: memberId -> present
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) router.push("/dashboard");
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const canCall = can("PRESIDENT") || can("SECRETARY");

  // --- Calendar helpers ---
  const { firstDay, daysInMonth } = buildCalendar(calYear, calMonth);

  function meetingDaysInMonth(): Set<number> {
    const s = new Set<number>();
    meetings.forEach((m) => {
      const d = new Date(m.scheduledAt);
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

  // --- Create meeting ---
  function validateForm() {
    const errs: Partial<typeof form> = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.scheduledAt) errs.scheduledAt = "Date & time is required.";
    if (!form.venue.trim()) errs.venue = "Venue is required.";
    return errs;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const nm: Meeting = {
      id: `mt${Date.now()}`,
      title: form.title,
      agenda: form.agenda,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      venue: form.venue,
      status: "upcoming",
      calledBy: user?.role ?? "EC_OFFICER",
      attendanceRecords: [],
    };
    setMeetings((prev) => [nm, ...prev]);
    setForm({ title: "", agenda: "", scheduledAt: "", venue: "" });
    setFormErrors({});
    setLoading(false);
    setCreateOpen(false);
    toast.success("Meeting scheduled. All EC members notified.");
  }

  // --- Attendance capture ---
  function openAttendance(meeting: Meeting) {
    const init: Record<string, boolean> = {};
    mockMembers.forEach((m) => {
      const existing = meeting.attendanceRecords.find((r) => r.memberId === m.id);
      init[m.id] = existing?.present ?? false;
    });
    setAttendanceMap(init);
    setAttendanceTarget(meeting);
  }

  async function saveAttendance() {
    if (!attendanceTarget) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const records: MeetingAttendanceRecord[] = mockMembers.map((m) => ({
      memberId: m.id,
      memberName: m.fullName,
      present: attendanceMap[m.id] ?? false,
    }));
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === attendanceTarget.id
          ? { ...m, status: "completed" as const, attendanceRecords: records }
          : m
      )
    );
    setLoading(false);
    setAttendanceTarget(null);
    toast.success("Attendance recorded.");
  }

  const upcoming = meetings.filter((m) => m.status === "upcoming");
  const past = meetings.filter((m) => m.status !== "upcoming");

  const statusVariant = (s: string) =>
    s === "upcoming" ? "info" : s === "completed" ? "success" : "warning";

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">
                  ← EC Panel
                </button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <CalendarDays className="w-7 h-7 text-blue-500" />
                  Meeting Scheduler
                </h1>
              </div>
              {canCall && (
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)} size="sm">
                  Schedule Meeting
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Calendar */}
              <div className="lg:col-span-1">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-gray-500 transition-colors">‹</button>
                    <p className="font-heading font-semibold text-primary text-sm">
                      {MONTHS[calMonth]} {calYear}
                    </p>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-gray-500 transition-colors">›</button>
                  </div>

                  <div className="grid grid-cols-7 mb-2">
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                      <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
                      const hasMeeting = meetingDays.has(day);
                      return (
                        <div key={day} className="flex flex-col items-center py-0.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                            isToday ? "bg-accent text-white" : "text-gray-600 hover:bg-slate-100"
                          )}>
                            {day}
                          </div>
                          {hasMeeting && (
                            <div className="w-1 h-1 rounded-full bg-blue-400 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    Meeting scheduled
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: "Upcoming", value: upcoming.length, color: "text-blue-600", icon: "📅" },
                    { label: "Completed", value: past.length, color: "text-green-600", icon: "✅" },
                  ].map((s) => (
                    <div key={s.label} className="card text-center py-4">
                      <div className="text-xl mb-1">{s.icon}</div>
                      <p className={`font-heading text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meeting list */}
              <div className="lg:col-span-2 space-y-4">

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
                    <div className="space-y-3">
                      {upcoming.map((meeting, i) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          index={i}
                          expanded={expandedId === meeting.id}
                          onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                          onAttendance={() => openAttendance(meeting)}
                          canCall={canCall}
                          statusVariant={statusVariant}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-2">Past Meetings</p>
                    <div className="space-y-3">
                      {past.map((meeting, i) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          index={i}
                          expanded={expandedId === meeting.id}
                          onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                          onAttendance={() => openAttendance(meeting)}
                          canCall={canCall}
                          statusVariant={statusVariant}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {meetings.length === 0 && (
                  <div className="card text-center py-16 text-gray-400">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No meetings scheduled yet.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Schedule New Meeting" size="md">
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <FormField label="Meeting Title" required error={formErrors.title}>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Monthly EC Review"
              error={!!formErrors.title}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date & Time" required error={formErrors.scheduledAt}>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                error={!!formErrors.scheduledAt}
              />
            </FormField>
            <FormField label="Venue" required error={formErrors.venue}>
              <Input
                value={form.venue}
                onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
                placeholder="Room / Online"
                error={!!formErrors.venue}
              />
            </FormField>
          </div>
          <FormField label="Agenda">
            <Textarea
              value={form.agenda}
              onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
              placeholder="Topics to be discussed…"
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Schedule</Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal
        isOpen={!!attendanceTarget}
        onClose={() => setAttendanceTarget(null)}
        title="Capture Attendance"
        size="md"
      >
        {attendanceTarget && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
              <p className="font-semibold text-primary">{attendanceTarget.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(attendanceTarget.scheduledAt)}</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {mockMembers.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer",
                    attendanceMap[m.id]
                      ? "border-green-200 bg-green-50"
                      : "border-slate-100 bg-white hover:bg-slate-50"
                  )}
                  onClick={() => setAttendanceMap((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                      {m.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{m.fullName}</p>
                      <p className="text-xs text-gray-400">{m.studentId}</p>
                    </div>
                  </div>
                  {attendanceMap[m.id]
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-slate-300" />
                  }
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <p className="text-xs text-gray-400">
                {Object.values(attendanceMap).filter(Boolean).length} / {mockMembers.length} present
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setAttendanceTarget(null)}>Cancel</Button>
                <Button onClick={saveAttendance} isLoading={loading}>Save Attendance</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}

// --- Meeting Card sub-component ---
interface MeetingCardProps {
  meeting: Meeting;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onAttendance: () => void;
  canCall: boolean;
  statusVariant: (s: string) => "info" | "success" | "warning";
}

function MeetingCard({ meeting, index, expanded, onToggle, onAttendance, canCall, statusVariant }: MeetingCardProps) {
  const presentCount = meeting.attendanceRecords.filter((r) => r.present).length;
  const totalCount = meeting.attendanceRecords.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="card p-0 overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full text-left px-5 py-4 hover:bg-slate-50/60 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                meeting.status === "upcoming" ? "bg-blue-50" : "bg-green-50"
              )}>
                <CalendarDays className={cn("w-5 h-5", meeting.status === "upcoming" ? "text-blue-500" : "text-green-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary text-sm">{meeting.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(meeting.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {meeting.venue}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={statusVariant(meeting.status)}>
                {meeting.status}
              </Badge>
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                {meeting.agenda && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Agenda</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{meeting.agenda}</p>
                  </div>
                )}

                {meeting.attendanceRecords.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Attendance — {presentCount}/{totalCount} present
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {meeting.attendanceRecords.map((r) => (
                        <div
                          key={r.memberId}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            r.present ? "bg-green-100 text-green-700" : "bg-red-50 text-red-400"
                          )}
                        >
                          {r.present
                            ? <CheckCircle className="w-3 h-3" />
                            : <XCircle className="w-3 h-3" />
                          }
                          {r.memberName.split(" ")[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {canCall && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Users className="w-3.5 h-3.5" />}
                      onClick={onAttendance}
                    >
                      {meeting.attendanceRecords.length > 0 ? "Update Attendance" : "Capture Attendance"}
                    </Button>
                  )}
                  {meeting.minutesUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                      onClick={() => window.open(meeting.minutesUrl, "_blank")}
                    >
                      View Minutes
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
