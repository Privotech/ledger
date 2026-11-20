export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'cleared' | 'pending';
export type RecurringCadence = 'monthly' | 'quarterly' | 'annual';

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
  label: string;
  shortLabel: string;
  income: number;
  expenses: number;
  net: number;
}

export interface RecurringItem {
  id: string;
  merchant: string;
  description: string;
  category: CategoryId;
  type: TransactionType;
  amount: number;
  cadence: RecurringCadence;
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
}
