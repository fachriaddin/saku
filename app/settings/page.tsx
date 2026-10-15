'use client';

import React, { useState } from 'react';
import { backupService } from '@/services/backup';
import { Download, Upload, FileText, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { db } from '@/db/database';

export default function SettingsPage() {
  const [status, setStatus] = useState<string | null>(null);

  const handleExportJSON = async () => {
    await backupService.exportJSON();
    setStatus('JSON backup downloaded successfully.');
  };

  const handleExportCSV = async () => {
    await backupService.exportCSV();
    setStatus('CSV export downloaded successfully.');
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      await backupService.restoreJSON(content);
      setStatus('Backup restored successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      alert('Failed to restore backup. Please ensure it is a valid Saku JSON file.');
    }
  };

  const handleClearData = async () => {
    if (confirm('DANGER: Are you sure you want to erase all financial data? This cannot be undone.')) {
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Privacy</h1>
        <p className="text-sm text-muted">Manage local storage, backups, and privacy parameters.</p>
      </div>

      {status && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
          {status}
        </div>
      )}

      {/* Local Storage Privacy Note */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-sm">
          <h4 className="font-semibold text-foreground">100% Local Browser Storage</h4>
          <p className="text-muted text-xs mt-1">
            Your financial records are saved entirely in your local browser storage via IndexedDB. No backend servers, external APIs, or cloud tracking are used. We recommend exporting JSON backups regularly.
          </p>
        </div>
      </div>

      {/* Backup & Export Actions */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-border pb-3">Backup & Data Management</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/10 font-semibold text-sm"
          >
            <Download className="h-4 w-4 text-primary" /> Export Full Backup (JSON)
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-border bg-background hover:bg-muted/10 font-semibold text-sm"
          >
            <FileText className="h-4 w-4 text-emerald-500" /> Export Transactions (CSV)
          </button>
        </div>

        <div>
          <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-border bg-background hover:bg-muted/10 font-semibold text-sm cursor-pointer">
            <Upload className="h-4 w-4 text-blue-500" /> Restore From JSON
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 shadow-sm space-y-3">
        <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h3>
        <p className="text-xs text-muted">
          Clearing local browser data will delete all recorded accounts, transactions, and budgets stored on this device.
        </p>
        <button
          onClick={handleClearData}
          className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-xs hover:bg-red-700 flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" /> Erase All Local Data
        </button>
      </div>
    </div>
  );
}