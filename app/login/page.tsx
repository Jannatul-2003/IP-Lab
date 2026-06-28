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
    if (!email) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email.";
    if (!password) errs.password = "Password is required.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setErrors({ password: data.error || 'Invalid credentials' });
        return;
      }

      // Store user data
      setStoredUser(data.user, 'auth_token');
      setUser(data.user);
      toast.success('Login successful!');
      setLoading(false);

      // Redirect based on role
      if (data.user.role === 'FACULTY_ADVISOR') router.push('/advisor');
      else if (data.user.role === 'SYSTEM_ADMIN') router.push('/admin');
      else if (['EC_OFFICER', 'PRESIDENT', 'SECRETARY'].includes(data.user.role)) router.push('/ec');
      else router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      setErrors({ password: 'Failed to login. Please try again.' });
    }
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

          {/* Demo hint removed - using real authentication */}

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
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </FormField>

            {/* Forgot password link */}
            <div className="flex justify-end -mt-2">
              <Link href="/forgot-password" className="text-xs text-accent hover:underline font-medium">
                {t("auth.forgotPassword")}
              </Link>
            </div>

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
          <Link href="/" className="hover:text-white/70 transition-colors">← Back to Home</Link>
        </p>
      </motion.div>
    </div>
  );
}
