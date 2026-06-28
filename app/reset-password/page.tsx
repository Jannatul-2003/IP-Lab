"use client";
import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, CheckCircle, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useLang } from "@/app/providers";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const linkInvalid = !token || !email;

  function validate() {
    const errs: Record<string, string> = {};
    if (!newPassword) errs.newPassword = t("resetPassword.passwordRequired");
    else if (newPassword.length < 8) errs.newPassword = t("resetPassword.passwordTooShort");
    if (!confirmPassword) errs.confirmPassword = t("resetPassword.confirmRequired");
    else if (newPassword !== confirmPassword) errs.confirmPassword = t("resetPassword.passwordsMismatch");
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("resetPassword.failed"));
        return;
      }
      setDone(true);
      toast.success(t("resetPassword.success"));
    } catch {
      toast.error(t("resetPassword.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
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
          {linkInvalid ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="font-heading text-xl font-bold text-primary dark:text-white">
                {t("resetPassword.invalidLink")}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">{t("resetPassword.invalidLinkDesc")}</p>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-medium mt-2">
                <ArrowLeft className="w-4 h-4" /> {t("resetPassword.requestNewLink")}
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-heading text-xl font-bold text-primary dark:text-white">
                {t("resetPassword.success")}
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">{t("resetPassword.successDesc")}</p>
              <Button onClick={() => router.push("/login")} className="w-full" size="lg">
                {t("resetPassword.goToLogin")}
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 dark:bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-accent" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-primary dark:text-white">
                  {t("resetPassword.title")}
                </h1>
                <p className="text-gray-400 text-sm mt-1">{t("resetPassword.subtitle")}</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <FormField label={t("resetPassword.newPassword")} error={errors.newPassword} required>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: "" })); }}
                      placeholder="••••••••"
                      error={!!errors.newPassword}
                      autoComplete="new-password"
                      className="pr-11"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPw ? "Hide password" : "Show password"}>
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </FormField>

                <FormField label={t("resetPassword.confirmNewPassword")} error={errors.confirmPassword} required>
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                      placeholder="••••••••"
                      error={!!errors.confirmPassword}
                      autoComplete="new-password"
                      className="pr-11"
                    />
                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showConfirmPw ? "Hide password" : "Show password"}>
                      {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </FormField>

                <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                  {t("resetPassword.submit")}
                </Button>
              </form>

              <Link href="/login" className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-400 hover:text-primary dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" /> {t("forgotPassword.backToSignIn")}
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
