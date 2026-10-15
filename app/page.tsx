'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR, formatDate } from '@/services/formatter';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  PieChart, 
  RefreshCw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Transaction, Account, TransactionType } from '@/types';

export default function DashboardPage() {
  const accounts: Account[] = useLiveQuery(() => financeRepo.getAccounts()) || [];
  const transactions: Transaction[] = useLiveQuery(() => financeRepo.getTransactions()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  // Fix: Initialize currentMonth in state/useEffect to prevent SSR dynamic Date mismatch
  const [currentMonth, setCurrentMonth] = useState('');
  const [formattedMonthName, setFormattedMonthName] = useState('');

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.toISOString().slice(0, 7));
    setFormattedMonthName(now.toLocaleString('id-ID', { month: 'long', year: 'numeric' }));
  }, []);

  const currentMonthTxs = transactions.filter((tx: Transaction) => 
    currentMonth ? tx.date.startsWith(currentMonth) : true
  );

  const totalBalance = accounts.reduce((sum: number, a: Account) => sum + a.balance, 0);

  const monthlyIncome = currentMonthTxs
    .filter((tx: Transaction) => tx.type === 'income')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const monthlyExpenses = currentMonthTxs
    .filter((tx: Transaction) => tx.type === 'expense')
    .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const netCashFlow = monthlyIncome - monthlyExpenses;

  const categoryExpensesMap = currentMonthTxs
    .filter((tx: Transaction) => tx.type === 'expense' && tx.categoryId)
    .reduce((acc: Record<string, number>, tx: Transaction) => {
      const catId = tx.categoryId || 'other';
      acc[catId] = (acc[catId] || 0) + tx.amount;
      return acc;
    }, {});

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || isNaN(parsedAmount) || !sourceAccountId) return;

    await financeRepo.addTransaction({
      id: `tx-${Date.now()}`,
      type,
      amount: parsedAmount,
      date: new Date().toISOString(),
      sourceAccountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      description,
    });

    setAmount('');
    setDescription('');
    setIsOpen(false);
  };

  const getAccountName = (id: string) => accounts.find((a: Account) => a.id === id)?.name || 'Account';
  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name || 'General';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Offline & Private
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Saku Dashboard</h1>
            <p className="text-blue-100 text-sm mt-1">
              Financial summary for {formattedMonthName || 'this month'}
            </p>
          </div>
          <button
            onClick={() => {
              if (accounts.length > 0) {
                setSourceAccountId(accounts[0].id);
                if (accounts.length > 1) setDestinationAccountId(accounts[1].id);
              }
              setIsOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-blue-600 font-bold text-sm shadow-lg hover:bg-blue-50 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Quick Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Total Net Worth</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold tracking-tight">{formatIDR(totalBalance)}</p>
          <p className="text-xs text-muted mt-2">Across all active accounts</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Monthly Income</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-emerald-600">+{formatIDR(monthlyIncome)}</p>
          <p className="text-xs text-muted mt-2">Inflow this month</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Monthly Expenses</span>
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-red-600">-{formatIDR(monthlyExpenses)}</p>
          <p className="text-xs text-muted mt-2">Outflow this month</p>
        </div>

        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Net Cash Flow</span>
            <div className={`p-2.5 rounded-2xl ${netCashFlow >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <p className={`text-2xl font-extrabold tracking-tight ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {netCashFlow >= 0 ? '+' : ''}{formatIDR(netCashFlow)}
          </p>
          <p className="text-xs text-muted mt-2">Income minus expenses</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Recent Transactions</h3>
            <span className="text-xs text-muted font-medium">Latest activity</span>
          </div>
          <div className="divide-y divide-border/60">
            {transactions.slice(0, 5).map((tx: Transaction) => (
              <div key={tx.id} className="py-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${
                    tx.type === 'income' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                    tx.type === 'expense' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-600'
                  }`}>
                    {tx.type === 'income' && <ArrowDownRight className="h-5 w-5" />}
                    {tx.type === 'expense' && <ArrowUpRight className="h-5 w-5" />}
                    {tx.type === 'transfer' && <RefreshCw className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {tx.type === 'transfer'
                        ? `Transfer to ${getAccountName(tx.destinationAccountId || '')}`
                        : tx.description || getCategoryName(tx.categoryId)}
                    </h4>
                    <p className="text-xs text-muted mt-0.5">{formatDate(tx.date)} • {getAccountName(tx.sourceAccountId)}</p>
                  </div>
                </div>
                <span className={`font-extrabold text-sm ${
                  tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : 'text-foreground'
                }`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatIDR(tx.amount)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 text-muted text-sm">No transactions recorded yet.</div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <h3 className="font-bold text-lg mb-6">Category Breakdown</h3>
          <div className="space-y-5">
            {Object.entries(categoryExpensesMap).map(([catId, amount]) => {
              const catName = getCategoryName(catId);
              const percentage = monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0;
              return (
                <div key={catId}>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span>{catName}</span>
                    <span className="font-bold">{formatIDR(amount)} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted/15 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(categoryExpensesMap).length === 0 && (
              <div className="text-center py-12 text-muted text-sm">No expenses recorded this month.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-3xl p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Quick Add Transaction
            </h3>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2.5 text-xs font-bold capitalize rounded-2xl border transition-all ${
                        type === t ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'border-border text-muted hover:bg-muted/10'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Amount (IDR)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 25000"
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Account</label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {accounts.map((a: Account) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {type !== 'transfer' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.filter((c) => c.type === type).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Kopi Senja"
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
                  className="px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}