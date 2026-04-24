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

const ecMembers = [
  { role: "President", name: "TBD – Term 8", icon: "👑" },
  { role: "General Secretary", name: "TBD – Term 8", icon: "📋" },
  { role: "Treasurer", name: "TBD – Term 8", icon: "💰" },
  { role: "Cultural Secretary", name: "TBD – Term 8", icon: "🎭" },
  { role: "Sports Secretary", name: "TBD – Term 8", icon: "⚽" },
  { role: "Publication Secretary", name: "TBD – Term 8", icon: "📰" },
  { role: "IT Secretary", name: "TBD – Term 8", icon: "💻" },
  { role: "Social Service Secretary", name: "TBD – Term 8", icon: "🤝" },
  { role: "Office Secretary", name: "TBD – Term 8", icon: "🗂" },
  { role: "Executive Member", name: "TBD – Term 8", icon: "⭐" },
  { role: "Executive Member", name: "TBD – Term 8", icon: "⭐" },
];

const values = [
  { icon: <Shield className="w-6 h-6" />, title: "Integrity", desc: "Transparent governance and immutable financial records build member trust." },
  { icon: <Eye className="w-6 h-6" />, title: "Transparency", desc: "Every decision, election, and financial record is open to all members." },
  { icon: <Heart className="w-6 h-6" />, title: "Inclusivity", desc: "WCAG-compliant, bilingual portal welcoming students from every batch." },
  { icon: <BookOpen className="w-6 h-6" />, title: "Excellence", desc: "We push academic and extracurricular boundaries together." },
  { icon: <Users className="w-6 h-6" />, title: "Community", desc: "A family of 300+ members united by a love for computer science." },
  { icon: <Star className="w-6 h-6" />, title: "Innovation", desc: "From hackathons to workshops, we foster creative problem-solving." },
];

export default function AboutPage() {
  const { t } = useLang();

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
            <h2 className="font-heading text-3xl font-bold mb-4">Established in 1992</h2>
            <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto">
              For over three decades, the CSEDU Students&apos; Club has been the heartbeat of student life in the Department of Computer Science and Engineering, University of Dhaka — organizing events, conducting elections, and fostering a community of future tech leaders.
            </p>
            <div className="grid grid-cols-3 gap-6 mt-10 max-w-lg mx-auto">
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">33</div>
                <div className="text-white/40 text-sm mt-1">Years Active</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">8</div>
                <div className="text-white/40 text-sm mt-1">EC Terms</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-4xl font-black text-white">11</div>
                <div className="text-white/40 text-sm mt-1">EC Positions</div>
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
              <p className="text-gray-400 mt-3">Term 8 — 2026</p>
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
