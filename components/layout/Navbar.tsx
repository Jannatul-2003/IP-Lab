"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, ChevronDown, LogOut, User, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useAuthContext, useLang, useTheme } from "@/app/providers";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, can } = useAuthContext();
  const { lang, toggle, t } = useLang();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isHomePage = pathname === "/";

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/events", label: t("nav.events") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/notices", label: t("nav.notices") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const bgClass = scrolled
    ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-gray-700"
    : isHomePage
    ? "bg-transparent"
    : "bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-700";

  // Text colour helpers — on the hero the navbar sits over a dark gradient
  const onDarkBg = isHomePage && !scrolled;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <nav
      className={cn("fixed top-0 left-0 right-0 z-50 transition-all duration-300", bgClass)}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">

          {/* ── Logo — single CSEDU logo, properly sized ── */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="CSEDUSC Home">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0 bg-white/10">
              <img
                src="/images/csedu-logo.png"
                alt="CSEDUSC"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div className="leading-tight">
              <span className={cn(
                "font-heading font-bold text-base block",
                onDarkBg ? "text-white" : "text-primary dark:text-white"
              )}>
                CSEDUSC
              </span>
              <span className={cn(
                "text-xs block",
                onDarkBg ? "text-white/60" : "text-gray-400 dark:text-gray-500"
              )}>
                Students&apos; Club
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav links ── */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.href)
                    ? onDarkBg
                      ? "text-white bg-white/15"
                      : "text-accent bg-surface/60 dark:bg-accent/20 dark:text-accent"
                    : onDarkBg
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-surface/50 dark:hover:bg-gray-700"
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right actions ── */}
          <div className="hidden lg:flex items-center gap-1.5">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                onDarkBg
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-surface/50 dark:hover:bg-gray-700"
              )}
              aria-label={`Switch to ${lang === "en" ? "Bangla" : "English"}`}
            >
              <Globe className="w-4 h-4" />
              <span>{lang === "en" ? "বাংলা" : "English"}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              className={cn(
                "p-2 rounded-lg transition-colors",
                onDarkBg
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-white hover:bg-surface/50 dark:hover:bg-gray-700"
              )}
            >
              {theme === "light"
                ? <Moon className="w-5 h-5" />
                : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>

            {/* Notification bell (only when logged in) */}
            {user && <NotificationBell />}

            {/* User menu / auth buttons */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    onDarkBg ? "text-white/80 hover:bg-white/10" : "text-primary dark:text-white hover:bg-surface/50 dark:hover:bg-gray-700"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-100 dark:border-gray-700 py-1 z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <RoleBadge role={user.role} className="mt-1" />
                      </div>
                      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4" /> {t("nav.dashboard")}
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4" /> {t("nav.profile")}
                      </Link>
                      {can("EC_OFFICER") && (
                        <Link href="/ec" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-700 transition-colors" onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard className="w-4 h-4" /> {t("nav.ecPanel")}
                        </Link>
                      )}
                      <div className="border-t border-slate-100 dark:border-gray-700 mt-1">
                        <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
                          <LogOut className="w-4 h-4" /> {t("nav.logout")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className={cn(onDarkBg && "text-white hover:bg-white/10")}>
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="shadow-glow-sm">{t("nav.register")}</Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile: theme + hamburger ── */}
          <div className="lg:hidden flex items-center gap-1">
            {user && <NotificationBell />}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={cn(
                "p-2 rounded-lg transition-colors",
                onDarkBg ? "text-white/80 hover:bg-white/10" : "text-gray-500 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-700"
              )}
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </button>
            <button
              className={cn("p-2 rounded-lg transition-colors", onDarkBg ? "text-white hover:bg-white/10" : "text-primary dark:text-white hover:bg-surface/50 dark:hover:bg-gray-700")}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-700 shadow-lg overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-surface text-accent dark:bg-accent/20 dark:text-accent"
                      : "text-gray-600 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-slate-100 dark:border-gray-700 pt-3 mt-3 space-y-2">
                <button
                  onClick={toggle}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                  {lang === "en" ? "বাংলায় দেখুন" : "View in English"}
                </button>
                {user ? (
                  <>
                    <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-800 rounded-lg">{t("nav.dashboard")}</Link>
                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-surface/50 dark:hover:bg-gray-800 rounded-lg">{t("nav.profile")}</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">{t("nav.logout")}</button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/login"><Button variant="outline" size="sm" className="w-full">{t("nav.login")}</Button></Link>
                    <Link href="/register"><Button size="sm" className="w-full">{t("nav.register")}</Button></Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
