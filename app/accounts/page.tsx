'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { formatIDR } from '@/services/formatter';
import { Wallet, Plus, Trash2, Building2, CreditCard, Banknote } from 'lucide-react';
import { AccountType } from '@/types';

export default function AccountsPage() {
  const accounts = useLiveQuery(() => financeRepo.getAccounts()) || [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [openingBalance, setOpeningBalance] = useState('');

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceInt = parseInt(openingBalance || '0', 10);
    if (!name || isNaN(balanceInt)) return;

    await financeRepo.addAccount({
      id: `acc-${Date.now()}`,
      name,
      type,
      balance: balanceInt,
      openingBalance: balanceInt,
      currency: 'IDR',
      isArchived: false,
    });

    setName('');
    setOpeningBalance('');
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this account and all its associated transactions?')) {
      await financeRepo.deleteAccount(id);
    }
  };

  const getIcon = (t: AccountType) => {
    switch (t) {
      case 'cash': return <Banknote className="h-5 w-5 text-emerald-500" />;
      case 'bank': return <Building2 className="h-5 w-5 text-blue-500" />;
      case 'ewallet': return <CreditCard className="h-5 w-5 text-purple-500" />;
      default: return <Wallet className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts & Wallets</h1>
          <p className="text-sm text-muted">Manage your cash, bank accounts, and e-wallets.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:bg-primary-hover transition-all"
        >
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <p className="text-sm font-medium text-muted">Total Net Worth</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">{formatIDR(totalBalance)}</p>
      </div>

      {/* Account List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-muted/10 border border-border">
                  {getIcon(acc.type)}
                </div>
                <div>
                  <h3 className="font-semibold">{acc.name}</h3>
                  <span className="text-xs uppercase tracking-wider text-muted font-medium">{acc.type}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(acc.id)}
                className="text-muted hover:text-red-500 transition-colors p-1"
                title="Delete Account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-xs text-muted">Balance</span>
              <span className="font-bold text-lg">{formatIDR(acc.balance)}</span>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted">
            No accounts created yet. Click "Add Account" to get started.
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4">Add New Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., BCA, GoPay, Cash"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash Wallet</option>
                  <option value="ewallet">E-Wallet (GoPay/OVO/Dana)</option>
                  <option value="savings">Savings</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Opening Balance (IDR)</label>
                <input
                  type="number"
                  required
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="e.g., 1000000"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary-hover"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}