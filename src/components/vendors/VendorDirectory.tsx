import React, { useState } from 'react';
import {
  Briefcase, Plus, Pencil, Trash2, Phone, Mail, Globe,
  CheckCircle, AlertCircle, Clock, Star, FileText
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { formatCurrency, isValidName, isValidEmail, isValidPhone, sanitizeText } from '../../utils';
import Modal from '../common/Modal';
import type { Vendor, PaymentStatus, NewVendor } from '../../types';

const EMPTY_VENDOR: NewVendor = {
  name: '',
  service: '',
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  quotedAmount: 0,
  paidAmount: 0,
  paymentStatus: 'unpaid',
  contractSigned: false,
  notes: '',
  rating: 5,
};

export default function VendorDirectory() {
  const { activeEvent, addVendor, updateVendor, deleteVendor } = useEvents();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState<NewVendor>(EMPTY_VENDOR);
  const [errors, setErrors] = useState<{ name?: string; service?: string; email?: string; phone?: string }>({});

  if (!activeEvent) return null;

  const totalQuoted = activeEvent.vendors.reduce((s, v) => s + v.quotedAmount, 0);
  const totalPaid = activeEvent.vendors.reduce((s, v) => s + v.paidAmount, 0);
  const contractsSigned = activeEvent.vendors.filter((v) => v.contractSigned).length;

  const openAdd = () => {
    setEditingVendor(null);
    setForm({ ...EMPTY_VENDOR });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({ ...v });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!isValidName(form.name)) newErrors.name = 'Vendor name is required';
    if (!isValidName(form.service)) newErrors.service = 'Service/category is required';
    if (!isValidEmail(form.email)) newErrors.email = 'Valid email is required';
    if (!isValidPhone(form.phone)) newErrors.phone = 'Valid phone format is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Auto-calculate payment status
    let status: PaymentStatus = 'unpaid';
    if (form.paidAmount >= form.quotedAmount && form.quotedAmount > 0) {
      status = 'paid';
    } else if (form.paidAmount > 0) {
      status = 'partial';
    }

    const payload: NewVendor = {
      ...form,
      name: sanitizeText(form.name),
      service: sanitizeText(form.service),
      contactPerson: sanitizeText(form.contactPerson),
      notes: sanitizeText(form.notes),
      paymentStatus: status,
    };

    if (editingVendor) {
      updateVendor(activeEvent.id, { ...payload, id: editingVendor.id });
    } else {
      addVendor(activeEvent.id, payload);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Remove vendor "${name}"?`)) {
      deleteVendor(activeEvent.id, id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Contracted</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(totalQuoted)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{activeEvent.vendors.length} Vendors active</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Payments Made</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(totalQuoted - totalPaid)} balance remaining</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Contracts Signed</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {contractsSigned} / {activeEvent.vendors.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeEvent.vendors.length > 0
                ? `${Math.round((contractsSigned / activeEvent.vendors.length) * 100)}% signed & secured`
                : 'No vendors yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Vendor List Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Briefcase size={18} className="text-indigo-600" />
            Vendor Directory & Contracts
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Track key service partners, contracts, payment milestones, and emergency contacts.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* Vendor Cards Grid */}
      {activeEvent.vendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-400">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-700">No vendors added yet</h3>
          <p className="text-xs text-gray-400 mt-1">
            Keep all your photographers, caterers, DJs, and venue contacts organized in one place.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Add Your First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeEvent.vendors.map((vendor) => {
            const balanceDue = vendor.quotedAmount - vendor.paidAmount;
            return (
              <div
                key={vendor.id}
                className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {vendor.service}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-1.5">{vendor.name}</h3>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(vendor)}
                        className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        aria-label={`Edit ${vendor.name}`}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id, vendor.name)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label={`Delete ${vendor.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {vendor.contactPerson && (
                    <p className="text-xs text-gray-600 font-medium mb-3">
                      Contact: {vendor.contactPerson}
                    </p>
                  )}

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={
                          star <= vendor.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        }
                      />
                    ))}
                  </div>

                  {/* Contact Badges */}
                  <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                    {vendor.phone && (
                      <a
                        href={`tel:${vendor.phone}`}
                        className="flex items-center gap-2 hover:text-indigo-600 transition-colors truncate"
                      >
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span>{vendor.phone}</span>
                      </a>
                    )}
                    {vendor.email && (
                      <a
                        href={`mailto:${vendor.email}`}
                        className="flex items-center gap-2 hover:text-indigo-600 transition-colors truncate"
                      >
                        <Mail size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{vendor.email}</span>
                      </a>
                    )}
                    {vendor.website && (
                      <a
                        href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 hover:text-indigo-600 transition-colors truncate"
                      >
                        <Globe size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{vendor.website}</span>
                      </a>
                    )}
                  </div>

                  {vendor.notes && (
                    <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-500 mb-4 leading-relaxed">
                      {vendor.notes}
                    </div>
                  )}
                </div>

                {/* Financial Summary & Status Badges */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">Quoted: <strong className="text-gray-900">{formatCurrency(vendor.quotedAmount)}</strong></span>
                    <span className={balanceDue > 0 ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {balanceDue > 0 ? `${formatCurrency(balanceDue)} Due` : 'Fully Paid ✓'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        vendor.contractSigned
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {vendor.contractSigned ? <CheckCircle size={11} /> : <Clock size={11} />}
                      {vendor.contractSigned ? 'Contract Signed' : 'Contract Pending'}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize ${
                        vendor.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : vendor.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vendor.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Details' : 'Add New Vendor'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vd-name" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Company / Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="vd-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Luminary Lens Studio"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                  errors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="vd-service" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Service Category <span className="text-red-500">*</span>
              </label>
              <input
                id="vd-service"
                type="text"
                required
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                placeholder="e.g. Photography, Catering, DJ"
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                  errors.service ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
                }`}
              />
              {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="vd-person" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                id="vd-person"
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                placeholder="e.g. Marcus Reed"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label htmlFor="vd-phone" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                id="vd-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label htmlFor="vd-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                id="vd-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@studio.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vd-quote" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Quoted Contract Amount ($)
              </label>
              <input
                id="vd-quote"
                type="number"
                min="0"
                value={form.quotedAmount}
                onChange={(e) => setForm({ ...form, quotedAmount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label htmlFor="vd-paid" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Amount Paid So Far ($)
              </label>
              <input
                id="vd-paid"
                type="number"
                min="0"
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label htmlFor="vd-rating" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Rating (1 to 5 Stars)
              </label>
              <select
                id="vd-rating"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                <option value={3}>⭐⭐⭐ 3 Stars</option>
                <option value={2}>⭐⭐ 2 Stars</option>
                <option value={1}>⭐ 1 Star</option>
              </select>
            </div>

            <div className="pt-5 flex items-center gap-2">
              <input
                id="vd-contract"
                type="checkbox"
                checked={form.contractSigned}
                onChange={(e) => setForm({ ...form, contractSigned: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-300 border-gray-300"
              />
              <label htmlFor="vd-contract" className="text-xs font-semibold text-gray-800">
                Formal Contract Signed & Stored
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="vd-notes" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Deliverables & Important Terms
            </label>
            <textarea
              id="vd-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Balance due 2 weeks before event, includes 2 camera operators..."
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
              {editingVendor ? 'Save Vendor' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
