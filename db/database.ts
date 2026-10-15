import Dexie, { type Table } from 'dexie';
import { Account, Transaction, Category, Budget } from '@/types';

export class SakuDatabase extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  budgets!: Table<Budget, string>;

  constructor() {
    super('SakuLocalDB');
    this.version(1).stores({
      accounts: 'id, type, isArchived',
      transactions: 'id, type, date, sourceAccountId, destinationAccountId, categoryId',
      categories: 'id, type, isCustom',
      budgets: 'id, month, categoryId',
    });
  }
}

export const db = new SakuDatabase();

// Seed default categories if none exist
export async function seedDefaultCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    const defaultCategories: Category[] = [
      // Expense
      { id: 'exp-food', name: 'Food & Drinks', type: 'expense', isCustom: false },
      { id: 'exp-transport', name: 'Transportation', type: 'expense', isCustom: false },
      { id: 'exp-shopping', name: 'Shopping', type: 'expense', isCustom: false },
      { id: 'exp-education', name: 'Education', type: 'expense', isCustom: false },
      { id: 'exp-entertainment', name: 'Entertainment', type: 'expense', isCustom: false },
      { id: 'exp-health', name: 'Health', type: 'expense', isCustom: false },
      { id: 'exp-bills', name: 'Bills & Utilities', type: 'expense', isCustom: false },
      { id: 'exp-other', name: 'Other Expense', type: 'expense', isCustom: false },
      // Income
      { id: 'inc-salary', name: 'Salary', type: 'income', isCustom: false },
      { id: 'inc-allowance', name: 'Allowance', type: 'income', isCustom: false },
      { id: 'inc-business', name: 'Business Income', type: 'income', isCustom: false },
      { id: 'inc-other', name: 'Other Income', type: 'income', isCustom: false },
    ];
    await db.categories.bulkAdd(defaultCategories);
  }
}