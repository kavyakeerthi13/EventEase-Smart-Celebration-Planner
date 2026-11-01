import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, Pencil, Trash2, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { formatCurrency, calcTotalSpent, calcTotalPaid, calcTotalPending, calcSpentByCategory, exportExpensesCSV, isValidAmount, isValidName, isValidDate, sanitizeText } from '../../utils';
import Modal from '../common/Modal';
import type { Expense, PaymentStatus, NewExpense } from '../../types';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  paid: { label: 'Paid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={12} /> },
  partial: { label: 'Partial', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <Clock size={12} /> },
  unpaid: { label: 'Unpaid', color: 'text-red-700 bg-red-50 border-red-200', icon: <AlertCircle size={12} /> },
};

const EMPTY: NewExpense = { categoryId: '', description: '', vendor: '', amount: 0, amountPaid: 0, paymentStatus: 'unpaid', date: new Date().toISOString().slice(0, 10), notes: '' };

interface FE { description?: string; amount?: string; date?: string; amountPaid?: string; categoryId?: string; }

function validate(f: NewExpense): FE {
  const e: FE = {};
  if (!isValidName(f.description)) e.description = 'Description is required';
  if (!isValidAmount(String(f.amount)) || f.amount <= 0) e.amount = 'Amount must be positive';
  if (f.amountPaid < 0 || f.amountPaid > f.amount) e.amountPaid = 'Amount paid must be 0 to total';
  if (!isValidDate(f.date)) e.date = 'Valid date required';
  if (!f.categoryId) e.categoryId = 'Select a category';
  return e;
}

export default function BudgetManager() {
  const { activeEvent, addExpense, updateExpense, deleteExpense } = useEvents();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<NewExpense>(EMPTY);
  const [errors, setErrors] = useState<FE>({});
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | PaymentStatus>('all');
  const [search, setSearch] = useState('');

  if (!activeEvent) return null;

  const totalSpent = calcTotalSpent(activeEvent.expenses);
  const totalPaid = calcTotalPaid(activeEvent.expenses);
  const totalPending = calcTotalPending(activeEvent.expenses);
  const remaining = activeEvent.totalBudget - totalSpent;
  const budgetPct = activeEvent.totalBudget === 0 ? 0 : Math.min(100, Math.round((totalSpent / activeEvent.totalBudget) * 100));
  const isOverBudget = totalSpent > activeEvent.totalBudget;

  const filtered = useMemo(() => activeEvent.expenses.filter((ex) => {
    if (filterCat !== 'all' && ex.categoryId !== filterCat) return false;
    if (filterStatus !== 'all' && ex.paymentStatus !== filterStatus) return false;
    if (search) { const q = search.toLowerCase(); return ex.description.toLowerCase().includes(q) || ex.vendor.toLowerCase().includes(q); }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [activeEvent.expenses, filterCat, filterStatus, search]);

  function openAdd() {
    if (!activeEvent) return;
    setEditing(null);
    setForm({ ...EMPTY, categoryId: activeEvent.budgetCategories[0]?.id ?? '' });
    setErrors({});
    setOpen(true);
  }
  function openEdit(ex: Expense) { setEditing(ex); setForm({ ...ex }); setErrors({}); setOpen(true); }

  function handleSubmit() {
    if (!activeEvent) return;
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const s = { ...form, description: sanitizeText(form.description), vendor: sanitizeText(form.vendor), notes: sanitizeText(form.notes) };
    if (editing) updateExpense(activeEvent.id, { ...s, id: editing.id });
    else addExpense(activeEvent.id, s);
    setOpen(false);
  }

  function handleDelete(id: string) {
    if (!activeEvent) return;
    if (window.confirm('Delete this expense?')) deleteExpense(activeEvent.id, id);
  }

  function upd(field: keyof NewExpense, value: string | number) {
    setForm((prev) => {
      const u = { ...prev, [field]: value };
      if (field === 'amountPaid' || field === 'amount') {
        const paid = field === 'amountPaid' ? Number(value) : prev.amountPaid;
        const total = field === 'amount' ? Number(value) : prev.amount;
        u.paymentStatus = paid === 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial';
      }
      return u;
    });
    if (errors[field as keyof FE]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  const confirmedGuests = activeEvent.guests.filter((g) => g.rsvpStatus === 'attending').length +
    activeEvent.guests.filter((g) => g.rsvpStatus === 'attending').reduce((s, g) => s + g.plusOnes, 0);
  const perGuest = confirmedGuests === 0 ? 0 : Math.round(totalSpent / confirmedGuests);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: formatCurrency(activeEvent.totalBudget), color: 'bg-indigo-500' },
          { label: 'Committed', value: formatCurrency(totalSpent), color: isOverBudget ? 'bg-red-500' : 'bg-amber-500', sub: `${budgetPct}%` },
          { label: 'Amount Paid', value: formatCurrency(totalPaid), color: 'bg-emerald-500', sub: `${formatCurrency(totalPending)} pending` },
          { label: remaining >= 0 ? 'Remaining' : 'Over Budget', value: formatCurrency(Math.abs(remaining)), color: remaining >= 0 ? 'bg-teal-500' : 'bg-red-600', sub: remaining < 0 ? 'Exceeded!' : 'available' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}><DollarSign size={18} className="text-white" /></div>
            <div className="text-xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            {c.sub && <div className="text-xs text-gray-400">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Budget Utilization</h2>
          <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : budgetPct > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{budgetPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, budgetPct)}%` }} role="progressbar" aria-valuenow={budgetPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Budget used: ${budgetPct}%`} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Per guest: {formatCurrency(perGuest)} ({confirmedGuests} confirmed)</span>
          <span>{isOverBudget ? `Over by ${formatCurrency(totalSpent - activeEvent.totalBudget)}` : `${formatCurrency(remaining)} left`}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="space-y-3">
          {activeEvent.budgetCategories.map((cat) => {
            const spent = calcSpentByCategory(cat.id, activeEvent.expenses);
            const pct = cat.allocated === 0 ? 0 : Math.min(100, Math.round((spent / cat.allocated) * 100));
            const over = spent > cat.allocated;
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2"><span aria-hidden="true">{cat.icon}</span><span className="font-medium text-gray-800">{cat.name}</span>{over && <span className="text-xs text-red-600 font-medium">Over!</span>}</span>
                  <span className="text-gray-500"><span className={over ? 'text-red-600 font-semibold' : 'text-gray-900 font-semibold'}>{formatCurrency(spent)}</span><span className="text-gray-400"> / {formatCurrency(cat.allocated)}</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : cat.color }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-base font-semibold text-gray-900">Expense Ledger</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input type="search" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 w-44" aria-label="Search expenses" />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" aria-label="Filter by category">
                <option value="all">All Categories</option>
                {activeEvent.budgetCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300" aria-label="Filter by payment status">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <button onClick={() => exportExpensesCSV(activeEvent.expenses, activeEvent.name)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Export CSV"><Download size={14} /> CSV</button>
              <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"><Plus size={14} /> Add Expense</button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><DollarSign size={40} className="mx-auto mb-3 text-gray-200" /><p className="text-sm">No expenses found. Add your first!</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Vendor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((ex) => {
                  const cat = activeEvent.budgetCategories.find((c) => c.id === ex.categoryId);
                  const cfg = STATUS_CONFIG[ex.paymentStatus];
                  return (
                    <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><div className="font-medium text-gray-900">{ex.description}</div>{ex.notes && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ex.notes}</div>}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{ex.vendor || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell">{cat ? <span className="text-xs">{cat.icon} {cat.name}</span> : '—'}</td>
                      <td className="px-4 py-3 text-right"><div className="font-semibold text-gray-900">{formatCurrency(ex.amount)}</div>{ex.paymentStatus !== 'paid' && <div className="text-xs text-gray-400">{formatCurrency(ex.amount - ex.amountPaid)} due</div>}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${cfg.color}`}>{cfg.icon} {cfg.label}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{ex.date}</td>
                      <td className="px-4 py-3"><div className="flex items-center gap-1">
                        <button onClick={() => openEdit(ex)} aria-label={`Edit ${ex.description}`} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(ex.id)} aria-label={`Delete ${ex.description}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="bg-gray-50 border-t-2 border-gray-200"><td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700">Totals ({filtered.length} items)</td><td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}</td><td colSpan={3} /></tr></tfoot>
            </table>
          )}
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? 'Edit Expense' : 'Add Expense'} size="md"
        footer={<><button onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button><button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">{editing ? 'Save Changes' : 'Add Expense'}</button></>}
      >
        <div className="space-y-4">
          <div><label htmlFor="ec" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select id="ec" value={form.categoryId} onChange={(e) => upd('categoryId', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.categoryId ? 'border-red-400' : 'border-gray-200'}`} aria-required="true">
              <option value="">Select category...</option>{activeEvent.budgetCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>{errors.categoryId && <p className="text-xs text-red-500 mt-1" role="alert">{errors.categoryId}</p>}</div>
          <div><label htmlFor="ed" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input id="ed" type="text" value={form.description} onChange={(e) => upd('description', e.target.value)} placeholder="e.g., Venue deposit" maxLength={200} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.description ? 'border-red-400' : 'border-gray-200'}`} aria-required="true" />
            {errors.description && <p className="text-xs text-red-500 mt-1" role="alert">{errors.description}</p>}</div>
          <div><label htmlFor="ev" className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <input id="ev" type="text" value={form.vendor} onChange={(e) => upd('vendor', e.target.value)} placeholder="Vendor name" maxLength={150} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="ea" className="block text-sm font-medium text-gray-700 mb-1">Total Amount *</label>
              <input id="ea" type="number" min="0" step="0.01" value={form.amount || ''} onChange={(e) => upd('amount', parseFloat(e.target.value) || 0)} placeholder="0.00" className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.amount ? 'border-red-400' : 'border-gray-200'}`} aria-required="true" />
              {errors.amount && <p className="text-xs text-red-500 mt-1" role="alert">{errors.amount}</p>}</div>
            <div><label htmlFor="ep" className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
              <input id="ep" type="number" min="0" step="0.01" value={form.amountPaid || ''} onChange={(e) => upd('amountPaid', parseFloat(e.target.value) || 0)} placeholder="0.00" className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.amountPaid ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.amountPaid && <p className="text-xs text-red-500 mt-1" role="alert">{errors.amountPaid}</p>}</div>
          </div>
          <div><label htmlFor="edt" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input id="edt" type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.date ? 'border-red-400' : 'border-gray-200'}`} aria-required="true" />
            {errors.date && <p className="text-xs text-red-500 mt-1" role="alert">{errors.date}</p>}</div>
          <div><label htmlFor="en" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="en" value={form.notes} onChange={(e) => upd('notes', e.target.value)} rows={2} maxLength={500} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" /></div>
          <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">Payment status auto-calculated: <strong className={form.paymentStatus === 'paid' ? 'text-emerald-600' : form.paymentStatus === 'partial' ? 'text-amber-600' : 'text-red-600'}>{form.paymentStatus}</strong></div>
        </div>
      </Modal>
    </div>
  );
}
