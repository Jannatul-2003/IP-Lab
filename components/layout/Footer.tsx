"use client";
import React from "react";
import Link from "next/link";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import { useLang } from "@/app/providers";

export function Footer() {
  const { t } = useLang();

  const quickLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.about") },
    { href: "/events", label: t("nav.events") },
    { href: "/notices", label: t("nav.notices") },
    { href: "/gallery", label: t("nav.gallery") },
    { href: "/register", label: t("nav.register") },
  ];

  return (
    <footer className="bg-dark text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-14">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold font-heading">
                C
              </div>
              <div>
                <p className="font-heading font-bold text-lg text-white">CSEDUSC</p>
                <p className="text-xs text-white/40">University of Dhaka</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/Jannatul-2003/IP-Lab"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="GitHub"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">
              {t("footer.quickLinks")}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/50">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent/70" />
                {t("footer.address")}
              </li>
              <li className="flex items-center gap-3 text-sm text-white/50">
                <Mail className="w-4 h-4 flex-shrink-0 text-accent/70" />
                <a
                  href={`mailto:${t("footer.email")}`}
                  className="hover:text-white transition-colors"
                >
                  {t("footer.email")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>{t("footer.copyright")}</p>
          <p className="flex items-center gap-1">
            Built by Team Innova-DU
            <ExternalLink className="w-3 h-3" />
          </p>
        </div>
      </div>
    </footer>
  );
}
