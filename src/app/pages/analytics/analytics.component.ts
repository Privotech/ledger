import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Category Distribution + Savings Runway Split -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <!-- Category Breakdown with Native Angular SVG Donut -->
        <div class="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
          <div class="mb-6">
            <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Expense Allocation</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proportional breakdown across operating categories
            </p>
          </div>

          @if (expenseBreakdown().length === 0) {
            <div class="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No expense entries in this period.
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div class="sm:col-span-5 flex justify-center">
                <svg viewBox="0 0 180 180" class="w-44 h-44" role="img" aria-label="Expense breakdown donut chart">
                  <circle
                    cx="90"
                    cy="90"
                    r="64"
                    fill="none"
                    class="stroke-slate-100 dark:stroke-slate-800"
                    stroke-width="20"
                  />
                  @for (seg of donutSegments(); track seg.category) {
                    <circle
                      cx="90"
                      cy="90"
                      r="64"
                      fill="none"
                      [attr.stroke]="seg.accentHex"
                      stroke-width="20"
                      [attr.stroke-dasharray]="seg.dashArray"
                      [attr.stroke-dashoffset]="seg.dashOffset"
                      transform="rotate(-90 90 90)"
                    />
                  }
                  <text
                    x="90"
                    y="86"
                    text-anchor="middle"
                    class="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
                  >
                    Total Spend
                  </text>
                  <text
                    x="90"
                    y="104"
                    text-anchor="middle"
                    class="fill-slate-900 dark:fill-slate-100 text-sm font-semibold font-mono tabular-nums"
                  >
                    {{ ledger.totalExpenses() | currency:'USD':'symbol':'1.0-0' }}
                  </text>
                </svg>
              </div>

              <div class="sm:col-span-7 space-y-3">
                @for (item of expenseBreakdown(); track item.category) {
                  <div class="flex items-center justify-between gap-4 text-xs">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <span
                        class="w-2.5 h-2.5 rounded-sm shrink-0"
                        [style.background-color]="item.accentHex"
                      ></span>
                      <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {{ item.label }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 font-mono tabular-nums shrink-0">
                      <span class="text-slate-400 dark:text-slate-500">{{ item.share }}%</span>
                      <span class="font-medium text-slate-900 dark:text-slate-100 w-20 text-right">
                        {{ item.spent | currency:'USD':'symbol':'1.0-0' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Interactive Reserve & Runway Simulator -->
        <div class="lg:col-span-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Reserve Projection</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estimate annual surplus and operating runway from current monthly pace
            </p>

            <div class="mt-6 space-y-4">
              <div>
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <label for="reserve-slider" class="font-medium text-slate-600 dark:text-slate-400">
                    Current Cash Reserve
                  </label>
                  <span class="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    {{ cashReserve() | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                </div>
                <input
                  id="reserve-slider"
                  type="range"
                  min="5000"
                  max="100000"
                  step="1000"
                  [ngModel]="cashReserve()"
                  (ngModelChange)="cashReserve.set(+$event)"
                  class="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Projected 12-Mo Net</div>
                  <div
                    class="mt-1 text-lg font-semibold font-mono tabular-nums"
                    [class]="
                      annualizedNet() >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    {{ annualizedNet() | currency:'USD':'symbol':'1.0-0' }}
                  </div>
                </div>
                <div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">Zero-Revenue Runway</div>
                  <div class="mt-1 text-lg font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {{ runwayMonths() }} mo
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Based on {{ ledger.totalExpenses() | currency:'USD':'symbol':'1.0-0' }} monthly burn rate
          </div>
        </div>
      </section>

      <!-- Top Merchants Table -->
      <section class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Top Counterparties by Spend</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ranked vendor outflow for the active ledger period
          </p>
        </div>

        @if (ledger.topMerchants().length === 0) {
          <div class="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            No merchant outflow recorded for this period.
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th class="py-2.5 pl-6 pr-3">Merchant</th>
                  <th class="py-2.5 px-3">Primary Category</th>
                  <th class="py-2.5 px-3 text-right">Transactions</th>
                  <th class="py-2.5 pl-3 pr-6 text-right">Total Outflow</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                @for (m of ledger.topMerchants(); track m.merchant) {
                  <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-2.5 pl-6 pr-3 font-medium text-slate-900 dark:text-slate-100">
                      {{ m.merchant }}
                    </td>
                    <td class="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                      {{ ledger.getCategoryMeta(m.category).label }}
                    </td>
                    <td class="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
                      {{ m.count }}
                    </td>
                    <td class="py-2.5 pl-3 pr-6 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                      {{ m.total | currency:'USD':'symbol':'1.2-2' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
})
export class AnalyticsComponent {
  readonly ledger = inject(LedgerService);
  readonly cashReserve = signal<number>(28000);

  readonly expenseBreakdown = computed(() => {
    const total = this.ledger.totalExpenses();
    const map = new Map<string, number>();

    for (const tx of this.ledger.scopedTransactions()) {
      if (tx.type !== 'expense') continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }

    return Array.from(map.entries())
      .map(([category, spent]) => {
        const meta = this.ledger.getCategoryMeta(category as any);
        return {
          category,
          label: meta.label,
          accentHex: meta.accentHex,
          spent,
          share: total > 0 ? Math.round((spent / total) * 100) : 0,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  });

  readonly donutSegments = computed(() => {
    const items = this.expenseBreakdown();
    const total = items.reduce((s, i) => s + i.spent, 0);
    if (total <= 0) return [];

    const circumference = 2 * Math.PI * 64;
    let cumulative = 0;

    return items.map((item) => {
      const length = (item.spent / total) * circumference;
      const seg = {
        category: item.category,
        accentHex: item.accentHex,
        dashArray: `${Math.max(0, length - 2)} ${circumference}`,
        dashOffset: -cumulative,
      };
      cumulative += length;
      return seg;
    });
  });

  readonly annualizedNet = computed(() => this.ledger.netCashflow() * 12);

  readonly runwayMonths = computed(() => {
    const burn = this.ledger.totalExpenses();
    if (burn <= 0) return '∞';
    return (this.cashReserve() / burn).toFixed(1);
  });
}
