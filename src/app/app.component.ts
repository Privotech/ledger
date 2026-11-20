import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import {
  CalendarClock,
  LayoutDashboard,
  LucideAngularModule,
  Menu,
  Moon,
  PieChart,
  Plus,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-angular';
import { filter } from 'rxjs';
import { EntryModalComponent } from './components/entry-modal/entry-modal.component';
import { LedgerService } from './services/ledger.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    EntryModalComponent,
  ],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <!-- Mobile Drawer Backdrop -->
      @if (mobileNavOpen()) {
        <div
          class="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          (click)="mobileNavOpen.set(false)"
        ></div>
      }

      <!-- Workspace Sidebar -->
      <aside
        class="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0"
        [class]="mobileNavOpen() ? 'translate-x-0' : '-translate-x-full'"
      >
        <div>
          <!-- Brand Wordmark -->
          <div class="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            <a
              routerLink="/overview"
              class="text-lg font-bold tracking-tight font-display text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
            >
              ClearLedger
            </a>
            <button
              type="button"
              (click)="mobileNavOpen.set(false)"
              class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Close navigation"
            >
              <lucide-icon [img]="XIcon" [size]="18" />
            </button>
          </div>

          <!-- Period Switcher -->
          <div class="px-4 pt-5 pb-3">
            <label
              for="period-select"
              class="block px-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Active Period
            </label>
            <select
              id="period-select"
              [ngModel]="ledger.selectedMonth()"
              (ngModelChange)="ledger.selectedMonth.set($event)"
              class="w-full px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              @for (m of ledger.availableMonths(); track m.key) {
                <option [value]="m.key">{{ m.label }}</option>
              }
              <option value="all">All Periods</option>
            </select>
          </div>

          <!-- Primary Navigation -->
          <nav aria-label="Workspace views" class="px-3 py-2 space-y-1">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                (click)="mobileNavOpen.set(false)"
                routerLinkActive="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap"
              >
                <lucide-icon [img]="item.icon" [size]="17" />
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>

        <!-- Bottom Workspace Actions -->
        <div class="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            type="button"
            (click)="ledger.toggleTheme()"
            class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span class="flex items-center gap-2.5">
              <lucide-icon [img]="ledger.darkMode() ? SunIcon : MoonIcon" [size]="15" />
              <span>{{ ledger.darkMode() ? 'Light Mode' : 'Dark Mode' }}</span>
            </span>
          </button>

          <button
            type="button"
            (click)="ledger.resetDemoData()"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <lucide-icon [img]="RotateCcwIcon" [size]="15" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </aside>

      <!-- Main Viewport -->
      <div class="flex-1 min-w-0 flex flex-col">
        <!-- Top Header Bar -->
        <header class="h-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              (click)="mobileNavOpen.set(true)"
              class="p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Open navigation"
            >
              <lucide-icon [img]="MenuIcon" [size]="18" />
            </button>

            <div class="flex items-center gap-2 text-sm truncate">
              <span class="text-slate-400 dark:text-slate-500 hidden sm:inline">Workspace</span>
              <span class="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <h1 class="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {{ pageTitle() }}
              </h1>
            </div>
          </div>

          <button
            type="button"
            (click)="ledger.openNewEntryModal()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600"
          >
            <lucide-icon [img]="PlusIcon" [size]="16" />
            <span>New Entry</span>
          </button>
        </header>

        <!-- Route Content -->
        <main class="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <router-outlet />
        </main>
      </div>
    </div>

    <!-- Transaction Add/Edit Modal -->
    <app-entry-modal />

    <!-- Subtle Action Feedback Toast -->
    @if (ledger.toastMessage(); as msg) {
      <div
        role="status"
        aria-live="polite"
        class="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
      >
        {{ msg }}
      </div>
    }
  `,
})
export class AppComponent {
  readonly ledger = inject(LedgerService);
  private readonly router = inject(Router);

  readonly mobileNavOpen = signal(false);
  readonly currentUrl = signal(this.router.url);

  readonly PlusIcon = Plus;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly SunIcon = Sun;
  readonly MoonIcon = Moon;
  readonly RotateCcwIcon = RotateCcw;

  readonly navItems = [
    { path: '/overview', label: 'Overview', icon: LayoutDashboard },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/budgets', label: 'Budgets', icon: SlidersHorizontal },
    { path: '/recurring', label: 'Recurring', icon: CalendarClock },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
  ];

  readonly pageTitle = computed(() => {
    const url = this.currentUrl();
    if (url.includes('transactions')) return 'Transactions';
    if (url.includes('budgets')) return 'Budgets';
    if (url.includes('recurring')) return 'Recurring';
    if (url.includes('analytics')) return 'Analytics';
    return 'Overview';
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
      });
  }
}
