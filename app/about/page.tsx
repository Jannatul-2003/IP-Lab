"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { useLang } from "@/app/providers";
import { Shield, Eye, Heart, BookOpen, Users, Star } from "lucide-react";

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  const { t } = useLang();
  const ecMembers = [
    { role: t("about.roles.president"), name: t("about.tbdTerm"), icon: "👑" },
    { role: t("about.roles.generalSecretary"), name: t("about.tbdTerm"), icon: "📋" },
    { role: t("about.roles.treasurer"), name: t("about.tbdTerm"), icon: "💰" },
    { role: t("about.roles.culturalSecretary"), name: t("about.tbdTerm"), icon: "🎭" },
    { role: t("about.roles.sportsSecretary"), name: t("about.tbdTerm"), icon: "⚽" },
    { role: t("about.roles.publicationSecretary"), name: t("about.tbdTerm"), icon: "📰" },
    { role: t("about.roles.itSecretary"), name: t("about.tbdTerm"), icon: "💻" },
    { role: t("about.roles.socialServiceSecretary"), name: t("about.tbdTerm"), icon: "🤝" },
    { role: t("about.roles.officeSecretary"), name: t("about.tbdTerm"), icon: "🗂" },
    { role: t("about.roles.executiveMember"), name: t("about.tbdTerm"), icon: "⭐" },
    { role: t("about.roles.executiveMember"), name: t("about.tbdTerm"), icon: "⭐" },
  ];
  const values = [
    { icon: <Shield className="w-6 h-6" />, title: t("about.coreValues.integrity.title"), desc: t("about.coreValues.integrity.desc") },
    { icon: <Eye className="w-6 h-6" />, title: t("about.coreValues.transparency.title"), desc: t("about.coreValues.transparency.desc") },
    { icon: <Heart className="w-6 h-6" />, title: t("about.coreValues.inclusivity.title"), desc: t("about.coreValues.inclusivity.desc") },
    { icon: <BookOpen className="w-6 h-6" />, title: t("about.coreValues.excellence.title"), desc: t("about.coreValues.excellence.desc") },
    { icon: <Users className="w-6 h-6" />, title: t("about.coreValues.community.title"), desc: t("about.coreValues.community.desc") },
    { icon: <Star className="w-6 h-6" />, title: t("about.coreValues.innovation.title"), desc: t("about.coreValues.innovation.desc") },
  ];

  return (
    <PageLayout>
      <PageHeader title={t("about.title")} subtitle={t("about.subtitle")} />

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <FadeIn>
              <div className="card border-l-4 border-l-accent h-full">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-primary mb-4">{t("about.mission")}</h2>
                <p className="text-gray-500 leading-relaxed">{t("about.missionText")}</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="card border-l-4 border-l-primary h-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-primary mb-4">{t("about.vision")}</h2>
                <p className="text-gray-500 leading-relaxed">{t("about.visionText")}</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="font-heading text-4xl font-bold text-primary">{t("about.values")}</h2>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="card text-center group hover:border-accent/30">
                  <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4 text-accent group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    {v.icon}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-primary mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* History Banner */}
      <section className="py-16 bg-hero text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="font-heading text-3xl font-bold mb-4">{t("about.history.title")}</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto">
              {t("about.history.text")}
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10 max-w-lg mx-auto">
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">33</div>
                <div className="text-white/40 text-sm mt-1">{t("about.history.yearsActive")}</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">8</div>
                <div className="text-white/40 text-sm mt-1">{t("about.history.ecTerms")}</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">11</div>
                <div className="text-white/40 text-sm mt-1">{t("about.history.ecPositions")}</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* EC Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="font-heading text-4xl font-bold text-primary">{t("about.ec")}</h2>
              <p className="text-gray-400 mt-3">{t("about.ecTerm")}</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ecMembers.map((member, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-accent/30 hover:bg-surface/20 transition-all">
                  <span className="text-2xl flex-shrink-0">{member.icon}</span>
                  <div>
                    <p className="font-semibold text-primary text-sm">{member.role}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{member.name}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
