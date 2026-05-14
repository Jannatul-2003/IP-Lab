"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useLang } from "@/app/providers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate(): boolean {
    if (!email.trim()) { setEmailError("Email is required."); return false; }
    if (!EMAIL_RE.test(email)) { setEmailError("Enter a valid email address."); return false; }
    setEmailError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate API call — replace with real endpoint
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSent(true);
    toast.success("Reset link sent! Check your inbox.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {sent ? (
            /* ── Success state ── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-heading text-xl font-bold text-primary dark:text-white">
                Check your inbox
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-400 leading-relaxed">
                We&apos;ve sent a password reset link to{" "}
                <strong className="text-primary dark:text-white">{email}</strong>.
                The link expires in <strong>30 minutes</strong>.
              </p>
              <p className="text-xs text-gray-400">
                Didn&apos;t receive it?{" "}
                <button
                  onClick={() => { setSent(false); }}
                  className="text-accent hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-primary dark:text-white">
                  {t("auth.forgotPassword")}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Enter your registered email and we&apos;ll send a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <FormField label={t("auth.email")} error={emailError} required>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      placeholder="you@student.du.ac.bd"
                      error={!!emailError}
                      autoComplete="email"
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400 hover:text-primary dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          <Link href="/" className="hover:text-white/70 transition-colors">← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
