"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Image, Upload, X, ZoomIn, FileText, Tag, Trash2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext } from "@/app/providers";
import { mockGallery } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { MediaItem } from "@/types";

export default function EcMediaPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaItem[]>(mockGallery);
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [filterTag, setFilterTag] = useState("");

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) router.push("/dashboard");
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const allTags = Array.from(new Set(items.flatMap((m) => m.tags ?? [])));
  const filtered = filterTag ? items.filter((m) => m.tags?.includes(filterTag)) : items;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    const newItems: MediaItem[] = Array.from(files).map((f, i) => ({
      id: `img${Date.now()}${i}`,
      url: URL.createObjectURL(f),
      mediaType: f.type.startsWith("image/") ? "image" : "pdf",
      tags,
      createdAt: new Date().toISOString(),
    }));
    setItems((prev) => [...newItems, ...prev]);
    setTagInput("");
    setUploading(false);
    toast.success(`${files.length} file(s) uploaded successfully.`);
  }

  async function deleteItem() {
    if (!deleteTarget) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setItems((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    toast.warning("Media item deleted.");
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">← EC Panel</button>
              <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                <Image className="w-7 h-7 text-orange-500" />
                Media & Gallery
              </h1>
            </div>

            {/* Upload zone */}
            <div
              className={cn(
                "card border-2 border-dashed mb-6 transition-all cursor-pointer",
                dragOver ? "border-accent bg-accent/5" : "border-slate-200 hover:border-accent/40"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-center py-8">
                <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors", dragOver ? "text-accent" : "text-gray-300")} />
                <p className="font-semibold text-primary text-sm mb-1">Drag & drop files here, or click to browse</p>
                <p className="text-xs text-gray-400">Supports: JPG, PNG, WEBP, PDF · Max 10MB per file</p>

                <div className="mt-4 flex items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="text-xs w-48"
                    />
                  </div>
                  <Button size="sm" isLoading={uploading} leftIcon={<Upload className="w-3.5 h-3.5" />} onClick={() => fileRef.current?.click()}>
                    Upload
                  </Button>
                </div>
              </div>
              <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterTag("")}
                className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", !filterTag ? "bg-accent text-white" : "bg-white border border-slate-200 text-gray-500 hover:border-accent/40")}
              >
                All ({items.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-all", filterTag === tag ? "bg-accent text-white" : "bg-white border border-slate-200 text-gray-500 hover:border-accent/40")}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Gallery grid */}
            {filtered.length === 0 ? (
              <div className="card text-center py-16 text-gray-400">
                <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No media items found.</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
                <AnimatePresence>
                  {filtered.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="break-inside-avoid relative group rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm"
                    >
                      {item.mediaType === "pdf" ? (
                        <div className="h-32 flex flex-col items-center justify-center bg-red-50">
                          <FileText className="w-10 h-10 text-red-400 mb-2" />
                          <p className="text-xs text-gray-400">PDF Document</p>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.url}
                          alt=""
                          className="w-full object-cover"
                          style={{ maxHeight: 220 }}
                        />
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                        {item.mediaType === "image" && (
                          <button
                            onClick={() => setLightbox(item)}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <ZoomIn className="w-5 h-5 text-white" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-full bg-red-500/80 hover:bg-red-600/80 transition-colors"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="p-2 flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-slate-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="px-2 pb-2">
                        <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" onClick={() => setLightbox(null)} aria-label="Close lightbox">
              <X className="w-5 h-5 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={lightbox.url}
              alt=""
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox.tags && lightbox.tags.length > 0 && (
              <div className="absolute bottom-6 flex gap-2">
                {lightbox.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 text-xs bg-white/20 text-white rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onConfirm={deleteItem}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Media Item?"
        message="This will permanently remove the media item from the gallery. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </PageLayout>
  );
}
