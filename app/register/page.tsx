"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useLang } from "@/app/providers";

interface FormData {
  fullName: string;
  studentId: string;
  email: string;
  batchYear: string;
  phone: string;
  password: string;
  confirmPassword: string;
  constitutionAck: boolean;
}

const INIT: FormData = { fullName: "", studentId: "", email: "", batchYear: "", phone: "", password: "", confirmPassword: "", constitutionAck: false };

export default function RegisterPage() {
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormData>(INIT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set(key: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.studentId.trim()) errs.studentId = "Student ID is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email.";
    if (!form.batchYear) errs.batchYear = "Batch year is required.";
    else if (Number(form.batchYear) < 2000 || Number(form.batchYear) > 2026) errs.batchYear = "Enter a valid batch year.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Minimum 8 characters.";
    if (form.confirmPassword !== form.password) errs.confirmPassword = "Passwords do not match.";
    if (!form.constitutionAck) errs.constitutionAck = "You must acknowledge the constitution.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          studentId: form.studentId,
          batchYear: form.batchYear,
          phone: form.phone,
          constitutionAcknowledged: form.constitutionAck,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setDone(true);
      toast.success("Registration successful! Your account is pending approval.");
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register. Please try again.');
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-primary mb-3">{t("auth.applicationSubmitted")}</h1>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">{t("auth.applicationSubmittedDesc")}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>{t("auth.goHome")}</Button>
            <Button className="flex-1" onClick={() => router.push("/login")}>{t("auth.signIn")}</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent py-20 px-4">
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-primary">{t("auth.register")}</h1>
            <p className="text-gray-400 text-sm mt-1">{t("auth.registerSubtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormField label={t("auth.fullName")} error={errors.fullName} required>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Rezaunnabi Ruhan" error={!!errors.fullName} />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label={t("auth.studentId")} error={errors.studentId} required>
                <Input value={form.studentId} onChange={(e) => set("studentId", e.target.value)} placeholder="21-46558" error={!!errors.studentId} />
              </FormField>
              <FormField label={t("auth.batchYear")} error={errors.batchYear} required>
                <Input type="number" value={form.batchYear} onChange={(e) => set("batchYear", e.target.value)} placeholder="2021" min={2000} max={2026} error={!!errors.batchYear} />
              </FormField>
            </div>

            <FormField label={t("auth.email")} error={errors.email} required>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@student.du.ac.bd" error={!!errors.email} />
            </FormField>

            <FormField label={t("auth.phone")} error={errors.phone}>
              <Input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01711000000" />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t("auth.password")} error={errors.password} required>
                <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 8 chars" error={!!errors.password} />
              </FormField>
              <FormField label={t("auth.confirmPassword")} error={errors.confirmPassword} required>
                <Input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter" error={!!errors.confirmPassword} />
              </FormField>
            </div>

            <div className="flex items-start gap-3 p-4 bg-surface/40 rounded-xl border border-surface-dark">
              <input
                id="constitution"
                type="checkbox"
                checked={form.constitutionAck}
                onChange={(e) => set("constitutionAck", e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-accent cursor-pointer"
                aria-required
              />
              <label htmlFor="constitution" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                {t("auth.constitutionAck")}
              </label>
            </div>
            {errors.constitutionAck && <p className="text-xs text-red-600">{errors.constitutionAck}</p>}

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              {t("auth.submit")}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t("auth.alreadyMember")}{" "}
            <Link href="/login" className="text-accent hover:underline font-medium">{t("auth.signIn")}</Link>
          </p>
        </div>
        <p className="text-center text-white/40 text-xs mt-6">
          <Link href="/" className="hover:text-white/70 transition-colors">{t("auth.backToHome")}</Link>
        </p>
      </motion.div>
    </div>
  );
}
