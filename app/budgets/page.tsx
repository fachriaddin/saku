'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR } from '@/services/formatter';
import { Plus, Trash2, PieChart, AlertCircle } from 'lucide-react';
import { Transaction, Budget, Category } from '@/types';

export default function BudgetsPage() {
  const categories: Category[] = useLiveQuery(() => db.categories.toArray()) || [];
  const budgets: Budget[] = useLiveQuery(() => db.budgets.toArray()) || [];
  const transactions: Transaction[] = useLiveQuery(() => financeRepo.getTransactions()) || [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('total');
  const [amount, setAmount] = useState('');
  
  const [currentMonth, setCurrentMonth] = useState('');
  const [monthName, setMonthName] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.toISOString().slice(0, 7));
    setMonthName(now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }));
  }, []);

  const currentMonthExpenses = transactions.filter(
    (tx) => currentMonth && tx.type === 'expense' && tx.date.startsWith(currentMonth)
  );

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || isNaN(parsedAmount) || !currentMonth) return;

    const categoryId = selectedCategory === 'total' ? undefined : selectedCategory;
    const now = new Date().toISOString();

    const existing = budgets.find(
      (b) => b.month === currentMonth && b.categoryId === categoryId
    );

    if (existing) {
      await db.budgets.update(existing.id, {
        amount: parsedAmount,
        updatedAt: now,
      });
    } else {
      await db.budgets.add({
        id: `budget-${Date.now()}`,
        categoryId,
        amount: parsedAmount,
        month: currentMonth,
        createdAt: now,
        updatedAt: now,
      });
    }

    setAmount('');
    setIsOpen(false);
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Delete this budget target?')) {
      await db.budgets.delete(id);
    }
  };

  const getCategoryName = (catId?: string) => {
    if (!catId) return 'Total Monthly Budget';
    return categories.find((c) => c.id === catId)?.name || 'Category';
  };

  const calculateSpent = (catId?: string) => {
    if (!catId) {
      return currentMonthExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    }
    return currentMonthExpenses
      .filter((tx) => tx.categoryId === catId)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monthly Budgets</h1>
          <p className="text-sm text-muted">Set and track spending limits for {monthName || 'this month'}.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
        >
          <Plus className="h-4 w-4" /> Set Budget Target
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {budgets.filter((b) => b.month === currentMonth).map((b) => {
          const spent = calculateSpent(b.categoryId);
          const percentage = Math.min(Math.round((spent / b.amount) * 100), 100);
          const isOver = spent > b.amount;

          return (
            <div key={b.id} className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl border ${isOver ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">{getCategoryName(b.categoryId)}</h3>
                    <p className="text-xs text-muted font-medium mt-0.5">Target: {formatIDR(b.amount)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBudget(b.id)}
                  className="text-muted hover:text-red-500 p-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Spent: {formatIDR(spent)}</span>
                  <span className={isOver ? 'text-red-600 font-extrabold' : 'text-muted'}>
                    {percentage}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-primary'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {isOver && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-bold bg-red-500/10 p-3 rounded-2xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Exceeded target budget by {formatIDR(spent - b.amount)}</span>
                </div>
              )}
            </div>
          );
        })}

        {budgets.filter((b) => b.month === currentMonth).length === 0 && (
          <div className="col-span-full text-center py-12 text-muted text-sm bg-card border border-border rounded-3xl">
            No budget targets created for this month. Click "Set Budget Target" to start tracking.
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-3xl p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold mb-5">Set Budget Target</h3>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Budget Target Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="total">Overall Monthly Expense Budget</option>
                  {categories.filter((c) => c.type === 'expense').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Monthly Limit Amount (IDR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 2000000"
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-3 rounded-2xl border border-border text-sm font-bold hover:bg-muted/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}