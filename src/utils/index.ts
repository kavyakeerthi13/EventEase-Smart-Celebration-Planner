// Pure utility functions for EventEase calculations

import type { Event, Expense, Guest, Task } from '../types';

// ─── Date Utilities ───────────────────────────────────────────────────────────

export function getDaysUntilEvent(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(dueDateStr: string): boolean {
  if (!dueDateStr) return false;
  const due = new Date(dueDateStr + 'T23:59:59');
  return due < new Date();
}

export function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)} days ago`;
  if (days === 0) return "Today! 🎉";
  if (days === 1) return "Tomorrow!";
  if (days < 7) return `${days} days to go`;
  if (days < 30) return `${Math.ceil(days / 7)} weeks to go`;
  if (days < 365) return `${Math.ceil(days / 30)} months to go`;
  return `${Math.ceil(days / 365)} year(s) to go`;
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// ─── Budget Calculations ───────────────────────────────────────────────────────

export function calcTotalSpent(expenses: Expense[]): number {
  return expenses.reduce((sum, ex) => sum + ex.amount, 0);
}

export function calcTotalPaid(expenses: Expense[]): number {
  return expenses.reduce((sum, ex) => sum + ex.amountPaid, 0);
}

export function calcTotalPending(expenses: Expense[]): number {
  return expenses.reduce((sum, ex) => sum + (ex.amount - ex.amountPaid), 0);
}

export function calcBudgetRemaining(budget: number, expenses: Expense[]): number {
  return budget - calcTotalSpent(expenses);
}

export function calcBudgetHealthPercent(budget: number, expenses: Expense[]): number {
  if (budget === 0) return 0;
  return Math.min(100, Math.round((calcTotalSpent(expenses) / budget) * 100));
}

export function calcSpentByCategory(categoryId: string, expenses: Expense[]): number {
  return expenses.filter((e) => e.categoryId === categoryId).reduce((sum, e) => sum + e.amount, 0);
}

export function calcPerGuestCost(expenses: Expense[], confirmedGuests: number): number {
  if (confirmedGuests === 0) return 0;
  return Math.round(calcTotalSpent(expenses) / confirmedGuests);
}

// ─── Guest Calculations ────────────────────────────────────────────────────────

export function calcGuestTotals(guests: Guest[]) {
  const attending = guests.filter((g) => g.rsvpStatus === 'attending').length;
  const declined = guests.filter((g) => g.rsvpStatus === 'declined').length;
  const tentative = guests.filter((g) => g.rsvpStatus === 'tentative').length;
  const invited = guests.filter((g) => g.rsvpStatus === 'invited').length;
  const awaiting = guests.filter((g) => g.rsvpStatus === 'awaiting').length;
  const plusOnes = guests.filter((g) => g.rsvpStatus === 'attending').reduce((s, g) => s + g.plusOnes, 0);
  return { attending, declined, tentative, invited, awaiting, plusOnes, total: guests.length };
}

export function calcDietaryBreakdown(guests: Guest[]) {
  const attending = guests.filter((g) => g.rsvpStatus === 'attending');
  const breakdown: Record<string, number> = {};
  attending.forEach((g) => {
    const key = g.dietary === 'none' ? 'Standard' : g.dietary;
    breakdown[key] = (breakdown[key] ?? 0) + 1 + g.plusOnes;
  });
  return breakdown;
}

// ─── Task Calculations ────────────────────────────────────────────────────────

export function calcTaskStats(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inprogress = tasks.filter((t) => t.status === 'inprogress').length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const overdue = tasks.filter((t) => t.status !== 'done' && isOverdue(t.dueDate)).length;
  const completionPct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, inprogress, todo, overdue, completionPct };
}

// ─── Event Summary ────────────────────────────────────────────────────────────

export function calcEventStats(event: Event) {
  const { guests, expenses, tasks } = event;
  const { attending, plusOnes } = calcGuestTotals(guests);
  return {
    totalBudget: event.totalBudget,
    totalSpent: calcTotalSpent(expenses),
    totalPending: calcTotalPending(expenses),
    guestCount: guests.length,
    confirmedGuests: attending + plusOnes,
    taskStats: calcTaskStats(tasks),
    daysUntilEvent: getDaysUntilEvent(event.date),
  };
}

// ─── Sanitization ─────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and script content to prevent XSS when displaying
 * user-supplied text in dangerouslySetInnerHTML contexts.
 * For this app we use textContent-based rendering, so this is a belt-and-suspenders guard.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/** Validates a positive monetary amount string */
export function isValidAmount(val: string): boolean {
  const num = parseFloat(val);
  return !isNaN(num) && num >= 0;
}

/** Validates a date string in YYYY-MM-DD format */
export function isValidDate(val: string): boolean {
  if (!val) return false;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

/** Validates a non-empty name string (max 200 chars) */
export function isValidName(val: string): boolean {
  return val.trim().length > 0 && val.trim().length <= 200;
}

/** Basic email format validation */
export function isValidEmail(val: string): boolean {
  if (!val) return true; // email is optional in forms
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

/** Basic phone validation (allows +, digits, spaces, dashes) */
export function isValidPhone(val: string): boolean {
  if (!val) return true;
  return /^[\d+\-\s()]{7,20}$/.test(val);
}

// ─── CSV Export ────────────────────────────────────────────────────────────────

export function downloadCSV(rows: string[][], filename: string): void {
  const csvContent = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportGuestsCSV(guests: Guest[], eventName: string): void {
  const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Plus Ones', 'Dietary', 'Dietary Notes', 'Table', 'Group', 'Notes'];
  const rows = guests.map((g) => [
    g.name, g.email, g.phone, g.rsvpStatus, String(g.plusOnes),
    g.dietary, g.dietaryNotes, g.tableNumber, g.group, g.notes,
  ]);
  downloadCSV([headers, ...rows], `${eventName}-guests.csv`);
}

export function exportExpensesCSV(expenses: Expense[], eventName: string): void {
  const headers = ['Description', 'Vendor', 'Amount', 'Amount Paid', 'Remaining', 'Payment Status', 'Date', 'Notes'];
  const rows = expenses.map((e) => [
    e.description, e.vendor, String(e.amount), String(e.amountPaid),
    String(e.amount - e.amountPaid), e.paymentStatus, e.date, e.notes,
  ]);
  downloadCSV([headers, ...rows], `${eventName}-expenses.csv`);
}

// ─── Miscellaneous ────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function pluralize(count: number, word: string, plural?: string): string {
  return count === 1 ? `${count} ${word}` : `${count} ${plural ?? word + 's'}`;
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    wedding: '💍 Wedding',
    birthday: '🎂 Birthday',
    college: '🎓 College Event',
    party: '🥂 Party',
    other: '🎉 Other',
  };
  return labels[type] ?? '🎉 Event';
}
