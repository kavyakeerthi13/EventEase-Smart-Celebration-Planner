import React, { useState } from 'react';
import {
  CheckSquare, Plus, Pencil, Trash2, Check, Clock, AlertTriangle,
  List, LayoutGrid
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { isOverdue, sanitizeText, isValidName } from '../../utils';
import Modal from '../common/Modal';
import type { Task, TaskStatus, TaskPriority, TaskMilestone, NewTask } from '../../types';

// Dynamic import of confetti to avoid SSR issues
let confetti: ((opts: object) => void) | null = null;
import('canvas-confetti').then((mod) => { confetti = mod.default; }).catch(() => {});

const MILESTONE_CONFIG: Record<TaskMilestone, { label: string; emoji: string; color: string }> = {
  '3-6months': { label: '3-6 Months Out', emoji: '📅', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  '1month': { label: '1 Month Out', emoji: '🗓️', color: 'bg-violet-50 border-violet-200 text-violet-800' },
  'finalweek': { label: 'Final Week', emoji: '⚡', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  'dayof': { label: 'Day Of Event', emoji: '🎉', color: 'bg-red-50 border-red-200 text-red-800' },
  'postevent': { label: 'Post Event', emoji: '✅', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  high: { label: 'High', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string; headerColor: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-50 border-gray-200', headerColor: 'bg-gray-100 text-gray-600' },
  { id: 'inprogress', label: 'In Progress', color: 'bg-blue-50 border-blue-200', headerColor: 'bg-blue-100 text-blue-700' },
  { id: 'done', label: 'Done ✓', color: 'bg-emerald-50 border-emerald-200', headerColor: 'bg-emerald-100 text-emerald-700' },
];

const EMPTY_TASK: NewTask = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  milestone: '1month',
  assignee: '',
  dueDate: '',
  tags: [],
};

interface TaskErrors { title?: string; dueDate?: string; }

function validateTask(t: NewTask): TaskErrors {
  const e: TaskErrors = {};
  if (!isValidName(t.title)) e.title = 'Task title is required';
  return e;
}

function fireConfetti() {
  if (!confetti) return;
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
  });
}

export default function TaskScheduler() {
  const { activeEvent, addTask, updateTask, deleteTask } = useEvents();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<NewTask>(EMPTY_TASK);
  const [errors, setErrors] = useState<TaskErrors>({});
  const [filterMilestone, setFilterMilestone] = useState<'all' | TaskMilestone>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');

  if (!activeEvent) return null;

  const filteredTasks = activeEvent.tasks.filter((t) => {
    if (filterMilestone !== 'all' && t.milestone !== filterMilestone) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  function openAdd(status: TaskStatus = 'todo') {
    setEditingTask(null);
    setForm({ ...EMPTY_TASK, status });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setForm({ ...task });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    if (!activeEvent) return;
    const errs = validateTask(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const sanitized: NewTask = {
      ...form,
      title: sanitizeText(form.title),
      description: sanitizeText(form.description),
      assignee: sanitizeText(form.assignee),
    };
    if (editingTask) {
      updateTask(activeEvent.id, { ...sanitized, id: editingTask.id, completedAt: editingTask.completedAt });
    } else {
      addTask(activeEvent.id, sanitized);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (!activeEvent) return;
    if (window.confirm('Delete this task?')) deleteTask(activeEvent.id, id);
  }

  function toggleStatus(task: Task) {
    if (!activeEvent) return;
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'inprogress' : 'done';
    const completedAt = nextStatus === 'done' ? new Date().toISOString() : undefined;
    updateTask(activeEvent.id, { ...task, status: nextStatus, completedAt });
    if (nextStatus === 'done') fireConfetti();
  }

  function moveTask(task: Task, status: TaskStatus) {
    if (!activeEvent) return;
    const completedAt = status === 'done' ? new Date().toISOString() : undefined;
    updateTask(activeEvent.id, { ...task, status, completedAt });
    if (status === 'done') fireConfetti();
  }

  function upd(field: keyof NewTask, value: string | TaskStatus | TaskPriority | TaskMilestone) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as keyof TaskErrors]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  const done = filteredTasks.filter((t) => t.status === 'done').length;
  const total = filteredTasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdue = filteredTasks.filter((t) => t.status !== 'done' && isOverdue(t.dueDate)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Task Scheduling</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {done}/{total} tasks complete ({pct}%)
              {overdue > 0 && <span className="ml-2 text-red-500 font-medium">• {overdue} overdue</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'kanban' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                aria-pressed={view === 'kanban'}
              >
                <LayoutGrid size={14} /> Kanban
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                aria-pressed={view === 'list'}
              >
                <List size={14} /> List
              </button>
            </div>
            <select
              value={filterMilestone}
              onChange={(e) => setFilterMilestone(e.target.value as typeof filterMilestone)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Filter by milestone"
            >
              <option value="all">All Stages</option>
              {(Object.entries(MILESTONE_CONFIG) as [TaskMilestone, typeof MILESTONE_CONFIG[TaskMilestone]][]).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Filter by priority"
            >
              <option value="all">All Priority</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            <button
              onClick={() => openAdd()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Tasks completion: ${pct}%`}
            />
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className={`rounded-2xl border ${col.color} overflow-hidden`}>
                <div className={`px-4 py-3 flex items-center justify-between ${col.headerColor} border-b border-current/10`}>
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="text-xs font-medium opacity-70">{colTasks.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group ${task.status === 'done' ? 'opacity-70' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleStatus(task)}
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === 'done' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 hover:border-indigo-500'}`}
                          aria-label={`Mark ${task.title} as ${task.status === 'done' ? 'incomplete' : 'done'}`}
                        >
                          {task.status === 'done' && <Check size={11} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</div>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                <Clock size={10} />
                                {task.dueDate}
                                {isOverdue(task.dueDate) && task.status !== 'done' && ' ⚠️'}
                              </span>
                            )}
                            {task.assignee && (
                              <span className="text-xs text-gray-400">{task.assignee}</span>
                            )}
                          </div>
                          {/* Move buttons */}
                          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => moveTask(task, col.id === 'inprogress' ? 'todo' : 'inprogress')}
                                className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                aria-label={`Move ${task.title} to previous column`}
                              >
                                ← {col.id === 'inprogress' ? 'To Do' : 'In Progress'}
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => moveTask(task, col.id === 'todo' ? 'inprogress' : 'done')}
                                className="text-xs px-2 py-0.5 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
                                aria-label={`Move ${task.title} to next column`}
                              >
                                {col.id === 'todo' ? 'In Progress' : 'Done'} →
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(task)} aria-label={`Edit ${task.title}`} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(task.id)} aria-label={`Delete ${task.title}`} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => openAdd(col.id)}
                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
                    aria-label={`Add task to ${col.label}`}
                  >
                    <Plus size={12} /> Add to {col.label}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-4">
          {(Object.entries(MILESTONE_CONFIG) as [TaskMilestone, typeof MILESTONE_CONFIG[TaskMilestone]][]).map(([milestoneId, cfg]) => {
            const tasks = filteredTasks.filter((t) => t.milestone === milestoneId);
            if (tasks.length === 0) return null;
            return (
              <div key={milestoneId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3 ${cfg.color} border`}>
                  <span className="text-lg" aria-hidden="true">{cfg.emoji}</span>
                  <h3 className="font-semibold text-sm">{cfg.label}</h3>
                  <span className="ml-auto text-xs font-medium opacity-70">{tasks.length} tasks</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group ${task.status === 'done' ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => toggleStatus(task)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${task.status === 'done' ? 'border-emerald-500 bg-emerald-500' : task.status === 'inprogress' ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-indigo-400'}`}
                        aria-label={`Toggle ${task.title}`}
                      >
                        {task.status === 'done' && <Check size={11} className="text-white" />}
                        {task.status === 'inprogress' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {task.title}
                        </div>
                        {task.description && <div className="text-xs text-gray-400 mt-0.5">{task.description}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className={`text-xs ${isOverdue(task.dueDate) && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {task.dueDate}
                            {isOverdue(task.dueDate) && task.status !== 'done' && <AlertTriangle size={11} className="inline ml-1" />}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(task)} aria-label={`Edit ${task.title}`} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(task.id)} aria-label={`Delete ${task.title}`} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Task Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add Task'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="t-title" className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
            <input id="t-title" type="text" value={form.title} onChange={(e) => upd('title', e.target.value)} placeholder="What needs to be done?" maxLength={200} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.title ? 'border-red-400' : 'border-gray-200'}`} aria-required="true" />
            {errors.title && <p className="text-xs text-red-500 mt-1" role="alert">{errors.title}</p>}
          </div>
          <div>
            <label htmlFor="t-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="t-desc" value={form.description} onChange={(e) => upd('description', e.target.value)} rows={2} maxLength={500} placeholder="Additional details..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="t-status" value={form.status} onChange={(e) => upd('status', e.target.value as TaskStatus)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label htmlFor="t-priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select id="t-priority" value={form.priority} onChange={(e) => upd('priority', e.target.value as TaskPriority)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="t-milestone" className="block text-sm font-medium text-gray-700 mb-1">Stage / Milestone</label>
            <select id="t-milestone" value={form.milestone} onChange={(e) => upd('milestone', e.target.value as TaskMilestone)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {(Object.entries(MILESTONE_CONFIG) as [TaskMilestone, typeof MILESTONE_CONFIG[TaskMilestone]][]).map(([id, cfg]) => (
                <option key={id} value={id}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="t-assignee" className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <input id="t-assignee" type="text" value={form.assignee} onChange={(e) => upd('assignee', e.target.value)} placeholder="Who is responsible?" maxLength={100} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label htmlFor="t-due" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input id="t-due" type="date" value={form.dueDate} onChange={(e) => upd('dueDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
