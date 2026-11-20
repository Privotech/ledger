import { Injectable, computed, effect, signal } from '@angular/core';
import {
  BudgetAllocation,
  BudgetSummary,
  CategoryId,
  CategoryMeta,
  MonthlySummary,
  Transaction,
  TransactionStatus,
} from '../models/ledger.models';

export const CATEGORIES: CategoryMeta[] = [
  { id: 'housing', label: 'Studio & Workspace', type: 'expense', accentHex: '#0F766E' },
  { id: 'software', label: 'Cloud & Software', type: 'expense', accentHex: '#2563EB' },
  { id: 'groceries', label: 'Provisions & Dining', type: 'expense', accentHex: '#D97706' },
  { id: 'transport', label: 'Travel & Transit', type: 'expense', accentHex: '#4F46E5' },
  { id: 'utilities', label: 'Utilities & Fiber', type: 'expense', accentHex: '#0284C7' },
  { id: 'studio', label: 'Equipment & Supplies', type: 'expense', accentHex: '#DC2626' },
  { id: 'client', label: 'Client Retainers', type: 'income', accentHex: '#16A34A' },
  { id: 'payroll', label: 'Product & Licensing', type: 'income', accentHex: '#0D9488' },
];

const INITIAL_BUDGETS: BudgetAllocation[] = [
  { category: 'housing', monthlyLimit: 2400 },
  { category: 'software', monthlyLimit: 480 },
  { category: 'groceries', monthlyLimit: 750 },
  { category: 'transport', monthlyLimit: 420 },
  { category: 'utilities', monthlyLimit: 260 },
  { category: 'studio', monthlyLimit: 650 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // November 2026
  {
    id: 'tx-1101',
    date: '2026-11-18',
    description: 'Q4 Design Systems Retainer',
    merchant: 'Northstar Logistics',
    category: 'client',
    type: 'income',
    amount: 5400,
    status: 'cleared',
    notes: 'Monthly retainer installment #2',
  },
  {
    id: 'tx-1102',
    date: '2026-11-16',
    description: 'Studio Lease & Common Charges',
    merchant: 'Mercer Property Group',
    category: 'housing',
    type: 'expense',
    amount: 2250,
    status: 'cleared',
  },
  {
    id: 'tx-1103',
    date: '2026-11-15',
    description: 'UI Kit Annual Licenses',
    merchant: 'Paddle Commerce',
    category: 'payroll',
    type: 'income',
    amount: 1840,
    status: 'cleared',
  },
  {
    id: 'tx-1104',
    date: '2026-11-14',
    description: 'Cloud Compute & Postgres Cluster',
    merchant: 'Google Cloud Platform',
    category: 'software',
    type: 'expense',
    amount: 284.5,
    status: 'cleared',
  },
  {
    id: 'tx-1105',
    date: '2026-11-12',
    description: 'Weekly Studio Provisions',
    merchant: 'Whole Foods Market',
    category: 'groceries',
    type: 'expense',
    amount: 214.8,
    status: 'cleared',
  },
  {
    id: 'tx-1106',
    date: '2026-11-10',
    description: 'Amtrak Acela Client Onsite',
    merchant: 'Amtrak',
    category: 'transport',
    type: 'expense',
    amount: 196,
    status: 'pending',
    notes: 'Awaiting expense reimbursement',
  },
  {
    id: 'tx-1107',
    date: '2026-11-08',
    description: 'Ergonomic Monitor Arm & Calibrator',
    merchant: 'B&H Photo Video',
    category: 'studio',
    type: 'expense',
    amount: 695,
    status: 'cleared',
  },
  {
    id: 'tx-1108',
    date: '2026-11-05',
    description: 'Symmetric Gigabit Fiber',
    merchant: 'Sonic Fiber',
    category: 'utilities',
    type: 'expense',
    amount: 118,
    status: 'cleared',
  },
  {
    id: 'tx-1109',
    date: '2026-11-03',
    description: 'Figma & Linear Team Seats',
    merchant: 'Figma Inc.',
    category: 'software',
    type: 'expense',
    amount: 145,
    status: 'cleared',
  },
  {
    id: 'tx-1110',
    date: '2026-11-02',
    description: 'Team Working Lunch & Coffee',
    merchant: 'Blue Bottle & Tartine',
    category: 'groceries',
    type: 'expense',
    amount: 162.4,
    status: 'cleared',
  },
  {
    id: 'tx-1111',
    date: '2026-11-01',
    description: 'Electric & Studio Climate',
    merchant: 'ConEdison',
    category: 'utilities',
    type: 'expense',
    amount: 129.2,
    status: 'pending',
  },
  // October 2026
  {
    id: 'tx-1001',
    date: '2026-10-24',
    description: 'Architecture Audit Sprint',
    merchant: 'Kestrel Mobility',
    category: 'client',
    type: 'income',
    amount: 4850,
    status: 'cleared',
  },
  {
    id: 'tx-1002',
    date: '2026-10-19',
    description: 'Product Licensing Payout',
    merchant: 'Paddle Commerce',
    category: 'payroll',
    type: 'income',
    amount: 1620,
    status: 'cleared',
  },
  {
    id: 'tx-1003',
    date: '2026-10-15',
    description: 'Studio Lease & Common Charges',
    merchant: 'Mercer Property Group',
    category: 'housing',
    type: 'expense',
    amount: 2250,
    status: 'cleared',
  },
  {
    id: 'tx-1004',
    date: '2026-10-12',
    description: 'Cloud Compute & Storage',
    merchant: 'Google Cloud Platform',
    category: 'software',
    type: 'expense',
    amount: 268.4,
    status: 'cleared',
  },
  {
    id: 'tx-1005',
    date: '2026-10-09',
    description: 'Groceries & Pantry Restock',
    merchant: 'Whole Foods Market',
    category: 'groceries',
    type: 'expense',
    amount: 498.5,
    status: 'cleared',
  },
  {
    id: 'tx-1006',
    date: '2026-10-06',
    description: 'Regional Rail & Transit Pass',
    merchant: 'Metro Transit',
    category: 'transport',
    type: 'expense',
    amount: 148,
    status: 'cleared',
  },
  {
    id: 'tx-1007',
    date: '2026-10-03',
    description: 'Utilities & Fiber',
    merchant: 'Sonic Fiber',
    category: 'utilities',
    type: 'expense',
    amount: 234,
    status: 'cleared',
  },
  // September 2026
  {
    id: 'tx-0901',
    date: '2026-09-22',
    description: 'Enterprise Retainer',
    merchant: 'Northstar Logistics',
    category: 'client',
    type: 'income',
    amount: 5400,
    status: 'cleared',
  },
  {
    id: 'tx-0902',
    date: '2026-09-17',
    description: 'Licensing Royalties',
    merchant: 'Paddle Commerce',
    category: 'payroll',
    type: 'income',
    amount: 1490,
    status: 'cleared',
  },
  {
    id: 'tx-0903',
    date: '2026-09-15',
    description: 'Studio Lease',
    merchant: 'Mercer Property Group',
    category: 'housing',
    type: 'expense',
    amount: 2250,
    status: 'cleared',
  },
  {
    id: 'tx-0904',
    date: '2026-09-10',
    description: 'Cloud Infrastructure',
    merchant: 'Google Cloud Platform',
    category: 'software',
    type: 'expense',
    amount: 312,
    status: 'cleared',
  },
  {
    id: 'tx-0905',
    date: '2026-09-07',
    description: 'Provisions & Dining',
    merchant: 'Whole Foods Market',
    category: 'groceries',
    type: 'expense',
    amount: 540,
    status: 'cleared',
  },
  {
    id: 'tx-0906',
    date: '2026-09-04',
    description: 'Studio Acoustic Panels',
    merchant: 'GIK Acoustics',
    category: 'studio',
    type: 'expense',
    amount: 420,
    status: 'cleared',
  },
  // August 2026
  {
    id: 'tx-0801',
    date: '2026-08-25',
    description: 'Frontend Modernization Sprint',
    merchant: 'Vanguard Health',
    category: 'client',
    type: 'income',
    amount: 4600,
    status: 'cleared',
  },
  {
    id: 'tx-0802',
    date: '2026-08-18',
    description: 'Licensing Royalties',
    merchant: 'Paddle Commerce',
    category: 'payroll',
    type: 'income',
    amount: 1210,
    status: 'cleared',
  },
  {
    id: 'tx-0803',
    date: '2026-08-15',
    description: 'Studio Lease',
    merchant: 'Mercer Property Group',
    category: 'housing',
    type: 'expense',
    amount: 2250,
    status: 'cleared',
  },
  {
    id: 'tx-0804',
    date: '2026-08-11',
    description: 'Software Subscriptions',
    merchant: 'Figma Inc.',
    category: 'software',
    type: 'expense',
    amount: 385,
    status: 'cleared',
  },
  {
    id: 'tx-0805',
    date: '2026-08-06',
    description: 'Provisions & Coffee',
    merchant: 'Whole Foods Market',
    category: 'groceries',
    type: 'expense',
    amount: 615,
    status: 'cleared',
  },
];

const STORAGE_TX_KEY = 'clearledger_v1_transactions';
const STORAGE_BUDGET_KEY = 'clearledger_v1_budgets';
const STORAGE_THEME_KEY = 'clearledger_v1_theme';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  readonly categories = CATEGORIES;

  readonly transactions = signal<Transaction[]>(this.loadTransactions());
  readonly budgets = signal<BudgetAllocation[]>(this.loadBudgets());
  readonly selectedMonth = signal<string>('2026-11');
  readonly darkMode = signal<boolean>(this.loadTheme());

  readonly modalOpen = signal<boolean>(false);
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly toastMessage = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_TX_KEY, JSON.stringify(this.transactions()));
      } catch {
        // Ignore storage quota errors
      }
    });

    effect(() => {
      try {
        localStorage.setItem(STORAGE_BUDGET_KEY, JSON.stringify(this.budgets()));
      } catch {
        // Ignore storage quota errors
      }
    });

    effect(() => {
      const isDark = this.darkMode();
      try {
        localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
      } catch {
        // Ignore storage quota errors
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', isDark);
      }
    });
  }

  readonly availableMonths = computed(() => {
    const keys = new Set<string>(this.transactions().map((tx) => tx.date.slice(0, 7)));
    keys.add('2026-11');
    return Array.from(keys)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        key,
        label: this.formatMonthLabel(key),
      }));
  });

  readonly scopedTransactions = computed(() => {
    const month = this.selectedMonth();
    const list =
      month === 'all'
        ? this.transactions()
        : this.transactions().filter((tx) => tx.date.startsWith(month));
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly totalIncome = computed(() =>
    this.scopedTransactions()
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly totalExpenses = computed(() =>
    this.scopedTransactions()
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
  );

  readonly netCashflow = computed(() => this.totalIncome() - this.totalExpenses());

  readonly savingsRate = computed(() => {
    const income = this.totalIncome();
    if (income <= 0) return 0;
    return Math.round(((income - this.totalExpenses()) / income) * 1000) / 10;
  });

  readonly pendingSummary = computed(() => {
    const pending = this.scopedTransactions().filter((tx) => tx.status === 'pending');
    return {
      count: pending.length,
      amount: pending.reduce((sum, tx) => sum + tx.amount, 0),
    };
  });

  readonly budgetSummaries = computed<BudgetSummary[]>(() => {
    const monthKey = this.selectedMonth() === 'all' ? '2026-11' : this.selectedMonth();
    const monthExpenses = this.transactions().filter(
      (tx) => tx.type === 'expense' && tx.date.startsWith(monthKey)
    );

    return this.budgets().map((b) => {
      const meta = this.getCategoryMeta(b.category);
      const spent = monthExpenses
        .filter((tx) => tx.category === b.category)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const remaining = b.monthlyLimit - spent;
      const percentUsed = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;

      let status: BudgetSummary['status'] = 'nominal';
      if (percentUsed > 100) {
        status = 'exceeded';
      } else if (percentUsed >= 80) {
        status = 'approaching';
      }

      return {
        category: b.category,
        label: meta.label,
        accentHex: meta.accentHex,
        monthlyLimit: b.monthlyLimit,
        spent,
        remaining,
        percentUsed,
        status,
      };
    });
  });

  readonly totalBudgetEnvelope = computed(() => {
    const items = this.budgetSummaries();
    const allocated = items.reduce((sum, item) => sum + item.monthlyLimit, 0);
    const spent = items.reduce((sum, item) => sum + item.spent, 0);
    return {
      allocated,
      spent,
      remaining: allocated - spent,
      percentUsed: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
    };
  });

  readonly monthlySeries = computed<MonthlySummary[]>(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const tx of this.transactions()) {
      const key = tx.date.slice(0, 7);
      const current = map.get(key) ?? { income: 0, expenses: 0 };
      if (tx.type === 'income') {
        current.income += tx.amount;
      } else {
        current.expenses += tx.amount;
      }
      map.set(key, current);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([monthKey, totals]) => ({
        monthKey,
        label: this.formatMonthLabel(monthKey),
        shortLabel: this.formatShortMonth(monthKey),
        income: Math.round(totals.income * 100) / 100,
        expenses: Math.round(totals.expenses * 100) / 100,
        net: Math.round((totals.income - totals.expenses) * 100) / 100,
      }));
  });

  readonly topMerchants = computed(() => {
    const expenses = this.scopedTransactions().filter((tx) => tx.type === 'expense');
    const grouped = new Map<string, { merchant: string; count: number; total: number; category: CategoryId }>();

    for (const tx of expenses) {
      const existing = grouped.get(tx.merchant);
      if (existing) {
        existing.count += 1;
        existing.total += tx.amount;
      } else {
        grouped.set(tx.merchant, {
          merchant: tx.merchant,
          count: 1,
          total: tx.amount,
          category: tx.category,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  });

  getCategoryMeta(id: CategoryId): CategoryMeta {
    return (
      this.categories.find((c) => c.id === id) ?? {
        id,
        label: id,
        type: 'expense',
        accentHex: '#64748B',
      }
    );
  }

  openNewEntryModal(): void {
    this.editingTransaction.set(null);
    this.modalOpen.set(true);
  }

  openEditModal(tx: Transaction): void {
    this.editingTransaction.set(tx);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingTransaction.set(null);
  }

  addTransaction(input: Omit<Transaction, 'id'>): void {
    const newTx: Transaction = {
      ...input,
      id: `tx-${Date.now().toString(36)}`,
    };
    this.transactions.update((list) => [newTx, ...list]);
    this.showToast(`Recorded "${newTx.description}"`);
  }

  updateTransaction(id: string, patch: Partial<Omit<Transaction, 'id'>>): void {
    this.transactions.update((list) =>
      list.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx))
    );
    this.showToast('Entry updated');
  }

  toggleStatus(id: string): void {
    this.transactions.update((list) =>
      list.map((tx) => {
        if (tx.id !== id) return tx;
        const nextStatus: TransactionStatus = tx.status === 'cleared' ? 'pending' : 'cleared';
        return { ...tx, status: nextStatus };
      })
    );
  }

  deleteTransaction(id: string): void {
    const target = this.transactions().find((tx) => tx.id === id);
    this.transactions.update((list) => list.filter((tx) => tx.id !== id));
    if (target) {
      this.showToast(`Removed "${target.description}"`);
    }
  }

  updateBudgetLimit(category: CategoryId, monthlyLimit: number): void {
    const sanitized = Math.max(0, Math.round(monthlyLimit));
    this.budgets.update((list) =>
      list.map((b) => (b.category === category ? { ...b, monthlyLimit: sanitized } : b))
    );
  }

  toggleTheme(): void {
    this.darkMode.update((v) => !v);
  }

  resetDemoData(): void {
    this.transactions.set(INITIAL_TRANSACTIONS);
    this.budgets.set(INITIAL_BUDGETS);
    this.selectedMonth.set('2026-11');
    this.showToast('Sample ledger restored');
  }

  exportCsv(rows: Transaction[]): void {
    const headers = ['ID', 'Date', 'Merchant', 'Description', 'Category', 'Type', 'Status', 'Amount', 'Notes'];
    const escapeCell = (val: string | number | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replaceAll('"', '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map((tx) =>
        [
          tx.id,
          tx.date,
          tx.merchant,
          tx.description,
          this.getCategoryMeta(tx.category).label,
          tx.type,
          tx.status,
          tx.type === 'expense' ? -tx.amount : tx.amount,
          tx.notes ?? '',
        ]
          .map(escapeCell)
          .join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clearledger-${this.selectedMonth()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showToast(`Exported ${rows.length} entries to CSV`);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 3200);
  }

  private formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    if (!year || !month) return monthKey;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private formatShortMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    if (!year || !month) return monthKey;
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  private loadTransactions(): Transaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_TX_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback to initial seed
    }
    return INITIAL_TRANSACTIONS;
  }

  private loadBudgets(): BudgetAllocation[] {
    try {
      const raw = localStorage.getItem(STORAGE_BUDGET_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to initial seed
    }
    return INITIAL_BUDGETS;
  }

  private loadTheme(): boolean {
    try {
      return localStorage.getItem(STORAGE_THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
