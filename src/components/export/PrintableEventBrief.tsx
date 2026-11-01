import React, { useRef } from 'react';
import {
  Printer, Download, Upload, RotateCcw, FileText, CheckCircle2,
  Calendar, MapPin, DollarSign, Users, Clock, Briefcase, Sparkles
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import {
  formatCurrency, formatDate, calcEventStats, calcGuestTotals,
  calcDietaryBreakdown, exportGuestsCSV, exportExpensesCSV
} from '../../utils';

export default function PrintableEventBrief() {
  const { activeEvent, exportData, importData, resetToSample, showToast } = useEvents();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeEvent) return null;

  const stats = calcEventStats(activeEvent);
  const guestTotals = calcGuestTotals(activeEvent.guests);
  const dietary = calcDietaryBreakdown(activeEvent.guests);

  const handlePrint = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content);
        if (success && fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Bar (hidden when printing) */}
      <div className="no-print bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-indigo-600" />
            Printable Event Master Brief & Data Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Generate clean, professional printouts or PDF briefs for on-site staff, vendors, and coordinators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Printer size={15} /> Print / Save as PDF
          </button>

          <button
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors"
          >
            <Download size={14} /> Backup JSON
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-xl transition-colors cursor-pointer">
            <Upload size={14} /> Restore JSON
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset application data back to default sample celebration events?')) {
                resetToSample();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors"
            title="Reset to default sample data"
          >
            <RotateCcw size={14} /> Reset Data
          </button>
        </div>
      </div>

      {/* CSV Export Quick Action Strip */}
      <div className="no-print bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600 shrink-0" />
          <span>
            Need data in spreadsheets? Export structured CSV files formatted for Excel, Google Sheets, and caterers.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              exportGuestsCSV(activeEvent.guests, activeEvent.name);
              showToast('Guests CSV downloaded', 'success');
            }}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium shadow-2xs"
          >
            Guest List CSV
          </button>
          <button
            onClick={() => {
              exportExpensesCSV(activeEvent.expenses, activeEvent.name);
              showToast('Expenses CSV downloaded', 'success');
            }}
            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium shadow-2xs"
          >
            Budget Ledger CSV
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* PRINTABLE EVENT BRIEF DOCUMENT */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-gray-900 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Official Celebration Master Brief
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mt-1">
              {activeEvent.name}
            </h1>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              {activeEvent.description || 'Comprehensive operational plan, run sheet, budget breakdown, and vendor roster.'}
            </p>
          </div>

          <div className="sm:text-right text-xs text-gray-500 space-y-1 shrink-0">
            <div>Generated: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</strong></div>
            <div>Event ID: <span className="font-mono text-gray-400">{activeEvent.id}</span></div>
            <div>Host: <strong>{activeEvent.hostName}</strong></div>
          </div>
        </div>

        {/* Section 1: Overview & Logistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-b border-gray-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Date & Time</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{formatDate(activeEvent.date)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Start: {activeEvent.time}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Venue</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{activeEvent.venue || 'TBD'}</div>
            <div className="text-xs text-gray-500 mt-0.5">{activeEvent.address || 'Address pending'}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Guest Attendance</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{guestTotals.attending + guestTotals.plusOnes} Attending</div>
            <div className="text-xs text-gray-500 mt-0.5">{activeEvent.guests.length} Invited total</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Budget Health</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{formatCurrency(stats.totalSpent)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Budget: {formatCurrency(activeEvent.totalBudget)}</div>
          </div>
        </div>

        {/* Section 2: Day-of Run Sheet (Hourly Itinerary) */}
        <div className="print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
            <Clock size={16} /> Day-of Itinerary & Coordinator Run Sheet
          </h2>
          {activeEvent.schedule.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No schedule milestones registered.</p>
          ) : (
            <table className="w-full text-xs border border-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left border-b border-gray-200">
                  <th className="p-2.5 font-bold text-gray-800 w-24">Time</th>
                  <th className="p-2.5 font-bold text-gray-800">Milestone / Activity</th>
                  <th className="p-2.5 font-bold text-gray-800">Location</th>
                  <th className="p-2.5 font-bold text-gray-800">Lead Person</th>
                  <th className="p-2.5 font-bold text-gray-800">Notes & Cues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...activeEvent.schedule]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {item.time} ({item.duration}m)
                      </td>
                      <td className="p-2.5 font-semibold text-gray-900">{item.activity}</td>
                      <td className="p-2.5 text-gray-600">{item.location || '—'}</td>
                      <td className="p-2.5 text-gray-700 font-medium">{item.responsiblePerson || '—'}</td>
                      <td className="p-2.5 text-gray-500">{item.notes || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 3: Vendor Directory & Key Contacts */}
        <div className="print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
            <Briefcase size={16} /> Key Vendor Contacts & Contract Status
          </h2>
          {activeEvent.vendors.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No vendors listed.</p>
          ) : (
            <table className="w-full text-xs border border-gray-200 border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left border-b border-gray-200">
                  <th className="p-2.5 font-bold text-gray-800">Service</th>
                  <th className="p-2.5 font-bold text-gray-800">Vendor</th>
                  <th className="p-2.5 font-bold text-gray-800">Contact Person</th>
                  <th className="p-2.5 font-bold text-gray-800">Phone</th>
                  <th className="p-2.5 font-bold text-gray-800">Email</th>
                  <th className="p-2.5 font-bold text-gray-800 text-right">Quoted</th>
                  <th className="p-2.5 font-bold text-gray-800 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeEvent.vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="p-2.5 font-semibold text-gray-900">{v.service}</td>
                    <td className="p-2.5 text-gray-800">{v.name}</td>
                    <td className="p-2.5 text-gray-600">{v.contactPerson || '—'}</td>
                    <td className="p-2.5 font-mono text-gray-700">{v.phone || '—'}</td>
                    <td className="p-2.5 text-gray-600">{v.email || '—'}</td>
                    <td className="p-2.5 text-right text-gray-800 font-medium">{formatCurrency(v.quotedAmount)}</td>
                    <td className="p-2.5 text-right font-bold text-gray-900">
                      {formatCurrency(v.quotedAmount - v.paidAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Catering & Dietary Breakdown */}
        <div className="print-section">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} /> Catering Headcount & Dietary Requirements
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(dietary).map(([diet, count]) => (
              <div key={diet} className="p-3 border border-gray-200 rounded-xl text-center">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">{diet}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Footer */}
        <div className="pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          Generated via <strong>EventEase – Smart Celebration Planner</strong>. Confidential event coordination document.
        </div>
      </div>
    </div>
  );
}
