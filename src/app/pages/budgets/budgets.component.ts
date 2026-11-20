import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertCircle, CheckCircle2, LucideAngularModule } from 'lucide-angular';
import { CategoryId } from '../../models/ledger.models';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Envelope Summary Strip -->
      <section class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Allocated Envelope</div>
            <div class="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {{ ledger.totalBudgetEnvelope().allocated | currency:'USD':'symbol':'1.0-0' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Spent This Period</div>
            <div class="mt-1.5 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {{ ledger.totalBudgetEnvelope().spent | currency:'USD':'symbol':'1.0-0' }}
            </div>
          </div>
          <div>
            <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining Headroom</div>
            <div
              class="mt-1.5 text-2xl font-semibold font-mono tabular-nums"
              [class]="
                ledger.totalBudgetEnvelope().remaining >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{ ledger.totalBudgetEnvelope().remaining | currency:'USD':'symbol':'1.0-0' }}
            </div>
          </div>
        </div>

        <div class="mt-5">
          <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-200"
              [style.width.%]="Math.min(100, ledger.totalBudgetEnvelope().percentUsed)"
              [class]="
                ledger.totalBudgetEnvelope().percentUsed > 100
                  ? 'bg-red-600'
                  : ledger.totalBudgetEnvelope().percentUsed >= 85
                    ? 'bg-amber-500'
                    : 'bg-teal-600'
              "
            ></div>
          </div>
          <div class="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            <span>{{ ledger.totalBudgetEnvelope().percentUsed }}% of total monthly budget utilized</span>
            <span>Adjust category limits below</span>
          </div>
        </div>
      </section>

      <!-- Category Cap Grid -->
      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        @for (item of ledger.budgetSummaries(); track item.category) {
          <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
            <div>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ item.label }}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                    {{ item.spent | currency:'USD':'symbol':'1.0-0' }} spent
                  </p>
                </div>
                <div
                  class="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap"
                  [class]="
                    item.status === 'exceeded'
                      ? 'text-red-600 dark:text-red-400'
                      : item.status === 'approaching'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                  "
                >
                  <lucide-icon
                    [img]="item.status === 'nominal' ? CheckCircle2Icon : AlertCircleIcon"
                    [size]="13"
                  />
                  <span>
                    {{
                      item.status === 'exceeded'
                        ? 'Over Limit'
                        : item.status === 'approaching'
                          ? 'Approaching'
                          : 'On Track'
                    }}
                  </span>
                </div>
              </div>

              <div class="mt-4">
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
                <div class="mt-2 flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  <span>{{ item.percentUsed }}% used</span>
                  <span>
                    {{ item.remaining >= 0 ? 'Remaining:' : 'Over by:' }}
                    {{ Math.abs(item.remaining) | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Interactive Cap Control -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between gap-3">
                <label
                  [for]="'cap-input-' + item.category"
                  class="text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Monthly Cap
                </label>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-mono text-slate-400">$</span>
                  <input
                    [id]="'cap-input-' + item.category"
                    type="number"
                    min="0"
                    step="25"
                    [ngModel]="item.monthlyLimit"
                    (ngModelChange)="onLimitChange(item.category, $event)"
                    class="w-24 px-2.5 py-1 text-right text-xs font-mono tabular-nums rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="3500"
                step="25"
                [attr.aria-label]="'Adjust monthly cap slider for ' + item.label"
                [ngModel]="item.monthlyLimit"
                (ngModelChange)="onLimitChange(item.category, $event)"
                class="w-full accent-teal-600 cursor-pointer"
              />
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class BudgetsComponent {
  readonly ledger = inject(LedgerService);
  readonly Math = Math;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertCircleIcon = AlertCircle;

  onLimitChange(category: CategoryId, value: number | string): void {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.ledger.updateBudgetLimit(category, parsed);
    }
  }
}
