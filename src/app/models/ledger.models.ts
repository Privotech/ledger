export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'cleared' | 'pending';

export type CategoryId =
  | 'housing'
  | 'software'
  | 'groceries'
  | 'transport'
  | 'utilities'
  | 'studio'
  | 'client'
  | 'payroll';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  type: TransactionType;
  accentHex: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  merchant: string;
  category: CategoryId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  notes?: string;
}

export interface BudgetAllocation {
  category: CategoryId;
  monthlyLimit: number;
}

export interface BudgetSummary {
  category: CategoryId;
  label: string;
  accentHex: string;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'nominal' | 'approaching' | 'exceeded';
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  label: string;    // e.g. "Nov 2026"
  shortLabel: string; // e.g. "Nov"
  income: number;
  expenses: number;
  net: number;
}
