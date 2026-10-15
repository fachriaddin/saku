'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR } from '@/services/formatter';
import { BarChart3, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Transaction, Category } from '@/types';

export default function ReportsPage() {
  const transactions: Transaction[] = useLiveQuery(() => financeRepo.getTransactions()) || [];
  const categories: Category[] = useLiveQuery(() => db.categories.toArray()) || [];

  // Fix: Initialize with empty string to prevent SSR prerender mismatch
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  }, []);

  const monthTxs = transactions.filter((tx) => selectedMonth ? tx.date.startsWith(selectedMonth) : true);

  const totalIncome = monthTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = monthTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netSavings = totalIncome - totalExpense;

  const getCategoryName = (catId?: string) => {
    if (!catId) return 'General';
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  const categoryExpenses = monthTxs
    .filter((tx) => tx.type === 'expense' && tx.categoryId)
    .reduce((acc: Record<string, number>, tx) => {
      const catId = tx.categoryId || 'other';
      acc[catId] = (acc[catId] || 0) + tx.amount;
      return acc;
    }, {});

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted">Deep dive into monthly cash flows and breakdowns.</p>
        </div>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Income</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">+{formatIDR(totalIncome)}</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Expenses</span>
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600">-{formatIDR(totalExpense)}</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Net Savings</span>
            <div className={`p-2.5 rounded-2xl ${netSavings >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netSavings >= 0 ? '+' : ''}{formatIDR(netSavings)}
          </p>
        </div>
      </div>

      {/* Detailed Expense Breakdown Table */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Category Expense Distribution
        </h3>
        <div className="divide-y divide-border/60">
          {Object.entries(categoryExpenses).map(([catId, amount]) => {
            const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
            return (
              <div key={catId} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{getCategoryName(catId)}</h4>
                  <p className="text-xs text-muted mt-0.5">{percentage}% of total monthly expenses</p>
                </div>
                <span className="font-extrabold text-sm text-red-600">-{formatIDR(amount)}</span>
              </div>
            );
          })}
          {Object.keys(categoryExpenses).length === 0 && (
            <div className="py-12 text-center text-muted text-sm">
              No expense records found for this month.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
