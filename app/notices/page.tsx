"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useAuthContext, useLang } from "@/app/providers";
import { useToast } from "@/components/ui/Toaster";
import { mockNotices } from "@/lib/mockData";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import { Notice, NoticeType, UserRole } from "@/types";

const STORAGE_KEY = "csedusc_notices_custom";
const ALLOWED_NOTICE_ROLES: UserRole[] = ["EC_OFFICER", "PRESIDENT", "SYSTEM_ADMIN"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/csv",
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

const typeColors: Record<NoticeType, string> = {
  Election: "bg-purple-100 text-purple-700 border-purple-200",
  General: "bg-blue-100 text-blue-700 border-blue-200",
  Policy: "bg-orange-100 text-orange-700 border-orange-200",
  Membership: "bg-green-100 text-green-700 border-green-200",
  Event: "bg-teal-100 text-teal-700 border-teal-200",
};

const typeEmoji: Record<NoticeType, string> = {
  Election: "🗳",
  Policy: "📜",
  Event: "🎪",
  Membership: "👥",
  General: "📢",
};

export default function NoticesPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | NoticeType>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noticeType, setNoticeType] = useState<NoticeType>("General");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const typeFilters: { value: "all" | NoticeType; label: string }[] = [
    { value: "all", label: t("notices.filters.all") },
    { value: "General", label: t("notices.types.General") },
    { value: "Election", label: t("notices.types.Election") },
    { value: "Policy", label: t("notices.types.Policy") },
    { value: "Membership", label: t("notices.types.Membership") },
    { value: "Event", label: t("notices.types.Event") },
  ];

  const canPublish = !!user && ALLOWED_NOTICE_ROLES.includes(user.role);
  const readableRole = (role: string | undefined) =>
    role ? role.replaceAll("_", " ") : "SYSTEM";

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const storedNotices = JSON.parse(raw) as Notice[];
      if (Array.isArray(storedNotices)) {
        setNotices([...storedNotices, ...mockNotices]);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? notices : notices.filter((n) => n.noticeType === filter)),
    [filter, notices]
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Upload PDF, Excel, Word, or CSV.");
      e.currentTarget.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Max size is 10MB.");
      e.currentTarget.value = "";
      return;
    }
    setSelectedFile(file);
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!canPublish) {
      toast.error("Only EC, President, and Admin can publish notices.");
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error("Title and details are required.");
      return;
    }

    setSaving(true);
    try {
      let attachment: Notice["attachment"] | undefined;
      if (selectedFile) {
        const dataUrl = await fileToDataUrl(selectedFile);
        attachment = {
          name: selectedFile.name,
          url: dataUrl,
          mimeType: selectedFile.type,
          size: selectedFile.size,
        };
      }

      const newNotice: Notice = {
        id: `user-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        noticeType,
        authorRole: user?.role,
        authorId: user?.id,
        publishedAt: new Date().toISOString(),
        attachment,
      };

      const nextCustom = [newNotice, ...notices.filter((n) => n.id.startsWith("user-"))];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom));
      setNotices((prev) => [newNotice, ...prev]);

      setTitle("");
      setContent("");
      setNoticeType("General");
      setSelectedFile(null);
      toast.success("Notice published successfully.");
    } catch {
      toast.error("Could not process the attachment. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      <PageHeader title={t("notices.title")} subtitle={t("notices.subtitle")} />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {canPublish && (
            <motion.form
              onSubmit={handlePublish}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-xl p-5 sm:p-6 shadow-card mb-8 space-y-4"
            >
              <h2 className="font-heading text-xl text-primary font-semibold">Publish Notice</h2>
              <p className="text-sm text-gray-400">You can attach PDF, Excel, Word, or CSV files (max 10MB).</p>

              <FormField label="Title" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title" />
              </FormField>

              <FormField label="Type" required>
                <select
                  value={noticeType}
                  onChange={(e) => setNoticeType(e.target.value as NoticeType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  {typeFilters
                    .filter((f) => f.value !== "all")
                    .map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField label="Details" required>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the notice details..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary placeholder:text-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y min-h-[110px]"
                />
              </FormField>

              <FormField label="Attachment (optional)">
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-accent/10 file:px-4 file:py-2 file:text-accent file:font-medium hover:file:bg-accent/20"
                />
                {selectedFile && <p className="text-xs text-gray-400 mt-2">Selected: {selectedFile.name}</p>}
              </FormField>

              <div className="flex justify-end">
                <Button type="submit" isLoading={saving} disabled={saving}>
                  Publish Notice
                </Button>
              </div>
            </motion.form>
          )}

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {typeFilters.map((f) => (
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

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p>{t("notices.noNotices")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((notice, i) => {
                const isOpen = expanded === notice.id;
                const colorClass = typeColors[notice.noticeType] ?? "bg-gray-100 text-gray-600 border-gray-200";
                const emoji = typeEmoji[notice.noticeType] ?? "📢";

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
                          {i < filtered.length - 1 && <div className="w-0.5 h-6 bg-slate-100 mt-2" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn("badge border", colorClass)}>{t(`notices.types.${notice.noticeType}`)}</span>
                            <span className="text-xs text-gray-400">{timeAgo(notice.publishedAt)}</span>
                            {notice.authorRole && (
                              <span className="text-xs text-gray-400">· {t("notices.by")} {readableRole(notice.authorRole)}</span>
                            )}
                          </div>
                          <h3 className="font-heading font-semibold text-primary text-lg leading-snug">{notice.title}</h3>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(notice.publishedAt, "dd MMMM yyyy")}</p>
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
                        <p>{notice.content}</p>
                        {notice.attachment && (
                          <a
                            href={notice.attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex mt-3 text-sm text-accent hover:underline font-medium"
                          >
                            Open attachment: {notice.attachment.name}
                          </a>
                        )}
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
