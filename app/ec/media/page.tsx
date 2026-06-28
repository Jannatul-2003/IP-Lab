"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Image, Upload, X, ZoomIn, Tag, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { MediaItem } from "@/types";

export default function EcMediaPage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) { router.push("/dashboard"); return; }
    fetch("/api/media?type=image&limit=100")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.data || []).map((m: any) => ({
          id: m.id, url: m.url, mediaType: m.media_type, tags: m.tags || [], eventId: m.event_id, createdAt: m.created_at,
        }));
        setItems(list);
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false));
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const allTags = Array.from(new Set(items.flatMap((m) => m.tags ?? [])));
  const filtered = filterTag ? items.filter((m) => m.tags?.includes(filterTag)) : items;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const tags = tagInput.split(",").map((tag) => tag.trim()).filter(Boolean);
    try {
      const newItems: MediaItem[] = [];
      for (const file of Array.from(files)) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        const uploadRes = await fetch("/api/media/upload", { method: "POST", body: uploadForm });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          toast.error(err.error || `Failed to upload ${file.name}`);
          continue;
        }
        const { url, mediaType } = await uploadRes.json();

        const res = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, mediaType, tags }),
        });
        if (res.ok) {
          const data = await res.json();
          newItems.push({ id: data.id, url, mediaType: data.media_type as "image" | "pdf", tags: data.tags, createdAt: data.created_at });
        }
      }
      setItems((prev) => [...newItems, ...prev]);
      setTagInput("");
      toast.success(`${files.length} ${t("ecPanel.media.uploadSuccess")}`);
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteItem() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success(t("ecPanel.media.deleteSuccess"));
    } catch {
      toast.error("Failed to delete.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">{t("ecPanel.backToPanel")}</button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <Image className="w-7 h-7 text-pink-500" />
                  {t("ecPanel.media.title")}
                </h1>
              </div>
              <Button leftIcon={<Upload className="w-4 h-4" />} onClick={() => fileRef.current?.click()} isLoading={uploading}>
                {t("ecPanel.media.upload")}
              </Button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={cn("card border-2 border-dashed cursor-pointer mb-6 transition-all text-center py-8", dragOver ? "border-accent bg-accent/5" : "border-slate-200 hover:border-accent/40")}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">{t("ecPanel.media.dragDrop")}</p>
              <div className="mt-3 flex items-center gap-2 justify-center max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                <Tag className="w-4 h-4 text-gray-300" />
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t("ecPanel.media.tagsPlaceholder")} className="text-xs" />
              </div>
            </div>
            <input ref={fileRef} type="file" className="hidden" multiple accept="image/*,.pdf" onChange={(e) => handleFiles(e.target.files)} />

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                <button onClick={() => setFilterTag("")} className={cn("px-3 py-1 rounded-full text-xs font-medium", !filterTag ? "bg-accent text-white" : "bg-slate-100 text-gray-500")}>All</button>
                {allTags.map((tag) => (
                  <button key={tag} onClick={() => setFilterTag(filterTag === tag ? "" : tag)} className={cn("px-3 py-1 rounded-full text-xs font-medium", filterTag === tag ? "bg-accent text-white" : "bg-slate-100 text-gray-500 hover:bg-slate-200")}>#{tag}</button>
                ))}
              </div>
            )}

            {fetchLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="card text-center py-16 text-gray-400">
                <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("ecPanel.media.noItems")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <AnimatePresence>
                  {filtered.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.03 }} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                      {item.mediaType === "image" ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200"><span className="text-xs font-bold text-gray-400">PDF</span></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => setLightbox(item)} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center"><ZoomIn className="w-4 h-4 text-white" /></button>
                        <button onClick={() => setDeleteTarget(item)} className="w-9 h-9 rounded-full bg-red-500/70 hover:bg-red-500 flex items-center justify-center"><Trash2 className="w-4 h-4 text-white" /></button>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                          {item.tags.slice(0, 2).map((tag) => <span key={tag} className="text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">#{tag}</span>)}
                        </div>
                      )}
                      <div className="absolute top-1 right-1 text-xs bg-black/40 text-white/70 px-1.5 py-0.5 rounded">{formatDate(item.createdAt)}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
          {lightbox.mediaType === "image" && <img src={lightbox.url} alt="" className="max-w-full max-h-[90vh] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onConfirm={deleteItem} onCancel={() => setDeleteTarget(null)} title={t("ecPanel.media.deleteTitle")} message={t("ecPanel.media.deleteMessage")} confirmLabel={t("ecPanel.media.deleteConfirm")} variant="danger" isLoading={deleting} />
    </PageLayout>
  );
}
