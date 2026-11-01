import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  Event,
  Guest,
  Expense,
  Task,
  ScheduleItem,
  Vendor,
  Toast,
  ActiveTab,
  NewGuest,
  NewExpense,
  NewTask,
  NewScheduleItem,
  NewVendor,
} from '../types';
import { SAMPLE_EVENTS } from '../data/sampleEvents';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  events: Event[];
  activeEventId: string;
  activeTab: ActiveTab;
  toasts: Toast[];
}

const STORAGE_KEY = 'eventease_v1';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Basic validation
      if (Array.isArray(parsed.events) && parsed.events.length > 0) {
        return { ...parsed, toasts: [] };
      }
    }
  } catch {
    // Corrupt storage – fall through to defaults
  }
  return {
    events: SAMPLE_EVENTS,
    activeEventId: SAMPLE_EVENTS[0].id,
    activeTab: 'dashboard',
    toasts: [],
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ACTIVE_EVENT'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTab }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'ADD_GUEST'; payload: { eventId: string; guest: Guest } }
  | { type: 'UPDATE_GUEST'; payload: { eventId: string; guest: Guest } }
  | { type: 'DELETE_GUEST'; payload: { eventId: string; guestId: string } }
  | { type: 'BULK_ADD_GUESTS'; payload: { eventId: string; guests: Guest[] } }
  | { type: 'ADD_EXPENSE'; payload: { eventId: string; expense: Expense } }
  | { type: 'UPDATE_EXPENSE'; payload: { eventId: string; expense: Expense } }
  | { type: 'DELETE_EXPENSE'; payload: { eventId: string; expenseId: string } }
  | { type: 'ADD_TASK'; payload: { eventId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { eventId: string; task: Task } }
  | { type: 'DELETE_TASK'; payload: { eventId: string; taskId: string } }
  | { type: 'ADD_SCHEDULE_ITEM'; payload: { eventId: string; item: ScheduleItem } }
  | { type: 'UPDATE_SCHEDULE_ITEM'; payload: { eventId: string; item: ScheduleItem } }
  | { type: 'DELETE_SCHEDULE_ITEM'; payload: { eventId: string; itemId: string } }
  | { type: 'ADD_VENDOR'; payload: { eventId: string; vendor: Vendor } }
  | { type: 'UPDATE_VENDOR'; payload: { eventId: string; vendor: Vendor } }
  | { type: 'DELETE_VENDOR'; payload: { eventId: string; vendorId: string } }
  | { type: 'SET_THEME'; payload: { eventId: string; themeId: string } }
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'IMPORT_DATA'; payload: Event[] }
  | { type: 'RESET_TO_SAMPLE' };

function updateEventIn(events: Event[], eventId: string, updater: (e: Event) => Event): Event[] {
  return events.map((ev) => (ev.id === eventId ? { ...updater(ev), updatedAt: new Date().toISOString() } : ev));
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_EVENT':
      return { ...state, activeEventId: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload], activeEventId: action.payload.id };
    case 'UPDATE_EVENT':
      return { ...state, events: state.events.map((e) => (e.id === action.payload.id ? action.payload : e)) };
    case 'DELETE_EVENT': {
      const remaining = state.events.filter((e) => e.id !== action.payload);
      return {
        ...state,
        events: remaining,
        activeEventId: remaining.length > 0 ? remaining[0].id : '',
      };
    }
    case 'ADD_GUEST':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          guests: [...e.guests, action.payload.guest],
        })),
      };
    case 'UPDATE_GUEST':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          guests: e.guests.map((g) => (g.id === action.payload.guest.id ? action.payload.guest : g)),
        })),
      };
    case 'DELETE_GUEST':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          guests: e.guests.filter((g) => g.id !== action.payload.guestId),
        })),
      };
    case 'BULK_ADD_GUESTS':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          guests: [...e.guests, ...action.payload.guests],
        })),
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          expenses: [...e.expenses, action.payload.expense],
        })),
      };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          expenses: e.expenses.map((ex) => (ex.id === action.payload.expense.id ? action.payload.expense : ex)),
        })),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          expenses: e.expenses.filter((ex) => ex.id !== action.payload.expenseId),
        })),
      };
    case 'ADD_TASK':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          tasks: [...e.tasks, action.payload.task],
        })),
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          tasks: e.tasks.map((t) => (t.id === action.payload.task.id ? action.payload.task : t)),
        })),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          tasks: e.tasks.filter((t) => t.id !== action.payload.taskId),
        })),
      };
    case 'ADD_SCHEDULE_ITEM':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          schedule: [...e.schedule, action.payload.item],
        })),
      };
    case 'UPDATE_SCHEDULE_ITEM':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          schedule: e.schedule.map((s) => (s.id === action.payload.item.id ? action.payload.item : s)),
        })),
      };
    case 'DELETE_SCHEDULE_ITEM':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          schedule: e.schedule.filter((s) => s.id !== action.payload.itemId),
        })),
      };
    case 'ADD_VENDOR':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          vendors: [...e.vendors, action.payload.vendor],
        })),
      };
    case 'UPDATE_VENDOR':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          vendors: e.vendors.map((v) => (v.id === action.payload.vendor.id ? action.payload.vendor : v)),
        })),
      };
    case 'DELETE_VENDOR':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          vendors: e.vendors.filter((v) => v.id !== action.payload.vendorId),
        })),
      };
    case 'SET_THEME':
      return {
        ...state,
        events: updateEventIn(state.events, action.payload.eventId, (e) => ({
          ...e,
          themeId: action.payload.themeId,
        })),
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'IMPORT_DATA':
      return { ...state, events: action.payload, activeEventId: action.payload[0]?.id ?? '' };
    case 'RESET_TO_SAMPLE':
      return { ...state, events: SAMPLE_EVENTS, activeEventId: SAMPLE_EVENTS[0].id };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface EventContextValue {
  state: AppState;
  activeEvent: Event | undefined;
  // Navigation
  setActiveEvent: (id: string) => void;
  setActiveTab: (tab: ActiveTab) => void;
  // Events
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  // Guests
  addGuest: (eventId: string, guest: NewGuest) => void;
  updateGuest: (eventId: string, guest: Guest) => void;
  deleteGuest: (eventId: string, guestId: string) => void;
  bulkAddGuests: (eventId: string, guests: NewGuest[]) => void;
  // Expenses
  addExpense: (eventId: string, expense: NewExpense) => void;
  updateExpense: (eventId: string, expense: Expense) => void;
  deleteExpense: (eventId: string, expenseId: string) => void;
  // Tasks
  addTask: (eventId: string, task: NewTask) => void;
  updateTask: (eventId: string, task: Task) => void;
  deleteTask: (eventId: string, taskId: string) => void;
  // Schedule
  addScheduleItem: (eventId: string, item: NewScheduleItem) => void;
  updateScheduleItem: (eventId: string, item: ScheduleItem) => void;
  deleteScheduleItem: (eventId: string, itemId: string) => void;
  // Vendors
  addVendor: (eventId: string, vendor: NewVendor) => void;
  updateVendor: (eventId: string, vendor: Vendor) => void;
  deleteVendor: (eventId: string, vendorId: string) => void;
  // Theme
  setTheme: (eventId: string, themeId: string) => void;
  // Toasts
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  // Data management
  exportData: () => void;
  importData: (json: string) => boolean;
  resetToSample: () => void;
}

const EventContext = createContext<EventContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      const { toasts: _toasts, ...persistable } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // Storage quota exceeded – silently skip
    }
  }, [state]);

  const activeEvent = state.events.find((e) => e.id === state.activeEventId);

  const setActiveEvent = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_EVENT', payload: id }), []);
  const setActiveTab = useCallback((tab: ActiveTab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }), []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId('toast');
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  // Events
  const addEvent = useCallback((ev: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const event: Event = { ...ev, id: generateId('ev'), createdAt: now, updatedAt: now };
    dispatch({ type: 'ADD_EVENT', payload: event });
    showToast(`"${event.name}" created!`, 'success');
  }, [showToast]);

  const updateEvent = useCallback((event: Event) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { ...event, updatedAt: new Date().toISOString() } });
    showToast('Event updated', 'success');
  }, [showToast]);

  const deleteEvent = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
    showToast('Event deleted', 'info');
  }, [showToast]);

  // Guests
  const addGuest = useCallback((eventId: string, g: NewGuest) => {
    const guest: Guest = { ...g, id: generateId('g') };
    dispatch({ type: 'ADD_GUEST', payload: { eventId, guest } });
    showToast(`${guest.name} added to guest list`, 'success');
  }, [showToast]);

  const updateGuest = useCallback((eventId: string, guest: Guest) => {
    dispatch({ type: 'UPDATE_GUEST', payload: { eventId, guest } });
    showToast(`${guest.name} updated`, 'success');
  }, [showToast]);

  const deleteGuest = useCallback((eventId: string, guestId: string) => {
    dispatch({ type: 'DELETE_GUEST', payload: { eventId, guestId } });
    showToast('Guest removed', 'info');
  }, [showToast]);

  const bulkAddGuests = useCallback((eventId: string, guests: NewGuest[]) => {
    const withIds: Guest[] = guests.map((g) => ({ ...g, id: generateId('g') }));
    dispatch({ type: 'BULK_ADD_GUESTS', payload: { eventId, guests: withIds } });
    showToast(`${withIds.length} guests added`, 'success');
  }, [showToast]);

  // Expenses
  const addExpense = useCallback((eventId: string, ex: NewExpense) => {
    const expense: Expense = { ...ex, id: generateId('exp') };
    dispatch({ type: 'ADD_EXPENSE', payload: { eventId, expense } });
    showToast('Expense added', 'success');
  }, [showToast]);

  const updateExpense = useCallback((eventId: string, expense: Expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: { eventId, expense } });
    showToast('Expense updated', 'success');
  }, [showToast]);

  const deleteExpense = useCallback((eventId: string, expenseId: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: { eventId, expenseId } });
    showToast('Expense removed', 'info');
  }, [showToast]);

  // Tasks
  const addTask = useCallback((eventId: string, t: NewTask) => {
    const task: Task = { ...t, id: generateId('t') };
    dispatch({ type: 'ADD_TASK', payload: { eventId, task } });
    showToast('Task added', 'success');
  }, [showToast]);

  const updateTask = useCallback((eventId: string, task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { eventId, task } });
  }, []);

  const deleteTask = useCallback((eventId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { eventId, taskId } });
    showToast('Task removed', 'info');
  }, [showToast]);

  // Schedule
  const addScheduleItem = useCallback((eventId: string, it: NewScheduleItem) => {
    const item: ScheduleItem = { ...it, id: generateId('s') };
    dispatch({ type: 'ADD_SCHEDULE_ITEM', payload: { eventId, item } });
    showToast('Schedule item added', 'success');
  }, [showToast]);

  const updateScheduleItem = useCallback((eventId: string, item: ScheduleItem) => {
    dispatch({ type: 'UPDATE_SCHEDULE_ITEM', payload: { eventId, item } });
    showToast('Schedule item updated', 'success');
  }, [showToast]);

  const deleteScheduleItem = useCallback((eventId: string, itemId: string) => {
    dispatch({ type: 'DELETE_SCHEDULE_ITEM', payload: { eventId, itemId } });
    showToast('Schedule item removed', 'info');
  }, [showToast]);

  // Vendors
  const addVendor = useCallback((eventId: string, vd: NewVendor) => {
    const vendor: Vendor = { ...vd, id: generateId('v') };
    dispatch({ type: 'ADD_VENDOR', payload: { eventId, vendor } });
    showToast(`${vendor.name} added`, 'success');
  }, [showToast]);

  const updateVendor = useCallback((eventId: string, vendor: Vendor) => {
    dispatch({ type: 'UPDATE_VENDOR', payload: { eventId, vendor } });
    showToast('Vendor updated', 'success');
  }, [showToast]);

  const deleteVendor = useCallback((eventId: string, vendorId: string) => {
    dispatch({ type: 'DELETE_VENDOR', payload: { eventId, vendorId } });
    showToast('Vendor removed', 'info');
  }, [showToast]);

  // Theme
  const setTheme = useCallback((eventId: string, themeId: string) => {
    dispatch({ type: 'SET_THEME', payload: { eventId, themeId } });
    showToast('Theme updated ✨', 'success');
  }, [showToast]);

  // Data management
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state.events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventease-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully', 'success');
  }, [state.events, showToast]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as Event[];
      if (!Array.isArray(parsed) || parsed.length === 0) return false;
      dispatch({ type: 'IMPORT_DATA', payload: parsed });
      showToast(`${parsed.length} event(s) imported`, 'success');
      return true;
    } catch {
      showToast('Invalid file format', 'error');
      return false;
    }
  }, [showToast]);

  const resetToSample = useCallback(() => {
    dispatch({ type: 'RESET_TO_SAMPLE' });
    showToast('Reset to sample events', 'info');
  }, [showToast]);

  const value: EventContextValue = {
    state,
    activeEvent,
    setActiveEvent,
    setActiveTab,
    addEvent,
    updateEvent,
    deleteEvent,
    addGuest,
    updateGuest,
    deleteGuest,
    bulkAddGuests,
    addExpense,
    updateExpense,
    deleteExpense,
    addTask,
    updateTask,
    deleteTask,
    addScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    addVendor,
    updateVendor,
    deleteVendor,
    setTheme,
    showToast,
    removeToast,
    exportData,
    importData,
    resetToSample,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvents(): EventContextValue {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be used within EventProvider');
  return ctx;
}
