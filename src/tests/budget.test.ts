import { describe, it, expect } from 'vitest';
import {
  calcTotalSpent,
  calcTotalPaid,
  calcTotalPending,
  calcBudgetRemaining,
  calcBudgetHealthPercent,
  calcSpentByCategory,
  calcPerGuestCost,
} from '../utils';
import type { Expense } from '../types';

describe('Budget Calculations', () => {
  const mockExpenses: Expense[] = [
    {
      id: 'e1',
      categoryId: 'cat-venue',
      description: 'Ballroom deposit',
      vendor: 'Rosewood',
      amount: 5000,
      amountPaid: 2500,
      paymentStatus: 'partial',
      date: '2026-06-01',
      notes: '',
    },
    {
      id: 'e2',
      categoryId: 'cat-catering',
      description: 'Buffet dinner',
      vendor: 'Gourmet',
      amount: 3000,
      amountPaid: 3000,
      paymentStatus: 'paid',
      date: '2026-06-05',
      notes: '',
    },
    {
      id: 'e3',
      categoryId: 'cat-venue',
      description: 'Lighting and stage',
      vendor: 'Rosewood',
      amount: 1200,
      amountPaid: 0,
      paymentStatus: 'unpaid',
      date: '2026-06-10',
      notes: '',
    },
  ];

  it('calculates total expenses correctly', () => {
    const total = calcTotalSpent(mockExpenses);
    expect(total).toBe(9200); // 5000 + 3000 + 1200
  });

  it('calculates total paid amount correctly', () => {
    const paid = calcTotalPaid(mockExpenses);
    expect(paid).toBe(5500); // 2500 + 3000 + 0
  });

  it('calculates total pending amount correctly', () => {
    const pending = calcTotalPending(mockExpenses);
    expect(pending).toBe(3700); // 2500 + 0 + 1200
  });

  it('calculates remaining budget accurately', () => {
    const budget = 10000;
    const remaining = calcBudgetRemaining(budget, mockExpenses);
    expect(remaining).toBe(800); // 10000 - 9200
  });

  it('handles over-budget scenarios gracefully', () => {
    const budget = 8000;
    const remaining = calcBudgetRemaining(budget, mockExpenses);
    expect(remaining).toBe(-1200); // 8000 - 9200
  });

  it('computes budget health percentage correctly', () => {
    expect(calcBudgetHealthPercent(10000, mockExpenses)).toBe(92);
    expect(calcBudgetHealthPercent(0, mockExpenses)).toBe(0);
  });

  it('filters and sums spent amount by category', () => {
    const venueSpent = calcSpentByCategory('cat-venue', mockExpenses);
    expect(venueSpent).toBe(6200); // 5000 + 1200

    const cateringSpent = calcSpentByCategory('cat-catering', mockExpenses);
    expect(cateringSpent).toBe(3000);

    const decorSpent = calcSpentByCategory('cat-decor', mockExpenses);
    expect(decorSpent).toBe(0);
  });

  it('calculates per-guest cost accurately', () => {
    // 9200 spent with 46 guests = 200 per guest
    expect(calcPerGuestCost(mockExpenses, 46)).toBe(200);
    // 0 guests should not throw division by zero
    expect(calcPerGuestCost(mockExpenses, 0)).toBe(0);
  });
});
