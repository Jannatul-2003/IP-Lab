"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DollarSign, Plus, CheckCircle, FileText, TrendingDown, Download } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext, useLang } from "@/app/providers";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export";

const EXPENSE_CATEGORIES = ["Refreshments", "Stationery", "Printing", "Transport", "Equipment", "Venue", "Other"];

export default function EcFinancePage() {
  const { user, can } = useAuthContext();
  const { t } = useLang();
  const router = useRouter();
  const toast = useToast();

  const [budgets, setBudgets] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [termId, setTermId] = useState<string>("");
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [bForm, setBForm] = useState({ totalAmountBdt: "", eventId: "", notes: "" });
  const [eForm, setEForm] = useState({ budgetId: "", amountBdt: "", category: "", description: "", expenseDate: "" });

  useEffect(() => {
    if (!user || !isEcOfficer(user.role)) { router.push("/dashboard"); return; }
    fetch("/api/terms")
      .then((r) => r.json())
      .then((termsData) => {
        const terms: any[] = termsData.data || [];
        const activeTerm = terms.find((t) => t.status === "active") || terms[0];
        const currentTermId = activeTerm?.id || "";
        setTermId(currentTermId);
        return Promise.all([
          fetch(`/api/finance/budgets${currentTermId ? `?termId=${currentTermId}` : ""}`).then((r) => r.json()),
          fetch(`/api/finance/expenditures`).then((r) => r.json()),
          fetch(`/api/events?status=PUBLISHED&limit=50`).then((r) => r.json()),
        ]);
      })
      .then(([budgetsData, expendituresData, eventsData]) => {
        setBudgets(budgetsData.data || []);
        setExpenditures(expendituresData.data || []);
        setEvents(eventsData.data || []);
      })
      .catch(console.error)
      .finally(() => setFetchLoading(false));
  }, [user, router]);

  if (!user || !isEcOfficer(user.role)) return null;

  const canApprove = can("PRESIDENT") || can("SECRETARY");

  async function createBudget(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termId, totalAmountBdt: bForm.totalAmountBdt, eventId: bForm.eventId || undefined, notes: bForm.notes }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create budget"); return; }
      setBudgets((prev) => [data, ...prev]);
      setBForm({ totalAmountBdt: "", eventId: "", notes: "" });
      setBudgetModalOpen(false);
      toast.success("Budget created.");
    } catch { toast.error("Failed to create budget."); }
    finally { setLoading(false); }
  }

  async function approveBudget() {
    if (!approveTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/budgets/${approveTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to approve"); return; }
      setBudgets((prev) => prev.map((b) => b.id === approveTarget.id ? { ...b, status: "approved" } : b));
      toast.success("Budget approved.");
    } catch { toast.error("Failed to approve budget."); }
    finally { setLoading(false); setApproveTarget(null); }
  }

  async function logExpenditure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/finance/expenditures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eForm),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to log expenditure"); return; }
      setExpenditures((prev) => [data, ...prev]);
      setEForm({ budgetId: "", amountBdt: "", category: "", description: "", expenseDate: "" });
      setExpenseModalOpen(false);
      toast.success("Expenditure logged.");
    } catch { toast.error("Failed to log expenditure."); }
    finally { setLoading(false); }
  }

  const totalBudget = budgets.filter((b) => b.status === "approved").reduce((s, b) => s + b.total_amount_bdt, 0);
  const totalSpent = expenditures.reduce((s, e) => s + e.amount_bdt, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">{t("ecPanel.backToPanel")}</button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <DollarSign className="w-7 h-7 text-green-500" />
                  {t("finance.title")}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 border-r border-slate-200 pr-2">
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportToCSV(expenditures.map((e) => ({ ...e, amountBdt: e.amount_bdt, expenseDate: e.expense_date })), budgets.map((b) => ({ ...b, totalAmountBdt: b.total_amount_bdt })), `finance-${new Date().toISOString().split("T")[0]}.csv`)}>CSV</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportToExcel(expenditures.map((e) => ({ ...e, amountBdt: e.amount_bdt })), budgets.map((b) => ({ ...b, totalAmountBdt: b.total_amount_bdt })), `finance-${new Date().toISOString().split("T")[0]}.xlsx`)}>Excel</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => exportToPDF(expenditures.map((e) => ({ ...e, amountBdt: e.amount_bdt })), budgets.map((b) => ({ ...b, totalAmountBdt: b.total_amount_bdt })), totalSpent, `finance-${new Date().toISOString().split("T")[0]}.pdf`)}>PDF</Button>
                </div>
                <Button variant="ghost" leftIcon={<TrendingDown className="w-4 h-4" />} onClick={() => setExpenseModalOpen(true)} size="sm">{t("ecPanel.finance.logExpense")}</Button>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setBudgetModalOpen(true)} size="sm">{t("ecPanel.finance.newBudget")}</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: t("ecPanel.finance.totalApproved"), value: formatCurrency(totalBudget), color: "text-green-600", icon: "💰" },
                { label: t("ecPanel.finance.totalSpent"), value: formatCurrency(totalSpent), color: "text-red-500", icon: "📤" },
                { label: t("ecPanel.finance.remaining"), value: formatCurrency(remaining), color: remaining >= 0 ? "text-blue-600" : "text-red-600", icon: "💳" },
              ].map((s) => (
                <div key={s.label} className="card text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {fetchLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <>
                <div className="card mb-6">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" /> {t("finance.budgets")}
                  </h2>
                  <div className="space-y-3">
                    {budgets.map((b) => {
                      const event = events.find((e) => e.id === b.event_id);
                      const spent = expenditures.filter((ex) => ex.budget_id === b.id).reduce((s, ex) => s + ex.amount_bdt, 0);
                      const pct = b.total_amount_bdt > 0 ? Math.min(100, Math.round((spent / b.total_amount_bdt) * 100)) : 0;
                      return (
                        <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-primary text-sm">{event ? event.title : t("ecPanel.finance.generalTermBudget")}</p>
                              <p className="text-xs text-gray-400">{formatCurrency(b.total_amount_bdt)} {t("ecPanel.finance.allocated")} · {formatCurrency(spent)} {t("ecPanel.finance.spent")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={b.status === "approved" ? "success" : "warning"}>{b.status === "approved" ? t("ecPanel.finance.approved") : t("ecPanel.finance.pending")}</Badge>
                              {canApprove && b.status === "pending" && (
                                <Button size="sm" variant="success" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => setApproveTarget(b)}>{t("finance.approve")}</Button>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div className={cn("h-1.5 rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-orange-400" : "bg-green-500")} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{pct}{t("ecPanel.finance.utilised")}</p>
                        </div>
                      );
                    })}
                    {budgets.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No budgets yet.</p>}
                  </div>
                </div>

                <div className="card">
                  <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" /> {t("ecPanel.finance.expenditureLog")}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-slate-100">
                          <th className="pb-3 font-medium">{t("ecPanel.finance.date")}</th>
                          <th className="pb-3 font-medium">{t("ecPanel.finance.category")}</th>
                          <th className="pb-3 font-medium">{t("ecPanel.finance.description")}</th>
                          <th className="pb-3 font-medium text-right">{t("finance.totalBudget")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {expenditures.map((ex) => (
                          <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(ex.expense_date)}</td>
                            <td className="py-3"><Badge variant="outline">{ex.category}</Badge></td>
                            <td className="py-3 text-primary">{ex.description}</td>
                            <td className="py-3 text-right font-semibold text-red-500 whitespace-nowrap">{formatCurrency(ex.amount_bdt)}</td>
                          </tr>
                        ))}
                      </tbody>
                      {expenditures.length > 0 && (
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td colSpan={3} className="pt-3 text-sm font-semibold text-primary">{t("ecPanel.finance.total")}</td>
                            <td className="pt-3 text-right font-bold text-red-600">{formatCurrency(totalSpent)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                    {expenditures.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No expenditures logged yet.</p>}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <Modal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title={t("ecPanel.finance.createBudgetTitle")} size="md">
        <form onSubmit={createBudget} className="space-y-4">
          <FormField label={t("ecPanel.finance.totalAmountLabel")} required>
            <Input type="number" min={0} value={bForm.totalAmountBdt} onChange={(e) => setBForm((p) => ({ ...p, totalAmountBdt: e.target.value }))} placeholder="e.g. 25000" required />
          </FormField>
          <FormField label={t("ecPanel.finance.associatedEvent")}>
            <select value={bForm.eventId} onChange={(e) => setBForm((p) => ({ ...p, eventId: e.target.value }))} className="input-field">
              <option value="">{t("ecPanel.finance.generalBudgetOption")}</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </FormField>
          <FormField label={t("ecPanel.finance.notes")}>
            <Textarea value={bForm.notes} onChange={(e) => setBForm((p) => ({ ...p, notes: e.target.value }))} placeholder={t("ecPanel.finance.notesPlaceholder")} rows={3} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setBudgetModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" isLoading={loading}>{t("ecPanel.finance.createBudgetTitle")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title={t("ecPanel.finance.logExpenseTitle")} size="md">
        <form onSubmit={logExpenditure} className="space-y-4">
          <FormField label={t("ecPanel.finance.budget")} required>
            <select value={eForm.budgetId} onChange={(e) => setEForm((p) => ({ ...p, budgetId: e.target.value }))} required className="input-field">
              <option value="">{t("ecPanel.finance.selectBudget")}</option>
              {budgets.filter((b) => b.status === "approved").map((b) => {
                const ev = events.find((e) => e.id === b.event_id);
                return <option key={b.id} value={b.id}>{ev ? ev.title : t("ecPanel.finance.generalBudgetOption")} ({formatCurrency(b.total_amount_bdt)})</option>;
              })}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t("ecPanel.finance.amountLabel")} required>
              <Input type="number" min={1} value={eForm.amountBdt} onChange={(e) => setEForm((p) => ({ ...p, amountBdt: e.target.value }))} placeholder="e.g. 5000" required />
            </FormField>
            <FormField label={t("ecPanel.finance.category")} required>
              <select value={eForm.category} onChange={(e) => setEForm((p) => ({ ...p, category: e.target.value }))} required className="input-field">
                <option value="">{t("ecPanel.finance.selectCategory")}</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label={t("ecPanel.finance.description")} required>
            <Input value={eForm.description} onChange={(e) => setEForm((p) => ({ ...p, description: e.target.value }))} placeholder={t("ecPanel.finance.descriptionPlaceholder")} required />
          </FormField>
          <FormField label={t("ecPanel.finance.expenseDate")} required>
            <Input type="date" value={eForm.expenseDate} onChange={(e) => setEForm((p) => ({ ...p, expenseDate: e.target.value }))} required />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setExpenseModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" isLoading={loading}>{t("finance.logExpenditure")}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!approveTarget} onConfirm={approveBudget} onCancel={() => setApproveTarget(null)} title={t("ecPanel.finance.approveBudgetTitle")} message={`${approveTarget ? formatCurrency(approveTarget.total_amount_bdt) : ""}? ${t("ecPanel.finance.approveMessage")}`} confirmLabel={t("ecPanel.finance.approveConfirm")} variant="info" isLoading={loading} />
    </PageLayout>
  );
}
