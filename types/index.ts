export type AccountType = 'cash' | 'bank' | 'ewallet' | 'savings' | 'custom';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // Stored as integer IDR
  openingBalance: number;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Integer IDR
  date: string; // ISO string
  categoryId?: string;
  sourceAccountId: string;
  destinationAccountId?: string; // For transfers
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  isCustom?: boolean;
}

export interface Budget {
  id: string;
  categoryId?: string; // If undefined, applies to total monthly expense
  amount: number; // Integer IDR
  month: string; // Format: 'YYYY-MM'
  createdAt: string;
  updatedAt: string;
}

export interface AppBackup {
  version: number;
  timestamp: string;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}