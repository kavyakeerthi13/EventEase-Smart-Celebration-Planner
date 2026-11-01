import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { EventProvider } from '../context/EventContext';

describe('EventEase App End-to-End Component Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the header with app branding and sample event', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    expect(screen.getAllByText(/EventEase/i).length).toBeGreaterThan(0);
    // Should display the first preloaded event name (Sophia & Liam's Fairytale Wedding)
    expect(screen.getAllByText(/Sophia & Liam's Fairytale Wedding/i).length).toBeGreaterThan(0);
  });

  it('renders KPI stat cards on Dashboard', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    expect(screen.getByText(/Budget Used/i)).toBeInTheDocument();
    expect(screen.getByText(/RSVP Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Tasks Done/i)).toBeInTheDocument();
  });

  it('allows navigation across tabs: Budget, Guests, Tasks, Themes, Run Sheet, Vendors, Export', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    // Click Budget tab
    const budgetTab = screen.getByRole('button', { name: /^Budget$/i });
    fireEvent.click(budgetTab);
    expect(screen.getByText(/Budget Utilization/i)).toBeInTheDocument();
    expect(screen.getByText(/Expense Ledger/i)).toBeInTheDocument();

    // Click Guests tab
    const guestsTab = screen.getByRole('button', { name: /^Guests$/i });
    fireEvent.click(guestsTab);
    expect(screen.getByText(/Dietary Requirements/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Guests/i)).toBeInTheDocument();

    // Click Tasks tab
    const tasksTab = screen.getByRole('button', { name: /^Tasks$/i });
    fireEvent.click(tasksTab);
    expect(screen.getByText(/Task Scheduling/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kanban/i })).toBeInTheDocument();

    // Click Themes tab
    const themesTab = screen.getByRole('button', { name: /^Themes$/i });
    fireEvent.click(themesTab);
    expect(screen.getByText(/Theme Selection & Aesthetics/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Blushing Rose/i })).toBeInTheDocument();

    // Click Run Sheet tab
    const scheduleTab = screen.getByRole('button', { name: /^Run Sheet$/i });
    fireEvent.click(scheduleTab);
    expect(screen.getByText(/Day-of-Event Run Sheet/i)).toBeInTheDocument();

    // Click Vendors tab
    const vendorsTab = screen.getByRole('button', { name: /^Vendors$/i });
    fireEvent.click(vendorsTab);
    expect(screen.getByText(/Vendor Directory & Contracts/i)).toBeInTheDocument();

    // Click Export tab
    const exportTab = screen.getByRole('button', { name: /^Export$/i });
    fireEvent.click(exportTab);
    expect(screen.getByText(/Official Celebration Master Brief/i)).toBeInTheDocument();
  });

  it('filters guests by RSVP status in GuestTracker', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    // Navigate to Guests tab
    fireEvent.click(screen.getByRole('button', { name: /Guests/i }));

    const rsvpSelect = screen.getByLabelText(/Filter by RSVP status/i);
    fireEvent.change(rsvpSelect, { target: { value: 'attending' } });

    // Should still display attending guests
    expect(screen.getByText(/Eleanor Hartwell/i)).toBeInTheDocument();
  });

  it('cycles RSVP status when clicking on guest status badge', () => {
    render(
      <EventProvider>
        <App />
      </EventProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Guests/i }));

    const rsvpButtons = screen.getAllByTitle(/Click to cycle RSVP status/i);
    expect(rsvpButtons.length).toBeGreaterThan(0);
    const initialText = rsvpButtons[0].textContent;

    fireEvent.click(rsvpButtons[0]);
    expect(rsvpButtons[0].textContent).not.toBe(initialText);
  });
});
