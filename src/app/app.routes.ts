import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { BudgetsComponent } from './pages/budgets/budgets.component';
import { RecurringComponent } from './pages/recurring/recurring.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard · ClearLedger' },
  { path: 'overview', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'transactions', component: TransactionsComponent, title: 'Transactions · ClearLedger' },
  { path: 'budgets', component: BudgetsComponent, title: 'Budgets · ClearLedger' },
  { path: 'recurring', component: RecurringComponent, title: 'Recurring · ClearLedger' },
  { path: 'analytics', component: AnalyticsComponent, title: 'Analytics · ClearLedger' },
  { path: '**', redirectTo: 'dashboard' },
];
