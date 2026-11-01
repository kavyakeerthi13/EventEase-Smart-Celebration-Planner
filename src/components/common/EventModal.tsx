import React, { useState } from 'react';
import { useEvents } from '../../context/EventContext';
import { PRESET_THEMES } from '../../data/themes';
import { isValidName, isValidDate, isValidAmount, sanitizeText } from '../../utils';
import Modal from './Modal';
import type { EventType, BudgetCategory, Event } from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: Event;
}

const TYPE_DEFAULTS: Record<EventType, { emoji: string; themeId: string; gradient: string; categories: BudgetCategory[] }> = {
  wedding: {
    emoji: '💍',
    themeId: 'blushing-rose',
    gradient: 'from-rose-400 to-pink-300',
    categories: [
      { id: 'cat-venue', name: 'Venue & Decor', icon: '🏛️', allocated: 10000, color: '#e11d48' },
      { id: 'cat-catering', name: 'Catering & Bar', icon: '🍽️', allocated: 8000, color: '#f43f5e' },
      { id: 'cat-photo', name: 'Photography & Video', icon: '📸', allocated: 4000, color: '#fb7185' },
      { id: 'cat-music', name: 'Music & Entertainment', icon: '🎵', allocated: 3000, color: '#fda4af' },
      { id: 'cat-flowers', name: 'Flowers & Decor', icon: '🌹', allocated: 2500, color: '#fecdd3' },
      { id: 'cat-attire', name: 'Attire & Rings', icon: '👗', allocated: 3500, color: '#881337' },
      { id: 'cat-misc', name: 'Stationery & Favors', icon: '✉️', allocated: 1000, color: '#be123c' },
    ],
  },
  birthday: {
    emoji: '🎂',
    themeId: 'carnival-pop',
    gradient: 'from-yellow-400 to-orange-300',
    categories: [
      { id: 'cat-venue', name: 'Venue Rental', icon: '🏠', allocated: 500, color: '#f59e0b' },
      { id: 'cat-food', name: 'Food & Drinks', icon: '🍕', allocated: 600, color: '#ef4444' },
      { id: 'cat-cake', name: 'Birthday Cake', icon: '🎂', allocated: 150, color: '#f97316' },
      { id: 'cat-decor', name: 'Decorations & Balloons', icon: '🎈', allocated: 300, color: '#eab308' },
      { id: 'cat-games', name: 'Entertainment & Games', icon: '🎮', allocated: 400, color: '#22c55e' },
      { id: 'cat-gifts', name: 'Party Favors & Gifts', icon: '🎁', allocated: 250, color: '#3b82f6' },
    ],
  },
  college: {
    emoji: '🎓',
    themeId: 'cyber-aurora',
    gradient: 'from-cyan-400 to-teal-300',
    categories: [
      { id: 'cat-venue', name: 'Auditorium & AV Setup', icon: '🎤', allocated: 2500, color: '#06b6d4' },
      { id: 'cat-food', name: 'Food & Refreshments', icon: '🍱', allocated: 3000, color: '#0891b2' },
      { id: 'cat-prizes', name: 'Prizes & Trophies', icon: '🏆', allocated: 2000, color: '#0e7490' },
      { id: 'cat-marketing', name: 'Marketing & Merchandise', icon: '📢', allocated: 1000, color: '#22d3ee' },
      { id: 'cat-entertainment', name: 'Performances & DJ', icon: '🎭', allocated: 1500, color: '#67e8f9' },
    ],
  },
  party: {
    emoji: '🥂',
    themeId: 'midnight-velvet',
    gradient: 'from-violet-500 to-indigo-400',
    categories: [
      { id: 'cat-venue', name: 'Venue & Lounge', icon: '🏙️', allocated: 1200, color: '#6366f1' },
      { id: 'cat-bar', name: 'Cocktails & Bar', icon: '🍸', allocated: 1500, color: '#818cf8' },
      { id: 'cat-food', name: 'Canapés & Food', icon: '🍢', allocated: 800, color: '#a5b4fc' },
      { id: 'cat-dj', name: 'DJ & Sound System', icon: '🎧', allocated: 800, color: '#c7d2fe' },
      { id: 'cat-decor', name: 'Lighting & Decor', icon: '✨', allocated: 500, color: '#e0e7ff' },
    ],
  },
  other: {
    emoji: '🎉',
    themeId: 'emerald-gala',
    gradient: 'from-emerald-400 to-teal-300',
    categories: [
      { id: 'cat-venue', name: 'Venue', icon: '🏛️', allocated: 1000, color: '#059669' },
      { id: 'cat-catering', name: 'Catering', icon: '🍽️', allocated: 1500, color: '#10b981' },
      { id: 'cat-decor', name: 'Decor', icon: '✨', allocated: 500, color: '#34d399' },
      { id: 'cat-misc', name: 'Logistics', icon: '📦', allocated: 500, color: '#6ee7b7' },
    ],
  },
};

const EMOJI_OPTIONS = ['💍', '🎂', '🎓', '🥂', '🎉', '🎈', '✨', '💐', '🎸', '🌟', '🏆', '🍾'];

export default function EventModal({ isOpen, onClose, eventToEdit }: EventModalProps) {
  const { addEvent, updateEvent } = useEvents();

  const [name, setName] = useState(eventToEdit?.name ?? '');
  const [type, setType] = useState<EventType>(eventToEdit?.type ?? 'wedding');
  const [date, setDate] = useState(eventToEdit?.date ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState(eventToEdit?.time ?? '18:00');
  const [venue, setVenue] = useState(eventToEdit?.venue ?? '');
  const [address, setAddress] = useState(eventToEdit?.address ?? '');
  const [hostName, setHostName] = useState(eventToEdit?.hostName ?? '');
  const [totalBudget, setTotalBudget] = useState(eventToEdit?.totalBudget ?? 5000);
  const [description, setDescription] = useState(eventToEdit?.description ?? '');
  const [themeId, setThemeId] = useState(eventToEdit?.themeId ?? 'blushing-rose');
  const [coverEmoji, setCoverEmoji] = useState(eventToEdit?.coverEmoji ?? '💍');

  const [errors, setErrors] = useState<{ name?: string; date?: string; budget?: string }>({});

  const handleTypeChange = (newType: EventType) => {
    setType(newType);
    if (!eventToEdit) {
      const def = TYPE_DEFAULTS[newType];
      setCoverEmoji(def.emoji);
      setThemeId(def.themeId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!isValidName(name)) newErrors.name = 'Please provide a valid event name (1-200 characters)';
    if (!isValidDate(date)) newErrors.date = 'Please provide a valid celebration date';
    if (!isValidAmount(String(totalBudget)) || totalBudget < 0) newErrors.budget = 'Target budget must be a positive number';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const def = TYPE_DEFAULTS[type];

    if (eventToEdit) {
      updateEvent({
        ...eventToEdit,
        name: sanitizeText(name),
        type,
        date,
        time,
        venue: sanitizeText(venue),
        address: sanitizeText(address),
        hostName: sanitizeText(hostName),
        totalBudget: Number(totalBudget),
        description: sanitizeText(description),
        themeId,
        coverEmoji,
        coverGradient: def.gradient,
      });
    } else {
      addEvent({
        name: sanitizeText(name),
        type,
        date,
        time,
        venue: sanitizeText(venue),
        address: sanitizeText(address),
        hostName: sanitizeText(hostName || 'Event Host'),
        totalBudget: Number(totalBudget),
        description: sanitizeText(description),
        coverEmoji,
        coverGradient: def.gradient,
        themeId,
        budgetCategories: def.categories,
        guests: [],
        expenses: [],
        tasks: [
          {
            id: 'init-t1',
            title: 'Confirm venue and booking contract',
            description: 'Make advance payment and lock date',
            status: 'todo',
            priority: 'high',
            milestone: '3-6months',
            assignee: hostName || 'Host',
            dueDate: date,
            tags: ['venue'],
          },
          {
            id: 'init-t2',
            title: 'Draft guest list & invitations',
            description: 'Collect contact information and dietary requirements',
            status: 'todo',
            priority: 'high',
            milestone: '1month',
            assignee: hostName || 'Host',
            dueDate: date,
            tags: ['guests'],
          },
          {
            id: 'init-t3',
            title: 'Finalize catering menu & bar package',
            description: 'Schedule tasting and confirm headcount',
            status: 'todo',
            priority: 'medium',
            milestone: '1month',
            assignee: hostName || 'Host',
            dueDate: date,
            tags: ['catering'],
          },
        ],
        schedule: [
          {
            id: 'init-s1',
            time: time,
            duration: 60,
            activity: 'Guest Arrival & Welcome',
            location: venue || 'Main Entrance',
            responsiblePerson: hostName || 'Host',
            notes: 'Welcome drinks and registration',
            category: 'reception',
            status: 'pending',
          },
        ],
        vendors: [],
      });
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Event Details' : 'Create New Celebration'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Celebration Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(
              [
                ['wedding', '💍 Wedding'],
                ['birthday', '🎂 Birthday'],
                ['college', '🎓 College'],
                ['party', '🥂 Party'],
                ['other', '🎉 Custom'],
              ] as const
            ).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-center ${
                  type === t
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Icon Picker & Name */}
        <div className="flex gap-3">
          <div className="shrink-0">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Emoji
            </label>
            <select
              value={coverEmoji}
              onChange={(e) => setCoverEmoji(e.target.value)}
              className="text-2xl p-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              aria-label="Select event icon emoji"
            >
              {EMOJI_OPTIONS.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="ev-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Maya's 25th Golden Birthday or Harper & Jack's Wedding"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                errors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
              }`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Date, Time & Host */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="ev-date" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label htmlFor="ev-time" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Start Time
            </label>
            <input
              id="ev-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label htmlFor="ev-host" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Host / Planner
            </label>
            <input
              id="ev-host"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Sarah & David"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Venue & Target Budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="ev-venue" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Venue Name
            </label>
            <input
              id="ev-venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Skyline Botanical Garden"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label htmlFor="ev-budget" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Target Budget ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="ev-budget"
              type="number"
              min="0"
              step="100"
              required
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              placeholder="e.g. 5000"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="ev-addr" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Venue Address / Location Details
          </label>
          <input
            id="ev-addr"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 124 Grand Vista Road, Suite 400"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* Theme selection */}
        <div>
          <label htmlFor="ev-theme" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Visual Theme
          </label>
          <select
            id="ev-theme"
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {PRESET_THEMES.map((th) => (
              <option key={th.id} value={th.id}>
                {th.emoji} {th.name} — {th.description}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="ev-desc" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Celebration Description & Notes
          </label>
          <textarea
            id="ev-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Special vision, dress code, schedule notes, or celebration vibe..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            {eventToEdit ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
