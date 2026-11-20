import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MonthlySummary } from '../../models/ledger.models';

@Component({
  selector: 'app-cashflow-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">Monthly Cashflow</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Income vs. operating expenses across recent ledger periods
          </p>
        </div>

        <div class="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block"></span>
            <span>Income</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block"></span>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      @if (series().length === 0) {
        <div class="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No monthly transactions recorded yet.
        </div>
      } @else {
        <div class="relative">
          <!-- Hover Tooltip Header -->
          <div class="h-6 mb-2 flex items-center justify-between text-xs font-mono tabular-nums">
            @if (activeItem(); as item) {
              <div class="flex flex-wrap items-center gap-4 text-slate-700 dark:text-slate-300">
                <span class="font-semibold text-slate-900 dark:text-slate-100">{{ item.label }}</span>
                <span>In: <strong class="text-emerald-600 dark:text-emerald-400">{{ item.income | currency:'USD':'symbol':'1.0-0' }}</strong></span>
                <span>Out: <strong>{{ item.expenses | currency:'USD':'symbol':'1.0-0' }}</strong></span>
                <span>
                  Net:
                  <strong [class]="item.net >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-600 dark:text-red-400'">
                    {{ item.net | currency:'USD':'symbol':'1.0-0' }}
                  </strong>
                </span>
              </div>
            } @else {
              <span class="text-slate-400 dark:text-slate-500">Hover any month column for period totals</span>
            }
          </div>

          <svg
            viewBox="0 0 640 230"
            class="w-full h-56 overflow-visible select-none"
            role="img"
            aria-label="Monthly income and expenses bar chart"
          >
            <!-- Horizontal Gridlines -->
            @for (tick of yTicks(); track tick.value) {
              <line
                x1="48"
                [attr.y1]="tick.y"
                x2="628"
                [attr.y2]="tick.y"
                class="stroke-slate-100 dark:stroke-slate-800"
                stroke-width="1"
              />
              <text
                x="40"
                [attr.y]="tick.y + 4"
                text-anchor="end"
                class="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {{ tick.label }}
              </text>
            }

            <!-- Month Columns -->
            @for (bar of chartBars(); track bar.item.monthKey) {
              <g
                (mouseenter)="hoveredKey.set(bar.item.monthKey)"
                (mouseleave)="hoveredKey.set(null)"
                class="cursor-pointer"
              >
                <!-- Invisible hover hit target -->
                <rect
                  [attr.x]="bar.groupX - 8"
                  y="12"
                  [attr.width]="bar.groupWidth + 16"
                  height="182"
                  rx="6"
                  [class]="
                    hoveredKey() === bar.item.monthKey
                      ? 'fill-slate-100/70 dark:fill-slate-800/60 transition-colors'
                      : 'fill-transparent'
                  "
                />

                <!-- Income Bar -->
                <rect
                  [attr.x]="bar.incomeX"
                  [attr.y]="bar.incomeY"
                  [attr.width]="bar.barWidth"
                  [attr.height]="bar.incomeHeight"
                  rx="4"
                  class="fill-teal-600 dark:fill-teal-500 transition-opacity duration-150"
                  [attr.opacity]="hoveredKey() && hoveredKey() !== bar.item.monthKey ? 0.55 : 1"
                />

                <!-- Expense Bar -->
                <rect
                  [attr.x]="bar.expenseX"
                  [attr.y]="bar.expenseY"
                  [attr.width]="bar.barWidth"
                  [attr.height]="bar.expenseHeight"
                  rx="4"
                  class="fill-slate-300 dark:fill-slate-600 transition-opacity duration-150"
                  [attr.opacity]="hoveredKey() && hoveredKey() !== bar.item.monthKey ? 0.55 : 1"
                />

                <!-- Month Label -->
                <text
                  [attr.x]="bar.centerX"
                  y="214"
                  text-anchor="middle"
                  class="text-[11px] font-medium fill-slate-600 dark:fill-slate-400"
                >
                  {{ bar.item.shortLabel }}
                </text>
              </g>
            }
          </svg>
        </div>
      }
    </div>
  `,
})
export class CashflowChartComponent {
  readonly series = input.required<MonthlySummary[]>();
  readonly hoveredKey = signal<string | null>(null);

  private readonly chartTop = 16;
  private readonly chartBottom = 190;
  private readonly chartHeight = this.chartBottom - this.chartTop;

  readonly maxValue = computed(() => {
    const data = this.series();
    const rawMax = Math.max(1000, ...data.flatMap((d) => [d.income, d.expenses]));
    return Math.ceil(rawMax / 1000) * 1000;
  });

  readonly yTicks = computed(() => {
    const max = this.maxValue();
    return [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = Math.round(max * ratio);
      const y = this.chartBottom - ratio * this.chartHeight;
      const label = value === 0 ? '$0' : `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
      return { value, y, label };
    });
  });

  readonly activeItem = computed(() => {
    const key = this.hoveredKey();
    if (!key) return null;
    return this.series().find((s) => s.monthKey === key) ?? null;
  });

  readonly chartBars = computed(() => {
    const data = this.series();
    const max = this.maxValue();
    const left = 64;
    const width = 550;
    const slotWidth = width / Math.max(1, data.length);
    const barWidth = Math.min(28, Math.max(16, slotWidth * 0.26));
    const gap = 6;
    const groupWidth = barWidth * 2 + gap;

    return data.map((item, idx) => {
      const centerX = left + slotWidth * idx + slotWidth / 2;
      const groupX = centerX - groupWidth / 2;
      const incomeHeight = Math.max(2, (item.income / max) * this.chartHeight);
      const expenseHeight = Math.max(2, (item.expenses / max) * this.chartHeight);

      return {
        item,
        centerX,
        groupX,
        groupWidth,
        barWidth,
        incomeX: groupX,
        incomeY: this.chartBottom - incomeHeight,
        incomeHeight,
        expenseX: groupX + barWidth + gap,
        expenseY: this.chartBottom - expenseHeight,
        expenseHeight,
      };
    });
  });
}
