"use client";
import React, { useRef, useState, useEffect } from "react";
import { Bell, X, CheckCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type AppNotification } from "@/app/providers";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<AppNotification["type"], string> = {
  notice:   "bg-yellow-100 text-yellow-700",
  event:    "bg-blue-100 text-blue-700",
  election: "bg-purple-100 text-purple-700",
  system:   "bg-gray-100 text-gray-600",
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative p-2 rounded-lg transition-colors hover:bg-surface/60 dark:hover:bg-gray-700"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
            bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800
              rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3
              border-b border-slate-100 dark:border-gray-700">
              <span className="font-semibold text-sm text-primary dark:text-white">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {unreadCount} unread
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
                      "hover:bg-slate-50 dark:hover:bg-gray-700/50",
                      !n.read && "bg-blue-50/60 dark:bg-blue-900/10"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 mt-0.5",
                      TYPE_STYLES[n.type]
                    )}>
                      {n.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-tight",
                        !n.read
                          ? "font-semibold text-primary dark:text-white"
                          : "font-normal text-gray-600 dark:text-gray-400"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
