import { describe, it, expect } from 'vitest';
import { calcTaskStats, isOverdue } from '../utils';
import type { Task } from '../types';

describe('Task Scheduling & Progress Metrics', () => {
  const mockTasks: Task[] = [
    {
      id: 't1',
      title: 'Book Photographer',
      description: '',
      status: 'done',
      priority: 'high',
      milestone: '3-6months',
      assignee: 'Bride',
      dueDate: '2025-01-01',
      tags: [],
    },
    {
      id: 't2',
      title: 'Tasting session',
      description: '',
      status: 'inprogress',
      priority: 'medium',
      milestone: '1month',
      assignee: 'Groom',
      dueDate: '2026-12-31',
      tags: [],
    },
    {
      id: 't3',
      title: 'Send out favors',
      description: '',
      status: 'todo',
      priority: 'low',
      milestone: 'finalweek',
      assignee: 'Coordinator',
      dueDate: '2020-01-01', // definitely overdue in past
      tags: [],
    },
    {
      id: 't4',
      title: 'DJ Playlist review',
      description: '',
      status: 'todo',
      priority: 'high',
      milestone: 'finalweek',
      assignee: 'Host',
      dueDate: '2029-01-01', // future
      tags: [],
    },
  ];

  it('calculates completion count and percentage accurately', () => {
    const stats = calcTaskStats(mockTasks);
    expect(stats.total).toBe(4);
    expect(stats.done).toBe(1);
    expect(stats.inprogress).toBe(1);
    expect(stats.todo).toBe(2);
    expect(stats.completionPct).toBe(25); // 1 / 4 * 100
  });

  it('detects overdue tasks correctly', () => {
    expect(isOverdue('2020-01-01')).toBe(true);
    expect(isOverdue('2030-01-01')).toBe(false);

    const stats = calcTaskStats(mockTasks);
    // Task t3 is todo and due in 2020 -> overdue
    // Task t1 was due in 2025, but its status is 'done', so it shouldn't be counted as overdue
    expect(stats.overdue).toBe(1);
  });

  it('handles empty task list without division by zero', () => {
    const stats = calcTaskStats([]);
    expect(stats.total).toBe(0);
    expect(stats.completionPct).toBe(0);
    expect(stats.overdue).toBe(0);
  });
});
