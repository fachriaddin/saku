import { db } from '@/db/database';
import { Account, Transaction } from '@/types';

export const financeRepo = {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  },

  async addAccount(account: Omit<Account, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    await db.accounts.add({
      ...account,
      createdAt: now,
      updatedAt: now,
    });
  },

  async deleteAccount(id: string): Promise<void> {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      await db.accounts.delete(id);
      const relatedTx = await db.transactions
        .where('sourceAccountId')
        .equals(id)
        .or('destinationAccountId')
        .equals(id)
        .toArray();
      
      const txIds = relatedTx.map((t) => t.id);
      await db.transactions.bulkDelete(txIds);
    });
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await db.transactions.orderBy('date').reverse().toArray();
  },

  async addTransaction(tx: Omit<Transaction, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      await db.transactions.add({
        ...tx,
        createdAt: now,
        updatedAt: now,
      });

      if (tx.type === 'income') {
        const acc = await db.accounts.get(tx.sourceAccountId);
        if (acc) {
          await db.accounts.update(acc.id, { balance: acc.balance + tx.amount });
        }
      } else if (tx.type === 'expense') {
        const acc = await db.accounts.get(tx.sourceAccountId);
        if (acc) {
          await db.accounts.update(acc.id, { balance: acc.balance - tx.amount });
        }
      } else if (tx.type === 'transfer' && tx.destinationAccountId) {
        const sourceAcc = await db.accounts.get(tx.sourceAccountId);
        const destAcc = await db.accounts.get(tx.destinationAccountId);
        if (sourceAcc) {
          await db.accounts.update(sourceAcc.id, { balance: sourceAcc.balance - tx.amount });
        }
        if (destAcc) {
          await db.accounts.update(destAcc.id, { balance: destAcc.balance + tx.amount });
        }
      }
    });
  },

  async deleteTransaction(id: string): Promise<void> {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      const tx = await db.transactions.get(id);
      if (!tx) return;

      if (tx.type === 'income') {
        const acc = await db.accounts.get(tx.sourceAccountId);
        if (acc) {
          await db.accounts.update(acc.id, { balance: acc.balance - tx.amount });
        }
      } else if (tx.type === 'expense') {
        const acc = await db.accounts.get(tx.sourceAccountId);
        if (acc) {
          await db.accounts.update(acc.id, { balance: acc.balance + tx.amount });
        }
      } else if (tx.type === 'transfer' && tx.destinationAccountId) {
        const sourceAcc = await db.accounts.get(tx.sourceAccountId);
        const destAcc = await db.accounts.get(tx.destinationAccountId);
        if (sourceAcc) {
          await db.accounts.update(sourceAcc.id, { balance: sourceAcc.balance + tx.amount });
        }
        if (destAcc) {
          await db.accounts.update(destAcc.id, { balance: destAcc.balance - tx.amount });
        }
      }

      await db.transactions.delete(id);
    });
  },
};