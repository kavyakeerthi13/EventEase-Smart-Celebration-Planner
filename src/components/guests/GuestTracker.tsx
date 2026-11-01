import React, { useState, useMemo } from 'react';
import {
  Users, Plus, Pencil, Trash2, Download, Check, X, Clock,
  AlertTriangle, Search, Upload, ChevronDown
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import {
  calcGuestTotals, calcDietaryBreakdown, exportGuestsCSV,
  isValidName, isValidEmail, isValidPhone, sanitizeText
} from '../../utils';
import Modal from '../common/Modal';
import type { Guest, RSVPStatus, DietaryPreference, NewGuest } from '../../types';

const RSVP_CONFIG: Record<RSVPStatus, { label: string; color: string; dot: string }> = {
  attending: { label: 'Attending', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  tentative: { label: 'Tentative', color: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  declined: { label: 'Declined', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' },
  invited: { label: 'Invited', color: 'text-blue-700 bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  awaiting: { label: 'Awaiting', color: 'text-gray-700 bg-gray-50 border-gray-200', dot: 'bg-gray-400' },
};

const DIETARY_OPTIONS: DietaryPreference[] = [
  'none', 'vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'nut-allergy', 'dairy-free', 'other',
];

const EMPTY_GUEST: NewGuest = {
  name: '', email: '', phone: '', rsvpStatus: 'invited', plusOnes: 0,
  dietary: 'none', dietaryNotes: '', tableNumber: '', group: '',
  notes: '', inviteSent: false,
};

interface GuestErrors {
  name?: string;
  email?: string;
  phone?: string;
  plusOnes?: string;
}

function validateGuest(g: NewGuest): GuestErrors {
  const e: GuestErrors = {};
  if (!isValidName(g.name)) e.name = 'Name is required';
  if (!isValidEmail(g.email)) e.email = 'Invalid email format';
  if (!isValidPhone(g.phone)) e.phone = 'Invalid phone format';
  if (g.plusOnes < 0 || g.plusOnes > 10) e.plusOnes = 'Plus ones must be 0–10';
  return e;
}

export default function GuestTracker() {
  const { activeEvent, addGuest, updateGuest, deleteGuest, bulkAddGuests } = useEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [form, setForm] = useState<NewGuest>(EMPTY_GUEST);
  const [errors, setErrors] = useState<GuestErrors>({});
  const [bulkText, setBulkText] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | RSVPStatus>('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [search, setSearch] = useState('');

  if (!activeEvent) return null;

  const guestTotals = calcGuestTotals(activeEvent.guests);
  const dietaryBreakdown = calcDietaryBreakdown(activeEvent.guests);

  const groups = Array.from(new Set(activeEvent.guests.map((g) => g.group).filter(Boolean)));

  const filtered = useMemo(() => {
    return activeEvent.guests.filter((g) => {
      if (filterStatus !== 'all' && g.rsvpStatus !== filterStatus) return false;
      if (filterGroup !== 'all' && g.group !== filterGroup) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.group.toLowerCase().includes(q) ||
          g.tableNumber.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeEvent.guests, filterStatus, filterGroup, search]);

  function openAdd() {
    setEditingGuest(null);
    setForm({ ...EMPTY_GUEST });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(guest: Guest) {
    setEditingGuest(guest);
    setForm({ ...guest });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    const errs = validateGuest(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const sanitized: NewGuest = {
      ...form,
      name: sanitizeText(form.name),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      group: sanitizeText(form.group),
      notes: sanitizeText(form.notes),
      dietaryNotes: sanitizeText(form.dietaryNotes),
      tableNumber: sanitizeText(form.tableNumber),
    };
    if (!activeEvent) return;
    if (editingGuest) {
      updateGuest(activeEvent.id, { ...sanitized, id: editingGuest.id });
    } else {
      addGuest(activeEvent.id, sanitized);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    if (!activeEvent) return;
    if (window.confirm('Remove this guest?')) deleteGuest(activeEvent.id, id);
  }

  function cycleRsvp(guest: Guest) {
    if (!activeEvent) return;
    const cycle: RSVPStatus[] = ['invited', 'attending', 'tentative', 'declined'];
    const idx = cycle.indexOf(guest.rsvpStatus);
    const next = cycle[(idx + 1) % cycle.length];
    updateGuest(activeEvent.id, { ...guest, rsvpStatus: next, rsvpDate: next === 'attending' ? new Date().toISOString().slice(0, 10) : guest.rsvpDate });
  }

  function handleBulkImport() {
    if (!activeEvent) return;
    const lines = bulkText.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
    const guests: NewGuest[] = lines.map((name) => ({
      ...EMPTY_GUEST,
      name: sanitizeText(name),
      inviteSent: false,
    }));
    if (guests.length === 0) return;
    bulkAddGuests(activeEvent.id, guests);
    setBulkText('');
    setBulkOpen(false);
  }

  function upd(field: keyof NewGuest, value: string | number | boolean | RSVPStatus | DietaryPreference) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field as keyof GuestErrors]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* RSVP Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Guests', value: guestTotals.total, color: 'bg-gray-700' },
          { label: 'Attending', value: guestTotals.attending, color: 'bg-emerald-500' },
          { label: 'Tentative', value: guestTotals.tentative, color: 'bg-amber-500' },
          { label: 'Declined', value: guestTotals.declined, color: 'bg-red-500' },
          { label: 'Plus Ones', value: guestTotals.plusOnes, color: 'bg-violet-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <Users size={18} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dietary Breakdown */}
      {Object.keys(dietaryBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true">🍽️</span> Dietary Requirements (Confirmed Guests)
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(dietaryBreakdown).map(([diet, count]) => (
              <div key={diet} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-sm border border-gray-100">
                <span className="font-semibold text-gray-900">{count}</span>
                <span className="text-gray-500 capitalize">{diet}</span>
              </div>
            ))}
          </div>
          {Object.keys(dietaryBreakdown).some((k) => k !== 'Standard') && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Share this breakdown with your caterer before the event.
            </p>
          )}
        </div>
      )}

      {/* Guest List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Guest List <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search guests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-40"
                  aria-label="Search guests"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                aria-label="Filter by RSVP status"
              >
                <option value="all">All RSVP</option>
                {(Object.keys(RSVP_CONFIG) as RSVPStatus[]).map((s) => (
                  <option key={s} value={s}>{RSVP_CONFIG[s].label}</option>
                ))}
              </select>
              {groups.length > 0 && (
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  aria-label="Filter by group"
                >
                  <option value="all">All Groups</option>
                  {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              )}
              <button
                onClick={() => exportGuestsCSV(activeEvent.guests, activeEvent.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Export guest list as CSV"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload size={14} /> Bulk Add
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Plus size={14} /> Add Guest
              </button>
            </div>
          </div>
        </div>

        {/* Guest Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No guests found. Add your first guest!</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">RSVP</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Group</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Table</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Dietary</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">+1s</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((guest) => {
                  const rsvp = RSVP_CONFIG[guest.rsvpStatus];
                  return (
                    <tr key={guest.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {guest.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{guest.name}</div>
                            <div className="text-xs text-gray-400">{guest.email || guest.phone || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => cycleRsvp(guest)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:opacity-80 ${rsvp.color}`}
                          aria-label={`Change RSVP for ${guest.name}, currently ${rsvp.label}`}
                          title="Click to cycle RSVP status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${rsvp.dot}`} />
                          {rsvp.label}
                          <ChevronDown size={10} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{guest.group || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{guest.tableNumber || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {guest.dietary !== 'none' ? (
                          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg capitalize">
                            {guest.dietary}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 font-medium text-xs hidden md:table-cell">
                        {guest.plusOnes > 0 ? `+${guest.plusOnes}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(guest)}
                            aria-label={`Edit ${guest.name}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(guest.id)}
                            aria-label={`Remove ${guest.name}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Guest Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGuest ? 'Edit Guest' : 'Add Guest'}
        size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              {editingGuest ? 'Save Changes' : 'Add Guest'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="g-name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input id="g-name" type="text" value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="Guest's full name" maxLength={200} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} aria-required="true" />
            {errors.name && <p className="text-xs text-red-500 mt-1" role="alert">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="g-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="g-email" type="email" value={form.email} onChange={(e) => upd('email', e.target.value)} placeholder="email@example.com" maxLength={150} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.email ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.email && <p className="text-xs text-red-500 mt-1" role="alert">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="g-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input id="g-phone" type="tel" value={form.phone} onChange={(e) => upd('phone', e.target.value)} placeholder="+1-555-0100" maxLength={20} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.phone && <p className="text-xs text-red-500 mt-1" role="alert">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="g-rsvp" className="block text-sm font-medium text-gray-700 mb-1">RSVP Status</label>
              <select id="g-rsvp" value={form.rsvpStatus} onChange={(e) => upd('rsvpStatus', e.target.value as RSVPStatus)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {(Object.keys(RSVP_CONFIG) as RSVPStatus[]).map((s) => (
                  <option key={s} value={s}>{RSVP_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="g-plus" className="block text-sm font-medium text-gray-700 mb-1">Plus Ones</label>
              <input id="g-plus" type="number" min="0" max="10" value={form.plusOnes} onChange={(e) => upd('plusOnes', parseInt(e.target.value) || 0)} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.plusOnes ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.plusOnes && <p className="text-xs text-red-500 mt-1" role="alert">{errors.plusOnes}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="g-group" className="block text-sm font-medium text-gray-700 mb-1">Group / Tag</label>
              <input id="g-group" type="text" value={form.group} onChange={(e) => upd('group', e.target.value)} placeholder="e.g., Family, VIP" maxLength={50} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
            <div>
              <label htmlFor="g-table" className="block text-sm font-medium text-gray-700 mb-1">Table / Seat</label>
              <input id="g-table" type="text" value={form.tableNumber} onChange={(e) => upd('tableNumber', e.target.value)} placeholder="e.g., Table 3" maxLength={30} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          </div>
          <div>
            <label htmlFor="g-diet" className="block text-sm font-medium text-gray-700 mb-1">Dietary Preference</label>
            <select id="g-diet" value={form.dietary} onChange={(e) => upd('dietary', e.target.value as DietaryPreference)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300">
              {DIETARY_OPTIONS.map((d) => (
                <option key={d} value={d}>{d === 'none' ? 'None (Standard)' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          {form.dietary !== 'none' && (
            <div>
              <label htmlFor="g-diet-notes" className="block text-sm font-medium text-gray-700 mb-1">Dietary Notes</label>
              <input id="g-diet-notes" type="text" value={form.dietaryNotes} onChange={(e) => upd('dietaryNotes', e.target.value)} placeholder="Any specific requirements..." maxLength={200} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            </div>
          )}
          <div>
            <label htmlFor="g-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="g-notes" value={form.notes} onChange={(e) => upd('notes', e.target.value)} rows={2} maxLength={300} placeholder="Special notes about this guest..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="g-invite"
              type="checkbox"
              checked={form.inviteSent}
              onChange={(e) => upd('inviteSent', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-300"
            />
            <label htmlFor="g-invite" className="text-sm text-gray-700">Invitation sent</label>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Add Guests"
        size="sm"
        footer={
          <>
            <button onClick={() => setBulkOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleBulkImport} className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
              Import Guests
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Enter guest names separated by commas or new lines:</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder="John Smith,&#10;Jane Doe,&#10;Bob Johnson"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            aria-label="Guest names for bulk import"
          />
          <p className="text-xs text-gray-400">
            {bulkText.split(/[\n,]+/).filter((l) => l.trim()).length} guests detected
          </p>
        </div>
      </Modal>
    </div>
  );
}
