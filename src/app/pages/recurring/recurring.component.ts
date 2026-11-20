import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CalendarClock,
  LucideAngularModule,
  Pause,
  Play,
  Plus,
  Send,
  Trash2,
} from 'lucide-angular';
import { CategoryId, RecurringCadence, TransactionType } from '../../models/ledger.models';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Recurring Baseline KPIs -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Recurring Inflow</div>
          <div class="mt-2 text-2xl font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
            {{ ledger.recurringMetrics().monthlyInflow | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Normalized monthly retainers
          </div>
        </div>

        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Recurring Burn</div>
          <div class="mt-2 text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {{ ledger.recurringMetrics().monthlyBurn | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {{ ledger.recurringMetrics().activeCount }} active schedules
          </div>
        </div>

        <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div class="text-xs font-medium text-slate-500 dark:text-slate-400">Net Recurring Baseline</div>
          <div
            class="mt-2 text-2xl font-semibold font-mono tabular-nums"
            [class]="
              ledger.recurringMetrics().netBaseline >= 0
                ? 'text-teal-700 dark:text-teal-400'
                : 'text-red-600 dark:text-red-400'
            "
          >
            {{ ledger.recurringMetrics().netBaseline | currency:'USD':'symbol':'1.2-2' }}
          </div>
          <div class="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            Committed monthly surplus
          </div>
        </div>
      </section>

      <!-- Filter Bar + Add Schedule Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
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
            All Schedules
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
            Subscriptions & Bills
          </button>
        </div>

        <button
          type="button"
          (click)="showForm.update((v) => !v)"
          class="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          <lucide-icon [img]="PlusIcon" [size]="14" />
          <span>{{ showForm() ? 'Hide Form' : 'Add Recurring Schedule' }}</span>
        </button>
      </div>

      <!-- Inline Add Schedule Form -->
      @if (showForm()) {
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4"
        >
          <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">New Recurring Schedule</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label for="rec-type" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Type</label>
              <select
                id="rec-type"
                formControlName="type"
                (change)="onTypeChanged()"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label for="rec-merchant" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Merchant</label>
              <input
                id="rec-merchant"
                type="text"
                formControlName="merchant"
                placeholder="e.g. Cloudflare"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="rec-desc" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
              <input
                id="rec-desc"
                type="text"
                formControlName="description"
                placeholder="e.g. Pro Plan Hosting"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="rec-amount" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount (USD)</label>
              <input
                id="rec-amount"
                type="number"
                min="1"
                step="0.01"
                formControlName="amount"
                placeholder="0.00"
                class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label for="rec-cadence" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Cadence</label>
              <select
                id="rec-cadence"
                formControlName="cadence"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>

            <div>
              <label for="rec-category" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
              <select
                id="rec-category"
                formControlName="category"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                @for (cat of filteredCategories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.label }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="showForm.set(false)"
              class="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-xs font-medium rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors"
            >
              Save Schedule
            </button>
          </div>
        </form>
      }

      <!-- Recurring Table -->
      <section class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        @if (filteredItems().length === 0) {
          <div class="p-12 text-center">
            <lucide-icon [img]="CalendarClockIcon" [size]="28" class="mx-auto text-slate-400 mb-3" />
            <p class="text-sm font-medium text-slate-900 dark:text-slate-100">No recurring schedules in this filter</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add a retainer or recurring subscription to forecast your monthly baseline.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th class="py-3 pl-6 pr-3">Schedule</th>
                  <th class="py-3 px-3">Category</th>
                  <th class="py-3 px-3">Cadence</th>
                  <th class="py-3 px-3">Next Due</th>
                  <th class="py-3 px-3">State</th>
                  <th class="py-3 px-3 text-right">Amount</th>
                  <th class="py-3 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                @for (item of filteredItems(); track item.id) {
                  <tr
                    class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    [class.opacity-55]="!item.active"
                  >
                    <td class="py-3 pl-6 pr-3">
                      <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.merchant }}</div>
                      <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.description }}</div>
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {{ ledger.getCategoryMeta(item.category).label }}
                    </td>
                    <td class="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">
                      {{ item.cadence }}
                    </td>
                    <td class="py-3 px-3 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {{ item.nextDueDate | date:'MMM d, y' }}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        (click)="ledger.toggleRecurringActive(item.id)"
                        class="inline-flex items-center gap-1.5 text-xs font-medium"
                        [class]="item.active ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'"
                      >
                        <lucide-icon [img]="item.active ? PlayIcon : PauseIcon" [size]="12" />
                        <span>{{ item.active ? 'Active' : 'Paused' }}</span>
                      </button>
                    </td>
                    <td
                      class="py-3 px-3 text-right font-mono tabular-nums font-medium whitespace-nowrap"
                      [class]="
                        item.type === 'income'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      "
                    >
                      {{ item.type === 'income' ? '+' : '-' }}{{ item.amount | currency:'USD':'symbol':'1.2-2' }}
                    </td>
                    <td class="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-2">
                        <button
                          type="button"
                          (click)="ledger.postRecurringToLedger(item)"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Record this schedule into the active period ledger"
                        >
                          <lucide-icon [img]="SendIcon" [size]="12" />
                          <span>Post to Ledger</span>
                        </button>
                        <button
                          type="button"
                          (click)="ledger.deleteRecurringItem(item.id)"
                          class="p-1.5 rounded-md text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          aria-label="Delete schedule"
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
        }
      </section>
    </div>
  `,
})
export class RecurringComponent {
  readonly ledger = inject(LedgerService);
  private readonly fb = inject(FormBuilder);

  readonly PlusIcon = Plus;
  readonly CalendarClockIcon = CalendarClock;
  readonly PlayIcon = Play;
  readonly PauseIcon = Pause;
  readonly SendIcon = Send;
  readonly Trash2Icon = Trash2;

  readonly showForm = signal(false);
  readonly typeFilter = signal<'all' | TransactionType>('all');
  readonly selectedType = signal<TransactionType>('expense');

  readonly form = this.fb.nonNullable.group({
    type: ['expense' as TransactionType, Validators.required],
    merchant: ['', Validators.required],
    description: ['', Validators.required],
    amount: [null as unknown as number, [Validators.required, Validators.min(1)]],
    cadence: ['monthly' as RecurringCadence, Validators.required],
    category: ['software' as CategoryId, Validators.required],
    nextDueDate: ['2026-12-01', Validators.required],
  });

  readonly filteredCategories = computed(() =>
    this.ledger.categories.filter((c) => c.type === this.selectedType())
  );

  readonly filteredItems = computed(() => {
    const f = this.typeFilter();
    const list = this.ledger.recurringItems();
    return f === 'all' ? list : list.filter((r) => r.type === f);
  });

  onTypeChanged(): void {
    const nextType = this.form.controls.type.value;
    this.selectedType.set(nextType);
    const valid = this.ledger.categories.filter((c) => c.type === nextType);
    if (!valid.some((c) => c.id === this.form.controls.category.value)) {
      this.form.controls.category.setValue(valid[0]?.id ?? 'software');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ledger.addRecurringItem({
      type: v.type,
      merchant: v.merchant.trim(),
      description: v.description.trim(),
      amount: Math.round(Number(v.amount) * 100) / 100,
      cadence: v.cadence,
      category: v.category,
      nextDueDate: v.nextDueDate,
      active: true,
    });
    this.form.reset({
      type: 'expense',
      merchant: '',
      description: '',
      amount: null as unknown as number,
      cadence: 'monthly',
      category: 'software',
      nextDueDate: '2026-12-01',
    });
    this.selectedType.set('expense');
    this.showForm.set(false);
  }
}
