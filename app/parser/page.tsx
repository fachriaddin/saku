'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { financeRepo } from '@/db/repositories/financeRepo';
import { parseIndonesianTransaction, ParsedResult } from '@/services/parser';
import { formatIDR } from '@/services/formatter';
import { Sparkles, Check, ArrowRight, Smartphone } from 'lucide-react';

export default function QuickParsePage() {
  const accounts = useLiveQuery(() => financeRepo.getAccounts()) || [];
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const result = parseIndonesianTransaction(input);
    setParsed(result);

    if (result.accountHint && accounts.length > 0) {
      const matched = accounts.find((a) => a.name.toLowerCase().includes(result.accountHint!));
      setSelectedAccount(matched ? matched.id : accounts[0].id);
    } else if (accounts.length > 0) {
      setSelectedAccount(accounts[0].id);
    }

    if (result.categoryHint && categories.length > 0) {
      const matched = categories.find((c) => c.name.toLowerCase().includes(result.categoryHint!.toLowerCase()));
      setSelectedCategory(matched ? matched.id : categories[0].id);
    } else if (categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsed || !parsed.amount || !selectedAccount) return;

    await financeRepo.addTransaction({
      id: `tx-${Date.now()}`,
      type: parsed.type,
      amount: parsed.amount,
      date: new Date().toISOString(),
      sourceAccountId: selectedAccount,
      categoryId: selectedCategory || undefined,
      description: parsed.description,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setInput('');
      setParsed(null);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Quick Parse Transaction
        </h1>
        <p className="text-sm text-muted">Enter informal Indonesian descriptions like "kopi 18 ribu pakai GoPay".</p>
      </div>

      <form onSubmit={handleParse} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., makan siang 25000, kopi 18 ribu pakai GoPay, bayar parkir 3000 tunai"
            className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary-hover flex items-center justify-center gap-2"
        >
          Parse Text <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Confirmation Preview */}
      {parsed && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-2">Parse Confirmation Preview</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-muted block">Detected Type</span>
              <span className="font-semibold capitalize">{parsed.type}</span>
            </div>
            <div>
              <span className="text-xs text-muted block">Detected Amount</span>
              <span className="font-bold text-primary">
                {parsed.amount ? formatIDR(parsed.amount) : 'Could not detect amount'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Target Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatIDR(a.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConfirmSave}
            disabled={!parsed.amount || savedSuccess}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savedSuccess ? <><Check className="h-4 w-4" /> Transaction Saved!</> : 'Confirm & Save Transaction'}
          </button>
        </div>
      )}

      {/* Apple Shortcuts Integration Card */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" /> iOS Apple Shortcuts Integration
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          PWAs do not have native App Intents or background Siri execution privileges. To quickly open Saku from your iPhone home screen or Lock Screen widget:
        </p>
        <ol className="list-decimal list-inside text-xs text-muted space-y-1">
          <li>Open the <strong>Shortcuts</strong> app on iOS.</li>
          <li>Add action: <strong>Open URL</strong> with your deployed Saku URL (e.g., <code className="bg-muted/20 px-1 rounded text-foreground">https://saku.app/parser</code>).</li>
          <li>Add to Home Screen or Lock Screen widget for 1-tap natural text parsing.</li>
        </ol>
      </div>
    </div>
  );
}