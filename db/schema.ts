import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['cash', 'bank', 'ewallet', 'savings', 'custom']),
  balance: z.number().int(),
  openingBalance: z.number().int(),
  currency: z.string().default('IDR'),
  isArchived: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const transactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().int().positive('Amount must be greater than zero'),
  date: z.string().min(1),
  categoryId: z.string().optional(),
  sourceAccountId: z.string().min(1, 'Source account is required'),
  destinationAccountId: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).refine(data => {
  if (data.type === 'transfer') {
    return !!data.destinationAccountId && data.sourceAccountId !== data.destinationAccountId;
  }
  return true;
}, {
  message: 'Transfer requires a valid distinct destination account',
  path: ['destinationAccountId'],
});

export const budgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().optional(),
  amount: z.number().int().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  createdAt: z.string(),
  updatedAt: z.string(),
});