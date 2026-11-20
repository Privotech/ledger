import { Routes } from '@angular/router';
import { OverviewComponent } from './pages/overview/overview.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { BudgetsComponent } from './pages/budgets/budgets.component';
import { RecurringComponent } from './pages/recurring/recurring.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';

export const routes: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: OverviewComponent, title: 'Overview · ClearLedger' },
  { path: 'transactions', component: TransactionsComponent, title: 'Transactions · ClearLedger' },
  { path: 'budgets', component: BudgetsComponent, title: 'Budgets · ClearLedger' },
  { path: 'recurring', component: RecurringComponent, title: 'Recurring · ClearLedger' },
  { path: 'analytics', component: AnalyticsComponent, title: 'Analytics · ClearLedger' },
  { path: '**', redirectTo: 'overview' },
];
