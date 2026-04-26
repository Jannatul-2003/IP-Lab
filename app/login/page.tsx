"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { setStoredUser } from "@/lib/auth";
import { User } from "@/types";

const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "member@du.ac.bd": { password: "member123", user: { id: "u1", email: "member@du.ac.bd", role: "MEMBER" } },
  "ec@du.ac.bd": { password: "ec123", user: { id: "u2", email: "ec@du.ac.bd", role: "EC_OFFICER" } },
  "president@du.ac.bd": { password: "pres123", user: { id: "u3", email: "president@du.ac.bd", role: "PRESIDENT", ecRole: "President" } },
  "advisor@du.ac.bd": { password: "adv123", user: { id: "u4", email: "advisor@du.ac.bd", role: "FACULTY_ADVISOR" } },
  "admin@du.ac.bd": { password: "admin123", user: { id: "u5", email: "admin@du.ac.bd", role: "SYSTEM_ADMIN" } },
};

export default function LoginPage() {
  const { t } = useLang();
  const { setUser } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!email) errs.email = t("auth.errors.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t("auth.errors.emailInvalid");
    if (!password) errs.password = t("auth.errors.passwordRequired");
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const found = MOCK_USERS[email.toLowerCase()];
    if (!found || found.password !== password) {
      setLoading(false);
      setErrors({ password: t("auth.errors.invalidCredentials") });
      return;
    }

    setStoredUser(found.user, "mock-jwt-token");
    setUser(found.user);
    toast.success(t("auth.loginWelcome"));
    setLoading(false);

    if (found.user.role === "FACULTY_ADVISOR") router.push("/advisor");
    else if (found.user.role === "SYSTEM_ADMIN") router.push("/admin");
    else if (["EC_OFFICER", "PRESIDENT", "SECRETARY"].includes(found.user.role)) router.push("/ec");
    else router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-primary">{t("auth.login")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("auth.loginSubtitle")}</p>
          </div>

          {/* Demo hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6 text-xs text-blue-600 space-y-0.5">
            <p className="font-semibold mb-1">{t("auth.demoAccounts")}</p>
            <p>member@du.ac.bd / member123</p>
            <p>ec@du.ac.bd / ec123</p>
            <p>president@du.ac.bd / pres123</p>
            <p>admin@du.ac.bd / admin123</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField label={t("auth.email")} error={errors.email} required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@student.du.ac.bd"
                error={!!errors.email}
                autoComplete="email"
              />
            </FormField>

            <FormField label={t("auth.password")} error={errors.password} required>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!errors.password}
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPw ? t("auth.hidePassword") : t("auth.showPassword")}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </FormField>

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {t("auth.login")}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-accent hover:underline font-medium">{t("auth.joinNow")}</Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          <Link href="/" className="hover:text-white/70 transition-colors">← {t("auth.backHome")}</Link>
        </p>
      </motion.div>
    </div>
  );
}
