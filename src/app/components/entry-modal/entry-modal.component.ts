import { CommonModule } from '@angular/common';
import { Component, computed, effect, HostListener, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { CategoryId, TransactionStatus, TransactionType } from '../../models/ledger.models';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-entry-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    @if (ledger.modalOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
      >
        <div
          class="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 id="entry-modal-title" class="text-base font-semibold text-slate-900 dark:text-slate-100">
              {{ isEditing() ? 'Edit Ledger Entry' : 'New Ledger Entry' }}
            </h2>
            <button
              type="button"
              (click)="ledger.closeModal()"
              class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600"
              aria-label="Close dialog"
            >
              <lucide-icon [img]="XIcon" [size]="18" />
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-5">
            <!-- Segmented Type Selector -->
            <div>
              <span class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Entry Type</span>
              <div class="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  (click)="setType('expense')"
                  class="py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                  [class]="
                    currentType === 'expense'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  "
                >
                  Expense
                </button>
                <button
                  type="button"
                  (click)="setType('income')"
                  class="py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                  [class]="
                    currentType === 'income'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  "
                >
                  Income
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="entry-amount" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Amount (USD)
                </label>
                <input
                  id="entry-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  formControlName="amount"
                  placeholder="0.00"
                  class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
                @if (form.controls.amount.touched && form.controls.amount.invalid) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Enter a valid amount above 0.</p>
                }
              </div>

              <div>
                <label for="entry-date" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Date
                </label>
                <input
                  id="entry-date"
                  type="date"
                  formControlName="date"
                  class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="entry-merchant" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Merchant / Counterparty
                </label>
                <input
                  id="entry-merchant"
                  type="text"
                  formControlName="merchant"
                  placeholder="e.g. Whole Foods Market"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
                @if (form.controls.merchant.touched && form.controls.merchant.invalid) {
                  <p class="mt-1 text-xs text-red-600 dark:text-red-400">Merchant is required.</p>
                }
              </div>

              <div>
                <label for="entry-category" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  id="entry-category"
                  formControlName="category"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                >
                  @for (cat of filteredCategories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.label }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label for="entry-description" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Description
              </label>
              <input
                id="entry-description"
                type="text"
                formControlName="description"
                placeholder="Brief summary of the transaction"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
              @if (form.controls.description.touched && form.controls.description.invalid) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400">Description is required.</p>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label for="entry-status" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Settlement Status
                </label>
                <select
                  id="entry-status"
                  formControlName="status"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                >
                  <option value="cleared">Cleared</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label for="entry-notes" class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Notes (Optional)
                </label>
                <input
                  id="entry-notes"
                  type="text"
                  formControlName="notes"
                  placeholder="Invoice ref or memo"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                (click)="ledger.closeModal()"
                class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                {{ isEditing() ? 'Save Changes' : 'Add Entry' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class EntryModalComponent {
  readonly ledger = inject(LedgerService);
  private readonly fb = inject(FormBuilder);
  readonly XIcon = X;

  readonly isEditing = computed(() => this.ledger.editingTransaction() !== null);

  readonly form = this.fb.nonNullable.group({
    type: ['expense' as TransactionType, Validators.required],
    amount: [null as unknown as number, [Validators.required, Validators.min(0.01)]],
    date: ['2026-11-20', Validators.required],
    merchant: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['software' as CategoryId, Validators.required],
    status: ['cleared' as TransactionStatus, Validators.required],
    notes: [''],
  });

  currentType: TransactionType = 'expense';

  readonly filteredCategories = computed(() =>
    this.ledger.categories.filter((c) => c.type === this.currentType)
  );

  constructor() {
    effect(() => {
      const open = this.ledger.modalOpen();
      const tx = this.ledger.editingTransaction();
      if (!open) return;

      if (tx) {
        this.currentType = tx.type;
        this.form.reset({
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          merchant: tx.merchant,
          description: tx.description,
          category: tx.category,
          status: tx.status,
          notes: tx.notes ?? '',
        });
      } else {
        this.currentType = 'expense';
        const defaultMonth = this.ledger.selectedMonth() === 'all' ? '2026-11' : this.ledger.selectedMonth();
        this.form.reset({
          type: 'expense',
          amount: null as unknown as number,
          date: `${defaultMonth}-20`,
          merchant: '',
          description: '',
          category: 'software',
          status: 'cleared',
          notes: '',
        });
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.ledger.modalOpen()) {
      this.ledger.closeModal();
    }
  }

  setType(type: TransactionType): void {
    this.currentType = type;
    this.form.controls.type.setValue(type);
    const validCategories = this.ledger.categories.filter((c) => c.type === type);
    if (!validCategories.some((c) => c.id === this.form.controls.category.value)) {
      this.form.controls.category.setValue(validCategories[0]?.id ?? 'software');
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.ledger.closeModal();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const payload = {
      type: val.type,
      amount: Math.round(Number(val.amount) * 100) / 100,
      date: val.date,
      merchant: val.merchant.trim(),
      description: val.description.trim(),
      category: val.category,
      status: val.status,
      notes: val.notes.trim() || undefined,
    };

    const editing = this.ledger.editingTransaction();
    if (editing) {
      this.ledger.updateTransaction(editing.id, payload);
    } else {
      this.ledger.addTransaction(payload);
    }
    this.ledger.closeModal();
  }
}
