"use client";
import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight, Calendar, Users, Trophy, BookOpen, Zap, Shield, ChevronDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/app/providers";
import { mockStats, mockEvents, mockNotices } from "@/lib/mockData";
import { formatDate, eventTypeIcon, truncate } from "@/lib/utils";

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

function HeroSection() {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const stats = [
    { value: `${mockStats.totalMembers}+`, label: t("hero.stats.members"), icon: "👥" },
    { value: `${mockStats.totalEvents}+`, label: t("hero.stats.events"), icon: "🎪" },
    { value: "33", label: t("hero.stats.years"), icon: "⭐" },
    { value: "12+", label: t("hero.stats.batches"), icon: "🎓" },
  ];

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-visible bg-hero pb-16">
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `linear-gradient(rgba(46,117,182,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(46,117,182,0.5) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-primary/30 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/80 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {t("hero.badge")} · Est. 1992
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="font-heading text-5xl sm:text-7xl md:text-8xl font-black text-white leading-[1.05] mb-4">
          {t("hero.title")}
          <br />
          <span className="bg-gradient-to-r from-yellow-400 to-orange-300 bg-clip-text text-transparent">{t("hero.titleAccent")}</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-lg text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("hero.subtitle")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-16">
          <Link href="/events">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl font-semibold px-8" rightIcon={<ArrowRight className="w-5 h-5" />}>
              {t("hero.cta")}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:border-white/60 px-8">
              {t("hero.ctaSecondary")}
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl mb-0.5 sm:mb-1">{stat.icon}</div>
              <div className="font-heading text-base sm:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-white/50 mt-0.5 sm:mt-1 leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30" aria-hidden>
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const { t } = useLang();
  const features = [
    { icon: <Calendar className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.events.title"), desc: t("features.events.desc") },
    { icon: <Trophy className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.elections.title"), desc: t("features.elections.desc") },
    { icon: <Users className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.community.title"), desc: t("features.community.desc") },
    { icon: <BookOpen className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.notices.title"), desc: t("features.notices.desc") },
    { icon: <Zap className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.volunteers.title"), desc: t("features.volunteers.desc") },
    { icon: <Shield className="w-6 h-6 text-accent dark:text-sky-300" />, title: t("features.finance.title"), desc: t("features.finance.desc") },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="text-center mb-16">
            <span className="badge bg-surface text-accent mb-4 inline-block">{t("features.badge")}</span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-primary dark:text-gray-100">{t("features.title")}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mt-3 max-w-xl mx-auto">{t("features.subtitle")}</p>
          </div>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeInSection key={i} delay={i * 0.07}>
              <div className="group card hover:border-accent/30">
                <div className="w-12 h-12 rounded-xl bg-surface dark:bg-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/10 dark:group-hover:bg-accent/30 transition-colors">{f.icon}</div>
                <h3 className="font-heading text-xl font-semibold text-primary dark:text-sky-200 mb-2">{f.title}</h3>
                <p className="text-gray-400 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsPreview() {
  const { t } = useLang();
  const events = mockEvents.slice(0, 3);
  const eventTypeLabel = (type: string) => t(`events.filter.${type}`) || type;

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="badge bg-accent/10 text-accent mb-3 inline-block">{t("events.upcoming")}</span>
              <h2 className="font-heading text-4xl font-bold text-primary">{t("events.title")}</h2>
            </div>
            <Link href="/events" className="text-sm text-accent hover:text-primary font-medium flex items-center gap-1 transition-colors">
              {t("events.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeInSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <FadeInSection key={event.id} delay={i * 0.1}>
              <Link href={`/events/${event.id}`} className="group block h-full">
                <div className="card h-full group-hover:border-accent/30">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{eventTypeIcon(event.eventType)}</span>
                    <span className="badge bg-surface text-primary capitalize text-xs">{eventTypeLabel(event.eventType)}</span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">{truncate(event.description ?? "", 90)}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(event.eventDate)}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.rsvpCount}/{event.capacity}</span>
                  </div>
                </div>
              </Link>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function NoticesPreview() {
  const { t } = useLang();
  const notices = mockNotices.slice(0, 3);
  const typeColors: Record<string, string> = {
    Election: "bg-purple-100 text-purple-700",
    General: "bg-blue-100 text-blue-700",
    Policy: "bg-orange-100 text-orange-700",
    Membership: "bg-green-100 text-green-700",
    Event: "bg-teal-100 text-teal-700",
  };
  const typeEmoji: Record<string, string> = { Election: "🗳", Policy: "📜", Event: "🎪", Membership: "👥", General: "📢" };
  const noticeTypeLabel = (type: string) => t(`notices.types.${type}`) || type;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection>
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="badge bg-surface text-accent mb-3 inline-block">{t("notices.official")}</span>
              <h2 className="font-heading text-4xl font-bold text-primary">{t("notices.title")}</h2>
            </div>
            <Link href="/notices" className="text-sm text-accent hover:text-primary font-medium flex items-center gap-1 transition-colors">
              {t("notices.allNotices")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeInSection>
        <div className="space-y-4">
          {notices.map((notice, i) => (
            <FadeInSection key={notice.id} delay={i * 0.08}>
              <Link href="/notices" className="group block">
                <div className="flex items-start gap-4 p-5 rounded-xl border border-slate-100 hover:border-accent/30 hover:shadow-card bg-white transition-all duration-200">
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center flex-shrink-0 text-lg">
                    {typeEmoji[notice.noticeType] ?? "📢"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${typeColors[notice.noticeType] ?? "bg-gray-100 text-gray-600"}`}>{noticeTypeLabel(notice.noticeType)}</span>
                      <span className="text-xs text-gray-400">{formatDate(notice.publishedAt)}</span>
                    </div>
                    <h3 className="font-semibold text-primary group-hover:text-accent transition-colors truncate">{notice.title}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{truncate(notice.content, 100)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                </div>
              </Link>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const { t } = useLang();
  return (
    <section className="py-24 bg-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.3) 2px, transparent 0)`, backgroundSize: "50px 50px" }} />
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <FadeInSection>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">{t("cta.title")}</h2>
          <p className="text-lg text-white/55 mb-10 leading-relaxed">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 shadow-2xl" rightIcon={<ArrowRight className="w-5 h-5" />}>{t("auth.register")}</Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8">{t("cta.learnMore")}</Button>
            </Link>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <PageLayout className="pt-0">
      <HeroSection />
      <FeaturesSection />
      <EventsPreview />
      <NoticesPreview />
      <CtaSection />
    </PageLayout>
  );
}
