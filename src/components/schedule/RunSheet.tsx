import React, { useState } from 'react';
import {
  Clock, Plus, Pencil, Trash2, CheckCircle2, AlertCircle,
  MapPin, User, Printer, Calendar
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { isValidName, sanitizeText } from '../../utils';
import Modal from '../common/Modal';
import type { ScheduleItem, NewScheduleItem } from '../../types';

const CATEGORY_COLORS: Record<ScheduleItem['category'], { label: string; badge: string; border: string }> = {
  ceremony: { label: 'Ceremony / Keynote', badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-l-rose-500' },
  reception: { label: 'Reception & Hospitality', badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-l-amber-500' },
  entertainment: { label: 'Music & Entertainment', badge: 'bg-violet-50 text-violet-700 border-violet-200', border: 'border-l-violet-500' },
  logistics: { label: 'Setup & Logistics', badge: 'bg-blue-50 text-blue-700 border-blue-200', border: 'border-l-blue-500' },
  break: { label: 'Break / Transition', badge: 'bg-gray-100 text-gray-700 border-gray-200', border: 'border-l-gray-400' },
  other: { label: 'Special Activity', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-l-emerald-500' },
};

const EMPTY_ITEM: NewScheduleItem = {
  time: '12:00',
  duration: 30,
  activity: '',
  location: '',
  responsiblePerson: '',
  notes: '',
  category: 'logistics',
  status: 'pending',
};

export default function RunSheet() {
  const { activeEvent, addScheduleItem, updateScheduleItem, deleteScheduleItem, showToast } = useEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<NewScheduleItem>(EMPTY_ITEM);
  const [errors, setErrors] = useState<{ activity?: string; time?: string }>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!activeEvent) return null;

  const sortedSchedule = [...activeEvent.schedule].sort((a, b) => a.time.localeCompare(b.time));

  const filteredSchedule = sortedSchedule.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm({
      ...EMPTY_ITEM,
      location: activeEvent.venue || '',
      responsiblePerson: activeEvent.hostName || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setForm({ ...item });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!isValidName(form.activity)) newErrors.activity = 'Please provide an activity name';
    if (!form.time) newErrors.time = 'Time is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: NewScheduleItem = {
      ...form,
      activity: sanitizeText(form.activity),
      location: sanitizeText(form.location),
      responsiblePerson: sanitizeText(form.responsiblePerson),
      notes: sanitizeText(form.notes),
    };

    if (editingItem) {
      updateScheduleItem(activeEvent.id, { ...payload, id: editingItem.id });
    } else {
      addScheduleItem(activeEvent.id, payload);
    }

    setModalOpen(false);
  };

  const toggleStatus = (item: ScheduleItem) => {
    const cycle: ScheduleItem['status'][] = ['pending', 'inprogress', 'completed'];
    const next = cycle[(cycle.indexOf(item.status) + 1) % cycle.length];
    updateScheduleItem(activeEvent.id, { ...item, status: next });
    showToast(`Marked as ${next}`, 'info');
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from schedule?`)) {
      deleteScheduleItem(activeEvent.id, id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600" />
              Day-of-Event Run Sheet (Hourly Itinerary)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
              {activeEvent.schedule.length} Milestones
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Minute-by-minute coordinator run-sheet for hosts, MCs, stage managers, and vendors.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            aria-label="Filter schedule by category"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_COLORS).map(([cat, config]) => (
              <option key={cat} value={cat}>
                {config.label}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Print Run Sheet"
          >
            <Printer size={13} />
            Print Run Sheet
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Timeline Item
          </button>
        </div>
      </div>

      {/* Timeline View */}
      {filteredSchedule.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-400">
          <Clock size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-700">No schedule milestones yet</h3>
          <p className="text-xs text-gray-400 mt-1">
            Add arrival times, ceremony cues, speeches, dinner, and wrap-up activities.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Create First Milestone
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-100 space-y-4">
          {filteredSchedule.map((item) => {
            const catConfig = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'inprogress';

            return (
              <div key={item.id} className="relative group">
                {/* Node on vertical timeline */}
                <button
                  onClick={() => toggleStatus(item)}
                  title={`Status: ${item.status}. Click to advance.`}
                  className={`absolute -left-[31px] sm:-left-[39px] top-4 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isInProgress
                      ? 'border-indigo-600 bg-indigo-600 text-white animate-pulse'
                      : 'border-gray-300 hover:border-indigo-500 text-transparent'
                  }`}
                  aria-label={`Toggle status for ${item.activity}`}
                >
                  <CheckCircle2 size={13} className={isCompleted || isInProgress ? 'block' : 'hidden'} />
                </button>

                {/* Card */}
                <div
                  className={`bg-white rounded-2xl p-5 shadow-xs border border-gray-100 border-l-4 ${catConfig.border} hover:shadow-md transition-all ${
                    isCompleted ? 'opacity-70 bg-gray-50/50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                          {item.time} ({item.duration} min)
                        </span>

                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${catConfig.badge}`}>
                          {catConfig.label}
                        </span>

                        <span
                          onClick={() => toggleStatus(item)}
                          className={`cursor-pointer text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h3 className={`text-base font-bold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.activity}
                      </h3>

                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.notes}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-gray-400" />
                            {item.location}
                          </span>
                        )}
                        {item.responsiblePerson && (
                          <span className="flex items-center gap-1">
                            <User size={13} className="text-gray-400" />
                            Lead: <strong className="font-semibold text-gray-700">{item.responsiblePerson}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label={`Edit ${item.activity}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.activity)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={`Delete ${item.activity}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Schedule Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Timeline Milestone' : 'Add Schedule Milestone'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sched-act" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Activity / Milestone Name <span className="text-red-500">*</span>
            </label>
            <input
              id="sched-act"
              type="text"
              required
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              placeholder="e.g. Grand Entrance & Welcome Toast"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                errors.activity ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
              }`}
            />
            {errors.activity && <p className="text-xs text-red-500 mt-1">{errors.activity}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sched-time" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Time (HH:MM) <span className="text-red-500">*</span>
              </label>
              <input
                id="sched-time"
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label htmlFor="sched-dur" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Duration (minutes)
              </label>
              <input
                id="sched-dur"
                type="number"
                min="5"
                step="5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) || 15 })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sched-cat" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                id="sched-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ScheduleItem['category'] })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {Object.entries(CATEGORY_COLORS).map(([cat, config]) => (
                  <option key={cat} value={cat}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sched-status" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Initial Status
              </label>
              <select
                id="sched-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ScheduleItem['status'] })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sched-loc" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Location / Stage
              </label>
              <input
                id="sched-loc"
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Garden Pavilion or Main Ballroom"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label htmlFor="sched-resp" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Person in Charge / Lead
              </label>
              <input
                id="sched-resp"
                type="text"
                value={form.responsiblePerson}
                onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                placeholder="e.g. MC, DJ, or Best Man"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sched-notes" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Coordinator Notes & Cues
            </label>
            <textarea
              id="sched-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Cue background music fade at 18:30; dim lights to 40%..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              {editingItem ? 'Save Milestone' : 'Add to Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
