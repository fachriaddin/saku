import { db } from '@/db/database';
import { AppBackup } from '@/types';

export const backupService = {
  async exportJSON(): Promise<void> {
    const accounts = await db.accounts.toArray();
    const transactions = await db.transactions.toArray();
    const categories = await db.categories.toArray();
    const budgets = await db.budgets.toArray();

    const backupData: AppBackup = {
      version: 1,
      timestamp: new Date().toISOString(),
      accounts,
      transactions,
      categories,
      budgets,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saku-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportCSV(): Promise<void> {
    const transactions = await db.transactions.toArray();
    const headers = ['ID', 'Type', 'Amount (IDR)', 'Date', 'Description', 'SourceAccountId'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.amount,
      t.date,
      `"${t.description || ''}"`,
      t.sourceAccountId,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saku-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async restoreJSON(jsonContent: string): Promise<void> {
    const data: AppBackup = JSON.parse(jsonContent);
    if (!data.accounts || !data.transactions) {
      throw new Error('Invalid backup file structure.');
    }

    await db.transaction('rw', db.accounts, db.transactions, db.categories, db.budgets, async () => {
      await db.accounts.clear();
      await db.transactions.clear();
      await db.categories.clear();
      await db.budgets.clear();

      await db.accounts.bulkAdd(data.accounts);
      await db.transactions.bulkAdd(data.transactions);
      if (data.categories) await db.categories.bulkAdd(data.categories);
      if (data.budgets) await db.budgets.bulkAdd(data.budgets);
    });
  },
};