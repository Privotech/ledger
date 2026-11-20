import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertCircle, CheckCircle2, LucideAngularModule, Plus, Trash2 } from 'lucide-angular';
import { CategoryId } from '../../models/ledger.models';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
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
      <section class="space-y-4">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Operating Category Caps</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        </div>
      </section>

      <!-- Savings & Reserve Targets -->
      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Reserve & Savings Targets</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {{ ledger.totalGoalsSummary().saved | currency:'USD':'symbol':'1.0-0' }} allocated toward
              {{ ledger.totalGoalsSummary().target | currency:'USD':'symbol':'1.0-0' }} total targets
              ({{ ledger.totalGoalsSummary().percent }}%)
            </p>
          </div>
          <button
            type="button"
            (click)="showGoalForm.update((v) => !v)"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <lucide-icon [img]="PlusIcon" [size]="14" />
            <span>{{ showGoalForm() ? 'Cancel' : 'New Reserve Target' }}</span>
          </button>
        </div>

        @if (showGoalForm()) {
          <form
            [formGroup]="goalForm"
            (ngSubmit)="submitGoal()"
            class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
          >
            <div class="sm:col-span-2">
              <label for="goal-name" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Target Name
              </label>
              <input
                id="goal-name"
                type="text"
                formControlName="name"
                placeholder="e.g. Q1 Equipment Reserve"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label for="goal-target" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Target Amount ($)
              </label>
              <input
                id="goal-target"
                type="number"
                min="100"
                step="100"
                formControlName="targetAmount"
                placeholder="5000"
                class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
              >
                Create Target
              </button>
            </div>
          </form>
        }

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          @for (goal of ledger.savingsGoals(); track goal.id) {
            <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
              <div>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ goal.name }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      Target date: {{ goal.targetDate | date:'MMM d, y' }}
                    </p>
                  </div>
                  <button
                    type="button"
                    (click)="ledger.deleteSavingsGoal(goal.id)"
                    class="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label="Delete target"
                  >
                    <lucide-icon [img]="Trash2Icon" [size]="14" />
                  </button>
                </div>

                <div class="mt-4">
                  <div class="flex items-baseline justify-between text-xs font-mono tabular-nums mb-1.5">
                    <span class="font-semibold text-slate-900 dark:text-slate-100">
                      {{ goal.currentAmount | currency:'USD':'symbol':'1.0-0' }}
                    </span>
                    <span class="text-slate-500 dark:text-slate-400">
                      of {{ goal.targetAmount | currency:'USD':'symbol':'1.0-0' }}
                    </span>
                  </div>
                  <div class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-teal-600 transition-all duration-200"
                      [style.width.%]="Math.min(100, (goal.currentAmount / Math.max(1, goal.targetAmount)) * 100)"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  (click)="ledger.contributeToGoal(goal.id, 100)"
                  class="flex-1 py-1.5 px-2 text-xs font-mono tabular-nums font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  +$100
                </button>
                <button
                  type="button"
                  (click)="ledger.contributeToGoal(goal.id, 500)"
                  class="flex-1 py-1.5 px-2 text-xs font-mono tabular-nums font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  +$500
                </button>
                <button
                  type="button"
                  (click)="ledger.contributeToGoal(goal.id, -100)"
                  [disabled]="goal.currentAmount <= 0"
                  class="py-1.5 px-2.5 text-xs font-mono tabular-nums font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  -$100
                </button>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class BudgetsComponent {
  readonly ledger = inject(LedgerService);
  private readonly fb = inject(FormBuilder);
  readonly Math = Math;
  readonly CheckCircle2Icon = CheckCircle2;
  readonly AlertCircleIcon = AlertCircle;
  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;

  readonly showGoalForm = signal(false);

  readonly goalForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    targetAmount: [5000, [Validators.required, Validators.min(100)]],
  });

  onLimitChange(category: CategoryId, value: number | string): void {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.ledger.updateBudgetLimit(category, parsed);
    }
  }

  submitGoal(): void {
    if (this.goalForm.invalid) {
      this.goalForm.markAllAsTouched();
      return;
    }
    const v = this.goalForm.getRawValue();
    this.ledger.addSavingsGoal({
      name: v.name.trim(),
      targetAmount: Math.round(Number(v.targetAmount)),
      currentAmount: 0,
      targetDate: '2027-03-31',
    });
    this.goalForm.reset({ name: '', targetAmount: 5000 });
    this.showGoalForm.set(false);
  }
}
