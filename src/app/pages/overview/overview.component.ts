import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  LucideAngularModule,
  Send,
} from 'lucide-angular';
import { CashflowChartComponent } from '../../components/cashflow-chart/cashflow-chart.component';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink, LucideAngularModule, CashflowChartComponent],
  template: `
    <div class="space-y-6">
      <!-- 4-Column KPI Strip -->
      <section aria-label="Cashflow key metrics" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Net Cashflow</div>
          <div
            class="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight"
            [class]="
              ledger.netCashflow() >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-red-600 dark:text-red-400'
            "
          >
            {{ ledger.netCashflow() | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {{ ledger.scopedTransactions().length }} entries in period
          </div>
        </div>

        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Total Income</div>
          <div class="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-emerald-700 dark:text-emerald-400">
            {{ ledger.totalIncome() | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Recurring baseline: {{ ledger.recurringMetrics().monthlyInflow | currency:'USD':'symbol':'1.0-0' }}/mo
          </div>
        </div>

        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Operating Expenses</div>
          <div class="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
            {{ ledger.totalExpenses() | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {{ ledger.pendingSummary().count }} pending ({{ ledger.pendingSummary().amount | currency:'USD':'symbol':'1.0-0' }})
          </div>
        </div>

        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Savings & Reserves</div>
          <div class="mt-2 text-2xl font-semibold font-mono tabular-nums tracking-tight text-teal-700 dark:text-teal-400">
            {{ ledger.savingsRate() }}%
          </div>
          <div class="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {{ ledger.totalGoalsSummary().saved | currency:'USD':'symbol':'1.0-0' }} in reserve targets
          </div>
        </div>
      </section>

      <!-- Main Chart + Budget Health Split -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div class="lg:col-span-8">
          <app-cashflow-chart [series]="ledger.monthlySeries()" />
        </div>

        <div class="lg:col-span-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Budget Caps</h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Category utilization this month</p>
              </div>
              <a
                routerLink="/budgets"
                class="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-1"
              >
                Adjust
                <lucide-icon [img]="ArrowRightIcon" [size]="13" />
              </a>
            </div>

            <div class="space-y-4">
              @for (item of ledger.budgetSummaries(); track item.category) {
                <div>
                  <div class="flex items-center justify-between gap-2 text-xs mb-1.5">
                    <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {{ item.label }}
                    </span>
                    <span class="font-mono tabular-nums text-slate-600 dark:text-slate-400 shrink-0">
                      {{ item.spent | currency:'USD':'symbol':'1.0-0' }} / {{ item.monthlyLimit | currency:'USD':'symbol':'1.0-0' }}
                    </span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-200"
                      [style.width.%]="Math.min(100, item.percentUsed)"
                      [class]="
                        item.status === 'exceeded'
                          ? 'bg-red-600'
                          : item.status === 'approaching'
                            ? 'bg-amber-500'
                            : 'bg-teal-600'
                      "
                    ></div>
                  </div>
                  @if (item.status !== 'nominal') {
                    <div
                      class="mt-1 flex items-center gap-1 text-[11px] font-medium"
                      [class]="item.status === 'exceeded' ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'"
                    >
                      <lucide-icon [img]="AlertCircleIcon" [size]="12" />
                      <span>
                        {{ item.status === 'exceeded' ? 'Over limit' : 'Approaching cap' }} · {{ item.percentUsed }}%
                      </span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">Remaining envelope</span>
            <span
              class="font-mono tabular-nums font-semibold"
              [class]="
                ledger.totalBudgetEnvelope().remaining >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{ ledger.totalBudgetEnvelope().remaining | currency:'USD':'symbol':'1.0-0' }}
            </span>
          </div>
        </div>
      </section>

      <!-- Recent Ledger Entries + Upcoming Recurring Split -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Ledger Entries</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Latest activity for the selected period
              </p>
            </div>
            <a
              routerLink="/transactions"
              class="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-1"
            >
              View All
              <lucide-icon [img]="ArrowRightIcon" [size]="14" />
            </a>
          </div>

          @if (recentTransactions().length === 0) {
            <div class="p-10 text-center">
              <p class="text-sm text-slate-600 dark:text-slate-400">
                No transactions recorded for this period yet.
              </p>
              <button
                type="button"
                (click)="ledger.openNewEntryModal()"
                class="mt-4 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Log First Entry
              </button>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <th class="py-2.5 pl-6 pr-3">Date</th>
                    <th class="py-2.5 px-3">Merchant & Description</th>
                    <th class="py-2.5 px-3">Status</th>
                    <th class="py-2.5 pl-3 pr-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                  @for (tx of recentTransactions(); track tx.id) {
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="py-2.5 pl-6 pr-3 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {{ tx.date | date:'MMM d' }}
                      </td>
                      <td class="py-2.5 px-3">
                        <div class="font-medium text-slate-900 dark:text-slate-100">{{ tx.merchant }}</div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">{{ tx.description }}</div>
                      </td>
                      <td class="py-2.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          (click)="ledger.toggleStatus(tx.id)"
                          class="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                          [class]="
                            tx.status === 'cleared'
                              ? 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                              : 'text-amber-700 dark:text-amber-400 hover:text-amber-800'
                          "
                          title="Click to toggle cleared or pending status"
                        >
                          <lucide-icon
                            [img]="tx.status === 'cleared' ? CheckCircle2Icon : ClockIcon"
                            [size]="13"
                          />
                          <span>{{ tx.status === 'cleared' ? 'Cleared' : 'Pending' }}</span>
                        </button>
                      </td>
                      <td
                        class="py-2.5 pl-3 pr-6 text-right font-mono tabular-nums font-medium whitespace-nowrap"
                        [class]="
                          tx.type === 'income'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        "
                      >
                        {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currency:'USD':'symbol':'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Upcoming Recurring Schedules -->
        <div class="lg:col-span-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <div class="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Upcoming Recurring</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Next scheduled items</p>
            </div>
            <a
              routerLink="/recurring"
              class="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 inline-flex items-center gap-1"
            >
              Manage
              <lucide-icon [img]="ArrowRightIcon" [size]="13" />
            </a>
          </div>

          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            @for (rec of upcomingRecurring(); track rec.id) {
              <div class="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {{ rec.merchant }}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    Due {{ rec.nextDueDate | date:'MMM d' }} · {{ rec.cadence }}
                  </div>
                </div>

                <div class="flex items-center gap-2.5 shrink-0">
                  <span
                    class="text-xs font-mono tabular-nums font-medium"
                    [class]="
                      rec.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-100'
                    "
                  >
                    {{ rec.type === 'income' ? '+' : '-' }}{{ rec.amount | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                  <button
                    type="button"
                    (click)="ledger.postRecurringToLedger(rec)"
                    class="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Post to ledger"
                    aria-label="Post recurring item to ledger"
                  >
                    <lucide-icon [img]="SendIcon" [size]="13" />
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class OverviewComponent {
  readonly ledger = inject(LedgerService);
  readonly Math = Math;

  readonly ArrowRightIcon = ArrowRight;
  readonly AlertCircleIcon = AlertCircle;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly SendIcon = Send;

  readonly recentTransactions = computed(() => this.ledger.scopedTransactions().slice(0, 6));

  readonly upcomingRecurring = computed(() =>
    this.ledger
      .recurringItems()
      .filter((r) => r.active)
      .slice()
      .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
      .slice(0, 5)
  );
}
