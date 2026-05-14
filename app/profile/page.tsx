"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Save, Lock, Mail, Phone } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/Badge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { mockMembers } from "@/lib/mockData";
import { formatDate, getInitials } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?880|0)1[3-9]\d{8}$/;

interface PwForm {
  current: string;
  next: string;
  confirm: string;
}

interface PwErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const member = mockMembers.find((m) => m.userId === user?.id) ?? mockMembers[0];

  // Editable fields
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [infoSaving, setInfoSaving] = useState(false);

  // Password change
  const [pw, setPw] = useState<PwForm>({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<PwErrors>({});
  const [pwSaving, setPwSaving] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  if (!user) { router.push("/login"); return null; }

  // ── Save contact info ──────────────────────────────────────────
  function validateInfo(): boolean {
    let ok = true;
    if (!EMAIL_RE.test(email)) { setEmailError("Enter a valid email address."); ok = false; }
    else setEmailError("");
    if (phone && !PHONE_RE.test(phone)) { setPhoneError("Enter a valid BD phone number (e.g. 01711000000)."); ok = false; }
    else setPhoneError("");
    return ok;
  }

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validateInfo()) return;
    setInfoSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setInfoSaving(false);
    toast.success("Contact information updated.");
  }

  // ── Change password ────────────────────────────────────────────
  function validatePw(): boolean {
    const errs: PwErrors = {};
    if (!pw.current) errs.current = "Current password is required.";
    if (!pw.next) errs.next = "New password is required.";
    else if (pw.next.length < 8) errs.next = "Password must be at least 8 characters.";
    if (pw.next !== pw.confirm) errs.confirm = "Passwords do not match.";
    setPwErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handlePwSave(e: React.FormEvent) {
    e.preventDefault();
    if (!validatePw()) return;
    setPwSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setPwSaving(false);
    setPw({ current: "", next: "", confirm: "" });
    setPwErrors({});
    toast.success("Password changed successfully.");
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50 dark:bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* ── Profile header ── */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold font-heading flex-shrink-0">
                  {getInitials(member.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-heading text-2xl font-bold text-primary dark:text-white">{member.fullName}</h1>
                  <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <RoleBadge role={user.role} />
                    <StatusBadge status={member.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Immutable member info ── */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="font-heading text-lg font-semibold text-primary dark:text-white mb-5">
                Member Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Student ID",   value: member.studentId },
                  { label: "Batch Year",   value: String(member.batchYear) },
                  { label: "Member Since", value: member.joinedDate ? formatDate(member.joinedDate) : "Pending" },
                  { label: "Status",       value: member.status },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{field.label}</p>
                    <p className="font-medium text-primary dark:text-gray-200">{field.value}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Immutable field</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Edit contact info ── */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="font-heading text-lg font-semibold text-primary dark:text-white mb-5">
                Edit Profile
              </h2>
              <form onSubmit={handleInfoSave} noValidate className="space-y-4">
                {/* Email */}
                <FormField
                  label={t("auth.email")}
                  error={emailError}
                  hint="Used for EC communications and login."
                >
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

                {/* Phone */}
                <FormField
                  label={t("auth.phone")}
                  error={phoneError}
                  hint="Contact number for EC communications."
                >
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
                      placeholder="01711000000"
                      error={!!phoneError}
                      className="pl-9"
                    />
                  </div>
                </FormField>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={infoSaving} leftIcon={<Save className="w-4 h-4" />}>
                    {t("common.save")} Changes
                  </Button>
                </div>
              </form>
            </div>

            {/* ── Change password ── */}
            <div className="card dark:bg-gray-800 dark:border-gray-700">
              <h2 className="font-heading text-lg font-semibold text-primary dark:text-white mb-1">
                Change Password
              </h2>
              <p className="text-xs text-gray-400 mb-5">Leave blank if you don&apos;t want to change your password.</p>
              <form onSubmit={handlePwSave} noValidate className="space-y-4">
                {(["current", "next", "confirm"] as const).map((field) => {
                  const labels = { current: "Current Password", next: "New Password", confirm: "Confirm New Password" };
                  const placeholders = { current: "••••••••", next: "Min. 8 characters", confirm: "••••••••" };
                  return (
                    <FormField key={field} label={labels[field]} error={pwErrors[field]}>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showPw[field] ? "text" : "password"}
                          value={pw[field]}
                          onChange={(e) => {
                            setPw((p) => ({ ...p, [field]: e.target.value }));
                            setPwErrors((p) => ({ ...p, [field]: undefined }));
                          }}
                          placeholder={placeholders[field]}
                          error={!!pwErrors[field]}
                          autoComplete={field === "current" ? "current-password" : "new-password"}
                          className="pl-9 pr-11"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((s) => ({ ...s, [field]: !s[field] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                          aria-label={showPw[field] ? "Hide" : "Show"}
                        >
                          {showPw[field] ? "Hide" : "Show"}
                        </button>
                      </div>
                    </FormField>
                  );
                })}
                <div className="flex justify-end">
                  <Button type="submit" isLoading={pwSaving} leftIcon={<Lock className="w-4 h-4" />}>
                    Update Password
                  </Button>
                </div>
              </form>
            </div>

          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
}
