"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { StatusBadge } from "@/components/ui/Badge";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { mockMembers } from "@/lib/mockData";
import { formatDate, getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const member = mockMembers.find((m) => m.userId === user?.id) ?? mockMembers[0];
  const [phone, setPhone] = useState(member.phone ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) { router.push("/login"); return null; }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success(t("profile.updateSuccess"));
  }

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Profile card */}
            <div className="card">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold font-heading flex-shrink-0">
                  {getInitials(member.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-heading text-2xl font-bold text-primary">{member.fullName}</h1>
                  <p className="text-gray-400 text-sm mt-1">{user.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <RoleBadge role={user.role} />
                    <StatusBadge status={member.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Info fields */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-5">{t("profile.memberInfo")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: t("profile.studentId"), value: member.studentId, locked: true },
                  { label: t("profile.batchYear"), value: String(member.batchYear), locked: true },
                  { label: t("profile.memberSince"), value: member.joinedDate ? formatDate(member.joinedDate) : t("profile.pending"), locked: true },
                  { label: t("profile.status"), value: member.status, locked: true },
                ].map((field) => (
                  <div key={field.label}>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{field.label}</p>
                    <p className="font-medium text-primary">{field.value}</p>
                    {field.locked && <p className="text-xs text-gray-300 mt-0.5">{t("profile.immutableField")}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Editable fields */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-5">{t("profile.editProfile")}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <FormField label={t("auth.phone")} hint={t("profile.phoneHint")}>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711000000"
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                    {t("common.save")}
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
