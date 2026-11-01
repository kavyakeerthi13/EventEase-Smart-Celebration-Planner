import { describe, it, expect } from 'vitest';
import { calcGuestTotals, calcDietaryBreakdown } from '../utils';
import type { Guest } from '../types';

describe('Guest Tracking & RSVP Aggregations', () => {
  const mockGuests: Guest[] = [
    {
      id: 'g1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '123-456',
      rsvpStatus: 'attending',
      plusOnes: 1,
      dietary: 'vegetarian',
      dietaryNotes: '',
      tableNumber: 'Table 1',
      group: 'Family',
      notes: '',
      inviteSent: true,
    },
    {
      id: 'g2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '234-567',
      rsvpStatus: 'attending',
      plusOnes: 0,
      dietary: 'gluten-free',
      dietaryNotes: 'Celiac',
      tableNumber: 'Table 1',
      group: 'Friends',
      notes: '',
      inviteSent: true,
    },
    {
      id: 'g3',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      phone: '',
      rsvpStatus: 'declined',
      plusOnes: 0,
      dietary: 'none',
      dietaryNotes: '',
      tableNumber: '',
      group: 'Colleagues',
      notes: '',
      inviteSent: true,
    },
    {
      id: 'g4',
      name: 'Diana Prince',
      email: 'diana@example.com',
      phone: '',
      rsvpStatus: 'tentative',
      plusOnes: 1,
      dietary: 'vegan',
      dietaryNotes: '',
      tableNumber: '',
      group: 'Family',
      notes: '',
      inviteSent: false,
    },
    {
      id: 'g5',
      name: 'Ethan Hunt',
      email: 'ethan@example.com',
      phone: '',
      rsvpStatus: 'invited',
      plusOnes: 0,
      dietary: 'none',
      dietaryNotes: '',
      tableNumber: '',
      group: 'Friends',
      notes: '',
      inviteSent: true,
    },
  ];

  it('calculates RSVP status breakdown correctly', () => {
    const totals = calcGuestTotals(mockGuests);
    expect(totals.total).toBe(5);
    expect(totals.attending).toBe(2);
    expect(totals.declined).toBe(1);
    expect(totals.tentative).toBe(1);
    expect(totals.invited).toBe(1);
    expect(totals.awaiting).toBe(0);
  });

  it('counts attending plus-ones correctly', () => {
    const totals = calcGuestTotals(mockGuests);
    // Alice is attending with 1 plusOne, Bob has 0. Diana has 1 but is tentative (not attending).
    expect(totals.plusOnes).toBe(1);
  });

  it('aggregates dietary requirements strictly for confirmed attendees', () => {
    const breakdown = calcDietaryBreakdown(mockGuests);
    // Alice (vegetarian) + 1 plus-one = 2 vegetarian
    expect(breakdown['vegetarian']).toBe(2);
    // Bob (gluten-free) = 1
    expect(breakdown['gluten-free']).toBe(1);
    // Diana is tentative, so vegan should not appear in catering confirmed breakdown
    expect(breakdown['vegan']).toBeUndefined();
  });
});
