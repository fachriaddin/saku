'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR, formatDate } from '@/services/formatter';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, RefreshCw, Search, Filter } from 'lucide-react';
import { TransactionType } from '@/types';

export default function TransactionsPage() {
  const accounts = useLiveQuery(() => financeRepo.getAccounts()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];
  const transactions = useLiveQuery(() => financeRepo.getTransactions()) || [];

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = !search || tx.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || isNaN(parsedAmount) || !sourceAccountId) return;

    if (type === 'transfer' && (!destinationAccountId || sourceAccountId === destinationAccountId)) {
      alert('Transfers require distinct source and destination accounts.');
      return;
    }

    await financeRepo.addTransaction({
      id: `tx-${Date.now()}`,
      type,
      amount: parsedAmount,
      date: new Date(date || Date.now()).toISOString(),
      sourceAccountId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : undefined,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      description,
    });

    setAmount('');
    setDescription('');
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction? Account balances will be recalculated.')) {
      await financeRepo.deleteTransaction(id);
    }
  };

  const getCategoryName = (id?: string) => {
    if (!id) return 'General';
    return categories.find((c) => c.id === id)?.name || 'General';
  };

  const getAccountName = (id: string) => {
    return accounts.find((a) => a.id === id)?.name || 'Unknown Account';
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted">View, search, and manage all financial movements.</p>
        </div>
        <button
          onClick={() => {
            if (accounts.length > 0) {
              setSourceAccountId(accounts[0].id);
              if (accounts.length > 1) setDestinationAccountId(accounts[1].id);
            }
            setIsOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-border bg-card text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
            <option value="transfer">Transfers</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border/60">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-muted/5 transition-colors">
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
                  <h4 className="font-bold text-sm sm:text-base">
                    {tx.type === 'transfer'
                      ? `Transfer: ${getAccountName(tx.sourceAccountId)} → ${getAccountName(tx.destinationAccountId || '')}`
                      : tx.description || getCategoryName(tx.categoryId)}
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDate(tx.date)} • {getAccountName(tx.sourceAccountId)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-extrabold text-sm sm:text-base ${
                  tx.type === 'income' ? 'text-emerald-600' : tx.type === 'expense' ? 'text-red-600' : 'text-foreground'
                }`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatIDR(tx.amount)}
                </span>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="text-muted hover:text-red-500 p-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center text-muted text-sm">
              No transactions recorded yet.
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-3xl p-7 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold mb-5">Record Transaction</h3>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                  {type === 'transfer' ? 'From Account' : 'Account'}
                </label>
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({formatIDR(a.balance)})</option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">To Account</label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({formatIDR(a.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

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
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Note / Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Makan siang Nasi Padang"
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