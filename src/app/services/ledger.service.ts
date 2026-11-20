import { Injectable, computed, effect, signal } from '@angular/core';
import {
  BudgetAllocation,
  BudgetSummary,
  CategoryId,
  CategoryMeta,
  MonthlySummary,
  RecurringCadence,
  RecurringItem,
  SavingsGoal,
  Transaction,
  TransactionStatus,
  TransactionType,
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

const INITIAL_RECURRING: RecurringItem[] = [
  {
    id: 'rec-1',
    merchant: 'Northstar Logistics',
    description: 'Q4 Design Systems Retainer',
    category: 'client',
    type: 'income',
    amount: 5400,
    cadence: 'monthly',
    nextDueDate: '2026-12-01',
    active: true,
  },
  {
    id: 'rec-2',
    merchant: 'Mercer Property Group',
    description: 'Studio Lease & Common Charges',
    category: 'housing',
    type: 'expense',
    amount: 2250,
    cadence: 'monthly',
    nextDueDate: '2026-12-01',
    active: true,
  },
  {
    id: 'rec-3',
    merchant: 'Google Cloud Platform',
    description: 'Cloud Compute & Postgres Cluster',
    category: 'software',
    type: 'expense',
    amount: 285,
    cadence: 'monthly',
    nextDueDate: '2026-11-30',
    active: true,
  },
  {
    id: 'rec-4',
    merchant: 'Figma Inc.',
    description: 'Figma & Linear Team Seats',
    category: 'software',
    type: 'expense',
    amount: 145,
    cadence: 'monthly',
    nextDueDate: '2026-12-03',
    active: true,
  },
  {
    id: 'rec-5',
    merchant: 'Sonic Fiber',
    description: 'Symmetric Gigabit Fiber',
    category: 'utilities',
    type: 'expense',
    amount: 118,
    cadence: 'monthly',
    nextDueDate: '2026-12-05',
    active: true,
  },
  {
    id: 'rec-6',
    merchant: 'JetBrains & Domains',
    description: 'Annual Developer Licenses & DNS',
    category: 'software',
    type: 'expense',
    amount: 360,
    cadence: 'annual',
    nextDueDate: '2027-01-15',
    active: true,
  },
];

const INITIAL_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    name: 'Q4 Estimated Tax Reserve',
    targetAmount: 12000,
    currentAmount: 8400,
    targetDate: '2027-01-15',
  },
  {
    id: 'goal-2',
    name: '6-Month Operating Buffer',
    targetAmount: 24000,
    currentAmount: 16500,
    targetDate: '2027-06-01',
  },
  {
    id: 'goal-3',
    name: 'Studio Display & Audio Upgrade',
    targetAmount: 3200,
    currentAmount: 2150,
    targetDate: '2026-12-20',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
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
const STORAGE_RECURRING_KEY = 'clearledger_v1_recurring';
const STORAGE_GOALS_KEY = 'clearledger_v1_goals';
const STORAGE_THEME_KEY = 'clearledger_v1_theme';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  readonly categories = CATEGORIES;

  readonly transactions = signal<Transaction[]>(this.loadJson(STORAGE_TX_KEY, INITIAL_TRANSACTIONS));
  readonly budgets = signal<BudgetAllocation[]>(this.loadJson(STORAGE_BUDGET_KEY, INITIAL_BUDGETS));
  readonly recurringItems = signal<RecurringItem[]>(
    this.loadJson(STORAGE_RECURRING_KEY, INITIAL_RECURRING)
  );
  readonly savingsGoals = signal<SavingsGoal[]>(this.loadJson(STORAGE_GOALS_KEY, INITIAL_GOALS));
  readonly selectedMonth = signal<string>('2026-11');
  readonly darkMode = signal<boolean>(this.loadTheme());

  readonly modalOpen = signal<boolean>(false);
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly toastMessage = signal<string | null>(null);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => this.saveJson(STORAGE_TX_KEY, this.transactions()));
    effect(() => this.saveJson(STORAGE_BUDGET_KEY, this.budgets()));
    effect(() => this.saveJson(STORAGE_RECURRING_KEY, this.recurringItems()));
    effect(() => this.saveJson(STORAGE_GOALS_KEY, this.savingsGoals()));

    effect(() => {
      const isDark = this.darkMode();
      try {
        localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
      } catch {
        // Ignore storage errors
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
    const grouped = new Map<
      string,
      { merchant: string; count: number; total: number; category: CategoryId }
    >();

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

  readonly recurringMetrics = computed(() => {
    const active = this.recurringItems().filter((r) => r.active);
    const toMonthly = (item: RecurringItem) => {
      if (item.cadence === 'quarterly') return item.amount / 3;
      if (item.cadence === 'annual') return item.amount / 12;
      return item.amount;
    };

    const monthlyInflow = active
      .filter((r) => r.type === 'income')
      .reduce((s, r) => s + toMonthly(r), 0);
    const monthlyBurn = active
      .filter((r) => r.type === 'expense')
      .reduce((s, r) => s + toMonthly(r), 0);

    return {
      activeCount: active.length,
      monthlyInflow: Math.round(monthlyInflow * 100) / 100,
      monthlyBurn: Math.round(monthlyBurn * 100) / 100,
      netBaseline: Math.round((monthlyInflow - monthlyBurn) * 100) / 100,
    };
  });

  readonly totalGoalsSummary = computed(() => {
    const goals = this.savingsGoals();
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const saved = goals.reduce((s, g) => s + g.currentAmount, 0);
    return {
      target,
      saved,
      percent: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    };
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
      id: `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
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

  bulkUpdateStatus(ids: Set<string>, status: TransactionStatus): void {
    if (ids.size === 0) return;
    this.transactions.update((list) =>
      list.map((tx) => (ids.has(tx.id) ? { ...tx, status } : tx))
    );
    this.showToast(`Marked ${ids.size} entries as ${status}`);
  }

  deleteTransaction(id: string): void {
    const target = this.transactions().find((tx) => tx.id === id);
    this.transactions.update((list) => list.filter((tx) => tx.id !== id));
    if (target) {
      this.showToast(`Removed "${target.description}"`);
    }
  }

  bulkDeleteTransactions(ids: Set<string>): void {
    if (ids.size === 0) return;
    this.transactions.update((list) => list.filter((tx) => !ids.has(tx.id)));
    this.showToast(`Deleted ${ids.size} selected entries`);
  }

  updateBudgetLimit(category: CategoryId, monthlyLimit: number): void {
    const sanitized = Math.max(0, Math.round(monthlyLimit));
    this.budgets.update((list) =>
      list.map((b) => (b.category === category ? { ...b, monthlyLimit: sanitized } : b))
    );
  }

  addRecurringItem(input: Omit<RecurringItem, 'id'>): void {
    const item: RecurringItem = {
      ...input,
      id: `rec-${Date.now().toString(36)}`,
    };
    this.recurringItems.update((list) => [item, ...list]);
    this.showToast(`Added recurring schedule for ${item.merchant}`);
  }

  toggleRecurringActive(id: string): void {
    this.recurringItems.update((list) =>
      list.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  }

  deleteRecurringItem(id: string): void {
    this.recurringItems.update((list) => list.filter((r) => r.id !== id));
    this.showToast('Recurring schedule removed');
  }

  postRecurringToLedger(item: RecurringItem): void {
    const activePeriod = this.selectedMonth() === 'all' ? '2026-11' : this.selectedMonth();
    const dayPart = item.nextDueDate.slice(8, 10) || '20';
    const postDate = `${activePeriod}-${dayPart}`;

    this.addTransaction({
      date: postDate,
      merchant: item.merchant,
      description: item.description,
      category: item.category,
      type: item.type,
      amount: item.amount,
      status: 'cleared',
      notes: `Posted from ${item.cadence} schedule`,
    });

    const nextDue = this.advanceDate(item.nextDueDate, item.cadence);
    this.recurringItems.update((list) =>
      list.map((r) => (r.id === item.id ? { ...r, nextDueDate: nextDue } : r))
    );
  }

  addSavingsGoal(input: Omit<SavingsGoal, 'id'>): void {
    const goal: SavingsGoal = {
      ...input,
      id: `goal-${Date.now().toString(36)}`,
    };
    this.savingsGoals.update((list) => [...list, goal]);
    this.showToast(`Created reserve goal "${goal.name}"`);
  }

  contributeToGoal(id: string, delta: number): void {
    this.savingsGoals.update((list) =>
      list.map((g) =>
        g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + delta) } : g
      )
    );
    const goal = this.savingsGoals().find((g) => g.id === id);
    if (goal && delta > 0) {
      this.showToast(`Allocated $${delta.toLocaleString()} to ${goal.name}`);
    }
  }

  deleteSavingsGoal(id: string): void {
    this.savingsGoals.update((list) => list.filter((g) => g.id !== id));
    this.showToast('Reserve goal removed');
  }

  importCsvText(csvText: string): number {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length < 2) return 0;

    const imported: Transaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length < 4) continue;

      const rawDate = /^\d{4}-\d{2}-\d{2}$/.test(cols[1]) ? cols[1] : '2026-11-20';
      const merchant = (cols[2] || cols[0] || 'Imported Merchant').trim();
      const description = (cols[3] || merchant).trim();
      const rawType = (cols[5] || '').toLowerCase();
      const rawAmount = parseFloat((cols[7] || cols[4] || '0').replace(/[^0-9.-]/g, ''));
      if (Number.isNaN(rawAmount) || rawAmount === 0) continue;

      const type: TransactionType =
        rawType === 'income' || rawAmount > 0 && rawType !== 'expense' && cols[5] === 'income'
          ? 'income'
          : rawAmount > 0 && rawType === ''
            ? 'income'
            : 'expense';

      const status: TransactionStatus =
        (cols[6] || '').toLowerCase() === 'pending' ? 'pending' : 'cleared';

      const matchedCat = this.categories.find(
        (c) => c.label.toLowerCase() === (cols[4] || '').toLowerCase() || c.id === cols[4]
      );
      const category: CategoryId =
        matchedCat?.id ?? (type === 'income' ? 'client' : 'software');

      imported.push({
        id: `tx-imp-${Date.now().toString(36)}-${i}`,
        date: rawDate,
        merchant,
        description,
        category,
        type,
        amount: Math.round(Math.abs(rawAmount) * 100) / 100,
        status,
        notes: cols[8]?.trim() || 'Imported via CSV',
      });
    }

    if (imported.length > 0) {
      this.transactions.update((list) => [...imported, ...list]);
      this.showToast(`Imported ${imported.length} ledger entries`);
    }
    return imported.length;
  }

  toggleTheme(): void {
    this.darkMode.update((v) => !v);
  }

  resetDemoData(): void {
    this.transactions.set(INITIAL_TRANSACTIONS);
    this.budgets.set(INITIAL_BUDGETS);
    this.recurringItems.set(INITIAL_RECURRING);
    this.savingsGoals.set(INITIAL_GOALS);
    this.selectedMonth.set('2026-11');
    this.showToast('Sample ledger restored');
  }

  exportCsv(rows: Transaction[]): void {
    const headers = [
      'ID',
      'Date',
      'Merchant',
      'Description',
      'Category',
      'Type',
      'Status',
      'Amount',
      'Notes',
    ];
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

  private advanceDate(dateStr: string, cadence: RecurringCadence): string {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    if (cadence === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (cadence === 'quarterly') d.setMonth(d.getMonth() + 3);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
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

  private loadJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as T;
      }
    } catch {
      // Fallback
    }
    return fallback;
  }

  private saveJson(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota errors
    }
  }

  private loadTheme(): boolean {
    try {
      return localStorage.getItem(STORAGE_THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  }
}
