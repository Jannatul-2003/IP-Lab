"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DollarSign, Plus, CheckCircle, FileText, TrendingDown } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormField, Input, Textarea } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toaster";
import { useAuthContext } from "@/app/providers";
import { mockBudgets, mockExpenditures, mockEvents } from "@/lib/mockData";
import { isEcOfficer } from "@/lib/auth";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import { Budget, Expenditure } from "@/types";

export default function EcFinancePage() {
  const { user, can } = useAuthContext();
  const router = useRouter();
  const toast = useToast();

  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [expenditures, setExpenditures] = useState<Expenditure[]>(mockExpenditures);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [bForm, setBForm] = useState({ totalAmountBdt: "", eventId: "", notes: "" });
  const [eForm, setEForm] = useState({ budgetId: "", amountBdt: "", category: "", description: "", expenseDate: "" });

  if (!user || !isEcOfficer(user.role)) {
    router.push("/dashboard");
    return null;
  }

  const canApprove = can("PRESIDENT") || can("SECRETARY");

  async function createBudget(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const nb: Budget = {
      id: `b${Date.now()}`,
      termId: "t8",
      eventId: bForm.eventId || undefined,
      totalAmountBdt: Number(bForm.totalAmountBdt),
      status: "pending",
    };
    setBudgets((prev) => [...prev, nb]);
    setBForm({ totalAmountBdt: "", eventId: "", notes: "" });
    setLoading(false);
    setBudgetModalOpen(false);
    toast.success("Budget created and pending approval.");
  }

  async function approveBudget() {
    if (!approveTarget) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setBudgets((prev) => prev.map((b) => (b.id === approveTarget.id ? { ...b, status: "approved" as const } : b)));
    setLoading(false);
    setApproveTarget(null);
    toast.success("Budget approved.");
  }

  async function logExpenditure(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const ne: Expenditure = {
      id: `ex${Date.now()}`,
      budgetId: eForm.budgetId,
      amountBdt: Number(eForm.amountBdt),
      category: eForm.category,
      description: eForm.description,
      expenseDate: eForm.expenseDate,
      createdAt: new Date().toISOString(),
    };
    setExpenditures((prev) => [...prev, ne]);
    setEForm({ budgetId: "", amountBdt: "", category: "", description: "", expenseDate: "" });
    setLoading(false);
    setExpenseModalOpen(false);
    toast.success("Expenditure logged.");
  }

  const totalBudget = budgets.filter((b) => b.status === "approved").reduce((sum, b) => sum + b.totalAmountBdt, 0);
  const totalSpent = expenditures.reduce((sum, e) => sum + e.amountBdt, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <PageLayout>
      <div className="pt-20 pb-16 min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <button onClick={() => router.push("/ec")} className="text-xs text-gray-400 hover:text-primary mb-1">← EC Panel</button>
                <h1 className="font-heading text-3xl font-bold text-primary flex items-center gap-3">
                  <DollarSign className="w-7 h-7 text-green-500" />
                  Finance
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" leftIcon={<TrendingDown className="w-4 h-4" />} onClick={() => setExpenseModalOpen(true)} size="sm">
                  Log Expense
                </Button>
                <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setBudgetModalOpen(true)} size="sm">
                  New Budget
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total Approved", value: formatCurrency(totalBudget), color: "text-green-600", icon: "💰" },
                { label: "Total Spent", value: formatCurrency(totalSpent), color: "text-red-500", icon: "📤" },
                { label: "Remaining", value: formatCurrency(remaining), color: remaining >= 0 ? "text-blue-600" : "text-red-600", icon: "💳" },
              ].map((s) => (
                <div key={s.label} className="card text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`font-heading text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Budgets */}
            <div className="card mb-6">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" /> Budgets
              </h2>
              <div className="space-y-3">
                {budgets.map((b) => {
                  const event = mockEvents.find((e) => e.id === b.eventId);
                  const spent = expenditures.filter((ex) => ex.budgetId === b.id).reduce((s, ex) => s + ex.amountBdt, 0);
                  const pct = b.totalAmountBdt > 0 ? Math.min(100, Math.round((spent / b.totalAmountBdt) * 100)) : 0;
                  return (
                    <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-primary text-sm">
                            {event ? event.title : "General Term Budget"}
                          </p>
                          <p className="text-xs text-gray-400">{formatCurrency(b.totalAmountBdt)} allocated · {formatCurrency(spent)} spent</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={b.status === "approved" ? "success" : "warning"}>
                            {b.status}
                          </Badge>
                          {canApprove && b.status === "pending" && (
                            <Button size="sm" variant="success" leftIcon={<CheckCircle className="w-3 h-3" />} onClick={() => setApproveTarget(b)}>
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className={cn("h-1.5 rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-orange-400" : "bg-green-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{pct}% utilised</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expenditures */}
            <div className="card">
              <h2 className="font-heading text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" /> Expenditure Log
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-slate-100">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Description</th>
                      <th className="pb-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenditures.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 text-gray-400 text-xs">{formatDate(ex.expenseDate)}</td>
                        <td className="py-3">
                          <Badge variant="outline">{ex.category}</Badge>
                        </td>
                        <td className="py-3 text-primary">{ex.description}</td>
                        <td className="py-3 text-right font-semibold text-red-500">{formatCurrency(ex.amountBdt)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="pt-3 text-sm font-semibold text-primary">Total</td>
                      <td className="pt-3 text-right font-bold text-red-600">{formatCurrency(totalSpent)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Budget Modal */}
      <Modal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} title="Create New Budget" size="md">
        <form onSubmit={createBudget} className="space-y-4">
          <FormField label="Total Amount (BDT)" required>
            <Input
              type="number"
              min={0}
              value={bForm.totalAmountBdt}
              onChange={(e) => setBForm((p) => ({ ...p, totalAmountBdt: e.target.value }))}
              placeholder="e.g. 25000"
              required
            />
          </FormField>
          <FormField label="Associated Event (optional)">
            <select
              value={bForm.eventId}
              onChange={(e) => setBForm((p) => ({ ...p, eventId: e.target.value }))}
              className="input-field"
            >
              <option value="">General Term Budget</option>
              {mockEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes">
            <Textarea
              value={bForm.notes}
              onChange={(e) => setBForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes for this budget"
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setBudgetModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Create Budget</Button>
          </div>
        </form>
      </Modal>

      {/* Log Expenditure Modal */}
      <Modal isOpen={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} title="Log Expenditure" size="md">
        <form onSubmit={logExpenditure} className="space-y-4">
          <FormField label="Budget" required>
            <select
              value={eForm.budgetId}
              onChange={(e) => setEForm((p) => ({ ...p, budgetId: e.target.value }))}
              required
              className="input-field"
            >
              <option value="">Select budget…</option>
              {budgets.filter((b) => b.status === "approved").map((b) => {
                const ev = mockEvents.find((e) => e.id === b.eventId);
                return <option key={b.id} value={b.id}>{ev ? ev.title : "General Term Budget"} ({formatCurrency(b.totalAmountBdt)})</option>;
              })}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (BDT)" required>
              <Input
                type="number"
                min={1}
                value={eForm.amountBdt}
                onChange={(e) => setEForm((p) => ({ ...p, amountBdt: e.target.value }))}
                placeholder="e.g. 5000"
                required
              />
            </FormField>
            <FormField label="Category" required>
              <select value={eForm.category} onChange={(e) => setEForm((p) => ({ ...p, category: e.target.value }))} required className="input-field">
                <option value="">Select…</option>
                {["Refreshments", "Stationery", "Printing", "Transport", "Equipment", "Venue", "Other"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>
          <FormField label="Description" required>
            <Input
              value={eForm.description}
              onChange={(e) => setEForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of expense"
              required
            />
          </FormField>
          <FormField label="Expense Date" required>
            <Input
              type="date"
              value={eForm.expenseDate}
              onChange={(e) => setEForm((p) => ({ ...p, expenseDate: e.target.value }))}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={loading}>Log Expenditure</Button>
          </div>
        </form>
      </Modal>

      {/* Approve budget confirm */}
      <ConfirmDialog
        isOpen={!!approveTarget}
        onConfirm={approveBudget}
        onCancel={() => setApproveTarget(null)}
        title="Approve Budget?"
        message={`Approve budget of ${approveTarget ? formatCurrency(approveTarget.totalAmountBdt) : ""}? Once approved, expenditures can be logged against it.`}
        confirmLabel="Approve"
        variant="info"
        isLoading={loading}
      />
    </PageLayout>
  );
}
