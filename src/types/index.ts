// Core domain types for EventEase

export type EventType = 'wedding' | 'birthday' | 'college' | 'party' | 'other';

export type RSVPStatus = 'attending' | 'declined' | 'tentative' | 'invited' | 'awaiting';

export type TaskStatus = 'todo' | 'inprogress' | 'done';

export type TaskPriority = 'high' | 'medium' | 'low';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export type DietaryPreference =
  | 'none'
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'halal'
  | 'kosher'
  | 'nut-allergy'
  | 'dairy-free'
  | 'other';

export interface Theme {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bg: string;
  text: string;
  surface: string;
  border: string;
  muted: string;
  emoji: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  allocated: number;
  color: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  description: string;
  vendor: string;
  amount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  date: string;
  notes: string;
  receipt?: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  rsvpStatus: RSVPStatus;
  plusOnes: number;
  dietary: DietaryPreference;
  dietaryNotes: string;
  tableNumber: string;
  group: string;
  notes: string;
  inviteSent: boolean;
  rsvpDate?: string;
}

export type TaskMilestone =
  | '3-6months'
  | '1month'
  | 'finalweek'
  | 'dayof'
  | 'postevent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  milestone: TaskMilestone;
  assignee: string;
  dueDate: string;
  completedAt?: string;
  tags: string[];
}

export interface ScheduleItem {
  id: string;
  time: string; // HH:MM format
  duration: number; // minutes
  activity: string;
  location: string;
  responsiblePerson: string;
  notes: string;
  category: 'ceremony' | 'reception' | 'entertainment' | 'logistics' | 'break' | 'other';
  status: 'pending' | 'inprogress' | 'completed';
}

export interface Vendor {
  id: string;
  name: string;
  service: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  quotedAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  contractSigned: boolean;
  notes: string;
  rating: number;
  categoryId?: string;
}

export interface MoodboardItem {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  category: string;
}

export interface EventStats {
  totalBudget: number;
  totalSpent: number;
  totalPending: number;
  guestCount: number;
  confirmedGuests: number;
  taskCount: number;
  completedTasks: number;
  daysUntilEvent: number;
}

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string; // ISO date string
  endDate?: string;
  time: string;
  venue: string;
  address: string;
  description: string;
  coverEmoji: string;
  coverGradient: string;
  hostName: string;
  totalBudget: number;
  themeId: string;
  customTheme?: Partial<Theme>;
  guests: Guest[];
  expenses: Expense[];
  budgetCategories: BudgetCategory[];
  tasks: Task[];
  schedule: ScheduleItem[];
  vendors: Vendor[];
  createdAt: string;
  updatedAt: string;
}

// Form state types (partial for creation / editing)
export type NewEvent = Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'guests' | 'expenses' | 'tasks' | 'schedule' | 'vendors'>;
export type NewGuest = Omit<Guest, 'id'>;
export type NewExpense = Omit<Expense, 'id'>;
export type NewTask = Omit<Task, 'id' | 'completedAt'>;
export type NewScheduleItem = Omit<ScheduleItem, 'id'>;
export type NewVendor = Omit<Vendor, 'id'>;

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type ActiveTab =
  | 'dashboard'
  | 'budget'
  | 'guests'
  | 'tasks'
  | 'themes'
  | 'schedule'
  | 'vendors'
  | 'export';
