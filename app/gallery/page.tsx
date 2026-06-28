"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { useLang } from "@/app/providers";
import { formatDate } from "@/lib/utils";

export default function GalleryPage() {
  const { t } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const response = await fetch('/api/media?type=image');
        const data = await response.json();
        setMedia(data.data || []);
      } catch (error) {
        console.error('Failed to fetch media:', error);
        setMedia([]);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, []);

  const selectedItem = media.find((i) => i.id === selected);

  if (loading) {
    return (
      <PageLayout>
        <PageHeader title={t("gallery.title")} subtitle={t("gallery.subtitle")} />
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
            Loading gallery...
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title={t("gallery.title")} subtitle={t("gallery.subtitle")} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {media.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-4">📷</div>
              <p>{t("gallery.noMedia")}</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {media.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => setSelected(item.id)}
                >
                  <img
                    src={item.url}
                    alt={item.tags?.join(", ") ?? "Gallery image"}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                      {item.tags.map((tag: string) => (
                        <span key={tag} className="badge bg-black/50 text-white text-xs backdrop-blur-sm">{tag}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setSelected(null)}
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full"
            >
              <img
                src={selectedItem.url}
                alt={selectedItem.tags?.join(", ") ?? "Gallery image"}
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
              {selectedItem.tags && (
                <div className="flex gap-2 mt-3 justify-center flex-wrap">
                  {selectedItem.tags.map((tag: string) => (
                    <span key={tag} className="badge bg-white/10 text-white">{tag}</span>
                  ))}
                </div>
              )}
              <p className="text-white/40 text-xs text-center mt-2">{formatDate(selectedItem.created_at as string)}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
