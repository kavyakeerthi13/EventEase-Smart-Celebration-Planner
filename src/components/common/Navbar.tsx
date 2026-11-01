import React, { useState, useEffect } from 'react';
import {
  PartyPopper, ChevronDown, Plus, Download, Upload, RotateCcw,
  Calendar, MapPin, Users, LayoutDashboard, DollarSign, CheckSquare,
  Palette, Clock, Briefcase, FileText, Menu, X
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import { PRESET_THEMES } from '../../data/themes';
import { getDaysUntilEvent, formatCountdown, getEventTypeLabel } from '../../utils';
import type { ActiveTab } from '../../types';

const TAB_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'budget', label: 'Budget', icon: <DollarSign size={16} /> },
  { id: 'guests', label: 'Guests', icon: <Users size={16} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
  { id: 'themes', label: 'Themes', icon: <Palette size={16} /> },
  { id: 'schedule', label: 'Run Sheet', icon: <Clock size={16} /> },
  { id: 'vendors', label: 'Vendors', icon: <Briefcase size={16} /> },
  { id: 'export', label: 'Export', icon: <FileText size={16} /> },
];

export default function Navbar({ onNewEvent }: { onNewEvent?: () => void }) {
  const { state, activeEvent, setActiveEvent, setActiveTab, exportData, importData, resetToSample } = useEvents();
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countdown, setCountdown] = useState('');

  const theme = PRESET_THEMES.find((t) => t.id === activeEvent?.themeId) ?? PRESET_THEMES[5];

  // Live countdown ticker
  useEffect(() => {
    if (!activeEvent) return;
    const update = () => {
      const days = getDaysUntilEvent(activeEvent.date);
      setCountdown(formatCountdown(days));
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [activeEvent]);

  // Apply theme CSS variables
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-bg', theme.bg);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-surface', theme.surface);
    root.style.setProperty('--color-border', theme.border);
    root.style.setProperty('--color-muted', theme.muted);
    root.style.setProperty('--gradient-from', theme.gradientFrom);
    root.style.setProperty('--gradient-to', theme.gradientTo);
  }, [theme]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        if (content) {
          importData(content);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!activeEvent) return null;

  const isDark = theme.bg.startsWith('#0') || theme.bg.startsWith('#1') || theme.bg.startsWith('#2');

  return (
    <nav
      className="sticky top-0 z-40 no-print"
      style={{
        background: `linear-gradient(135deg, ${theme.gradientFrom}ee, ${theme.gradientTo}dd)`,
        borderBottom: `1px solid ${theme.border}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20">
              <PartyPopper size={18} className={isDark ? 'text-white' : 'text-white'} />
            </div>
            <span
              className="font-display font-bold text-lg hidden sm:block"
              style={{ color: isDark ? 'white' : 'white' }}
            >
              EventEase
            </span>
          </div>

          {/* Event selector */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <button
              onClick={() => setEventDropdownOpen((o) => !o)}
              className="flex items-center gap-2 w-full bg-white/15 hover:bg-white/25 text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
              aria-expanded={eventDropdownOpen}
              aria-haspopup="listbox"
              aria-label="Select event"
            >
              <span className="text-base shrink-0">{activeEvent.coverEmoji}</span>
              <span className="truncate flex-1 text-left">{activeEvent.name}</span>
              <ChevronDown size={14} className={`shrink-0 transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {eventDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                role="listbox"
                aria-label="Events list"
              >
                <div className="p-2 max-h-64 overflow-y-auto">
                  {state.events.map((ev) => (
                    <button
                      key={ev.id}
                      role="option"
                      aria-selected={ev.id === activeEvent.id}
                      onClick={() => { setActiveEvent(ev.id); setEventDropdownOpen(false); setActiveTab('dashboard'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        ev.id === activeEvent.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl">{ev.coverEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{ev.name}</div>
                        <div className="text-xs text-gray-400">{getEventTypeLabel(ev.type)} • {ev.date}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-100 p-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEventDropdownOpen(false);
                      if (onNewEvent) onNewEvent();
                      else setActiveTab('dashboard');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <Plus size={14} />
                    New Event
                  </button>
                  <button
                    onClick={() => { resetToSample(); setEventDropdownOpen(false); }}
                    title="Reset to sample data"
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    aria-label="Reset to sample data"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Countdown badge */}
          <div className="hidden md:flex items-center gap-2 bg-white/15 text-white rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0">
            <Calendar size={12} />
            <span className="countdown-pulse">{countdown}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={exportData}
              title="Export data"
              aria-label="Export event data"
              className="hidden sm:flex p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleImport}
              title="Import data"
              aria-label="Import event data"
              className="hidden sm:flex p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <Upload size={16} />
            </button>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="sm:hidden p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Event meta strip */}
      <div
        className="px-4 sm:px-6 lg:px-8 pb-2 flex items-center gap-4 text-xs overflow-x-auto"
        style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)' }}
      >
        <span className="flex items-center gap-1 shrink-0">
          <Calendar size={11} />
          {activeEvent.date} at {activeEvent.time}
        </span>
        {activeEvent.venue && (
          <span className="flex items-center gap-1 shrink-0">
            <MapPin size={11} />
            {activeEvent.venue}
          </span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          <Users size={11} />
          {activeEvent.guests.length} guests
        </span>
        <span className="shrink-0 ml-auto hidden sm:block font-medium">{theme.emoji} {theme.name}</span>
      </div>

      {/* Tab navigation */}
      <div className="border-t border-white/10">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto scrollbar-thin pb-0 no-scrollbar">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                state.activeTab === tab.id
                  ? 'border-white text-white'
                  : 'border-transparent text-white/60 hover:text-white hover:border-white/40'
              }`}
              aria-current={state.activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="p-4 flex flex-col gap-2">
            <button onClick={exportData} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
              <Download size={16} className="text-gray-400" /> Export Data
            </button>
            <button onClick={handleImport} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-medium">
              <Upload size={16} className="text-gray-400" /> Import Data
            </button>
            <button onClick={() => { resetToSample(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium">
              <RotateCcw size={16} /> Reset to Sample Data
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
