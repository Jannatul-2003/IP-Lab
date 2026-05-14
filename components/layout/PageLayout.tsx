import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  noFooter?: boolean;
}

export function PageLayout({ children, className, noFooter }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn("flex-1", className)} id="main-content">
        {children}
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="page-header text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 mt-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-white/70 leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  );
}
