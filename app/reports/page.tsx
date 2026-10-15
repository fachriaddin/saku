'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR } from '@/services/formatter';
import { backupService } from '@/services/backup';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { Download, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction, Category } from '@/types';

export default function ReportsPage() {
  const transactions: Transaction[] = useLiveQuery(() => financeRepo.getTransactions()) || [];
  const categories: Category[] = useLiveQuery(() => db.categories.toArray()) || [];

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthTxs = transactions.filter((tx) => tx.date.startsWith(selectedMonth));

  const totalIncome = monthTxs
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = monthTxs
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const categoryChartData = categories
    .filter((c) => c.type === 'expense')
    .map((c) => {
      const amount = monthTxs
        .filter((tx) => tx.type === 'expense' && tx.categoryId === c.id)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { name: c.name, amount };
    })
    .filter((item) => item.amount > 0);

  const summaryChartData = [
    { name: 'Income vs Expense', Income: totalIncome, Expense: totalExpenses }
  ];

  const handleExportCSV = async () => {
    await backupService.exportCSV();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted">Analytics and category breakdowns from persisted data.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted/10 shadow-sm"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">Total Income</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">+{formatIDR(totalIncome)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-medium">Total Expenses</span>
            <p className="text-2xl font-bold text-red-600 mt-1">-{formatIDR(totalExpenses)}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Income vs Expense Comparison
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} tickFormatter={(val: number) => `Rp${val / 1000}k`} />
                <Tooltip formatter={(value: any) => [formatIDR(Number(value) || 0), '']} />
                <Legend />
                <Bar dataKey="Income" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Expense" fill="#EF4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Expenses by Category
          </h3>
          <div className="h-64 w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" stroke="#888888" fontSize={12} tickFormatter={(val: number) => `Rp${val / 1000}k`} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} width={100} />
                  <Tooltip formatter={(value: any) => [formatIDR(Number(value) || 0), 'Amount']} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted">
                No expense category data recorded for this month.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}