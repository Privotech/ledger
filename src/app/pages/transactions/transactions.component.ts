import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ArrowDownUp,
  CheckCircle2,
  Clock,
  Download,
  LucideAngularModule,
  Pencil,
  Search,
  Trash2,
} from 'lucide-angular';
import { CategoryId, TransactionStatus, TransactionType } from '../../models/ledger.models';
import { LedgerService } from '../../services/ledger.service';

type SortField = 'date' | 'amount' | 'merchant';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-5">
      <!-- Toolbar & Filters -->
      <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Search -->
          <div class="relative flex-1 min-w-[220px] max-w-sm">
            <lucide-icon
              [img]="SearchIcon"
              [size]="15"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search merchant, description, or memo..."
              aria-label="Search transactions"
              class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
          </div>

          <!-- Segmented Type Filter -->
          <div class="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              (click)="typeFilter.set('all')"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              [class]="
                typeFilter() === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              "
            >
              All
            </button>
            <button
              type="button"
              (click)="typeFilter.set('income')"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              [class]="
                typeFilter() === 'income'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              "
            >
              Income
            </button>
            <button
              type="button"
              (click)="typeFilter.set('expense')"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap"
              [class]="
                typeFilter() === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              "
            >
              Expenses
            </button>
          </div>

          <!-- Category Select -->
          <select
            [ngModel]="categoryFilter()"
            (ngModelChange)="categoryFilter.set($event)"
            aria-label="Filter by category"
            class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            <option value="all">All Categories</option>
            @for (cat of ledger.categories; track cat.id) {
              <option [value]="cat.id">{{ cat.label }}</option>
            }
          </select>

          <!-- Status Select -->
          <select
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            aria-label="Filter by settlement status"
            class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            <option value="all">All Statuses</option>
            <option value="cleared">Cleared</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {{ filteredTransactions().length }} entries
          </span>
          <button
            type="button"
            (click)="ledger.exportCsv(filteredTransactions())"
            [disabled]="filteredTransactions().length === 0"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <lucide-icon [img]="DownloadIcon" [size]="14" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        @if (filteredTransactions().length === 0) {
          <div class="p-12 text-center">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">No matching ledger entries</h3>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Adjust your search terms or filters, or log a new transaction for this period.
            </p>
            <div class="mt-5 flex items-center justify-center gap-3">
              @if (hasActiveFilters()) {
                <button
                  type="button"
                  (click)="clearFilters()"
                  class="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  Reset Filters
                </button>
              }
              <button
                type="button"
                (click)="ledger.openNewEntryModal()"
                class="px-4 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors whitespace-nowrap"
              >
                Log Entry
              </button>
            </div>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th class="py-3 pl-6 pr-3">
                    <button
                      type="button"
                      (click)="toggleSort('date')"
                      class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                    >
                      <span>Date</span>
                      <lucide-icon [img]="ArrowDownUpIcon" [size]="12" />
                    </button>
                  </th>
                  <th class="py-3 px-3">
                    <button
                      type="button"
                      (click)="toggleSort('merchant')"
                      class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
                    >
                      <span>Merchant & Description</span>
                      <lucide-icon [img]="ArrowDownUpIcon" [size]="12" />
                    </button>
                  </th>
                  <th class="py-3 px-3 whitespace-nowrap">Category</th>
                  <th class="py-3 px-3 whitespace-nowrap">Status</th>
                  <th class="py-3 px-3 text-right">
                    <button
                      type="button"
                      (click)="toggleSort('amount')"
                      class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap ml-auto"
                    >
                      <span>Amount</span>
                      <lucide-icon [img]="ArrowDownUpIcon" [size]="12" />
                    </button>
                  </th>
                  <th class="py-3 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                @for (tx of filteredTransactions(); track tx.id) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 pl-6 pr-3 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {{ tx.date | date:'yyyy-MM-dd' }}
                    </td>
                    <td class="py-3 px-3">
                      <div class="font-medium text-slate-900 dark:text-slate-100">{{ tx.merchant }}</div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">
                        {{ tx.description }}
                        @if (tx.notes) {
                          <span> · {{ tx.notes }}</span>
                        }
                      </div>
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {{ ledger.getCategoryMeta(tx.category).label }}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        (click)="ledger.toggleStatus(tx.id)"
                        class="inline-flex items-center gap-1.5 text-xs font-medium"
                        [class]="
                          tx.status === 'cleared'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        "
                      >
                        <lucide-icon
                          [img]="tx.status === 'cleared' ? CheckCircle2Icon : ClockIcon"
                          [size]="13"
                        />
                        <span>{{ tx.status === 'cleared' ? 'Cleared' : 'Pending' }}</span>
                      </button>
                    </td>
                    <td
                      class="py-3 px-3 text-right font-mono tabular-nums font-medium whitespace-nowrap"
                      [class]="
                        tx.type === 'income'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      "
                    >
                      {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currency:'USD':'symbol':'1.2-2' }}
                    </td>
                    <td class="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-1">
                        <button
                          type="button"
                          (click)="ledger.openEditModal(tx)"
                          class="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          aria-label="Edit entry"
                          title="Edit entry"
                        >
                          <lucide-icon [img]="PencilIcon" [size]="14" />
                        </button>
                        <button
                          type="button"
                          (click)="ledger.deleteTransaction(tx.id)"
                          class="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          aria-label="Delete entry"
                          title="Delete entry"
                        >
                          <lucide-icon [img]="Trash2Icon" [size]="14" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Footer Summary Bar -->
          <div class="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums">
            <span class="text-slate-500 dark:text-slate-400">
              Showing {{ filteredTransactions().length }} filtered entries
            </span>
            <div class="flex items-center gap-6">
              <span class="text-emerald-700 dark:text-emerald-400">
                Inflow: {{ filteredTotals().income | currency:'USD':'symbol':'1.2-2' }}
              </span>
              <span class="text-slate-700 dark:text-slate-300">
                Outflow: {{ filteredTotals().expenses | currency:'USD':'symbol':'1.2-2' }}
              </span>
              <span class="font-semibold text-slate-900 dark:text-slate-100">
                Net: {{ filteredTotals().net | currency:'USD':'symbol':'1.2-2' }}
              </span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TransactionsComponent {
  readonly ledger = inject(LedgerService);

  readonly SearchIcon = Search;
  readonly DownloadIcon = Download;
  readonly ArrowDownUpIcon = ArrowDownUp;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly ClockIcon = Clock;

  readonly searchQuery = signal<string>('');
  readonly typeFilter = signal<'all' | TransactionType>('all');
  readonly categoryFilter = signal<'all' | CategoryId>('all');
  readonly statusFilter = signal<'all' | TransactionStatus>('all');
  readonly sortField = signal<SortField>('date');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  readonly hasActiveFilters = computed(
    () =>
      this.searchQuery().trim().length > 0 ||
      this.typeFilter() !== 'all' ||
      this.categoryFilter() !== 'all' ||
      this.statusFilter() !== 'all'
  );

  readonly filteredTransactions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const type = this.typeFilter();
    const cat = this.categoryFilter();
    const status = this.statusFilter();
    const field = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return this.ledger
      .scopedTransactions()
      .filter((tx) => {
        if (type !== 'all' && tx.type !== type) return false;
        if (cat !== 'all' && tx.category !== cat) return false;
        if (status !== 'all' && tx.status !== status) return false;
        if (q) {
          const haystack = `${tx.merchant} ${tx.description} ${tx.notes ?? ''}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (field === 'amount') {
          return (a.amount - b.amount) * dir;
        }
        if (field === 'merchant') {
          return a.merchant.localeCompare(b.merchant) * dir;
        }
        return a.date.localeCompare(b.date) * dir;
      });
  });

  readonly filteredTotals = computed(() => {
    const list = this.filteredTransactions();
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses };
  });

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDir.set(field === 'merchant' ? 'asc' : 'desc');
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.typeFilter.set('all');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
  }
}
