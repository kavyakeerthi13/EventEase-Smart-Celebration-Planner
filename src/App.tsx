import React, { useState } from 'react';
import { useEvents } from './context/EventContext';
import Navbar from './components/common/Navbar';
import ToastContainer from './components/common/ToastContainer';
import EventModal from './components/common/EventModal';

import DashboardOverview from './components/dashboard/DashboardOverview';
import BudgetManager from './components/budget/BudgetManager';
import GuestTracker from './components/guests/GuestTracker';
import TaskScheduler from './components/tasks/TaskScheduler';
import ThemeSelector from './components/themes/ThemeSelector';
import RunSheet from './components/schedule/RunSheet';
import VendorDirectory from './components/vendors/VendorDirectory';
import PrintableEventBrief from './components/export/PrintableEventBrief';
import { PartyPopper, Plus, Heart } from 'lucide-react';

export default function App() {
  const { state, activeEvent } = useEvents();
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col theme-transition bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Top Navbar */}
      <Navbar onNewEvent={() => setNewEventModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!activeEvent ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <PartyPopper size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Celebration Selected</h2>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Create your first celebration or restore sample data to start planning budgets, guest lists, schedules, and themes.
            </p>
            <button
              onClick={() => setNewEventModalOpen(true)}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <Plus size={16} /> Create New Celebration
            </button>
          </div>
        ) : (
          <div className="transition-opacity duration-300">
            {state.activeTab === 'dashboard' && <DashboardOverview />}
            {state.activeTab === 'budget' && <BudgetManager />}
            {state.activeTab === 'guests' && <GuestTracker />}
            {state.activeTab === 'tasks' && <TaskScheduler />}
            {state.activeTab === 'themes' && <ThemeSelector />}
            {state.activeTab === 'schedule' && <RunSheet />}
            {state.activeTab === 'vendors' && <VendorDirectory />}
            {state.activeTab === 'export' && <PrintableEventBrief />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-gray-200/60 bg-white/50 backdrop-blur-xs py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-gray-700">
            <span className="font-display font-bold text-sm text-indigo-600">EventEase</span>
            <span>— Smart Celebration Planner</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            Built with <Heart size={12} className="text-rose-500 fill-rose-500 mx-0.5 inline" /> for weddings, birthdays, college fests, & parties.
          </div>
          <div className="text-gray-400">
            {state.events.length} saved celebrations • Offline & Auto-persisted
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <EventModal
        isOpen={newEventModalOpen}
        onClose={() => setNewEventModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
