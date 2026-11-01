import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, DollarSign, CheckSquare, Calendar,
  AlertTriangle, Plus, ArrowRight, Star, MapPin, Clock, Zap
} from 'lucide-react';
import { useEvents } from '../../context/EventContext';
import {
  calcEventStats, formatCurrency, getDaysUntilEvent, formatDate,
  calcGuestTotals, calcTaskStats, isOverdue, getEventTypeLabel
} from '../../utils';
import { PRESET_THEMES } from '../../data/themes';

function StatCard({
  label, value, sub, icon, color, trend
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
        {sub && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            {trend === 'up' && <TrendingUp size={11} className="text-emerald-500" />}
            {trend === 'down' && <TrendingDown size={11} className="text-red-500" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export default function DashboardOverview() {
  const { activeEvent, setActiveTab } = useEvents();
  const [_show, _setShow] = useState(false);
  void _show; void _setShow;

  if (!activeEvent) return <div className="p-8 text-gray-400">No event selected.</div>;

  const stats = calcEventStats(activeEvent);
  const guestTotals = calcGuestTotals(activeEvent.guests);
  const taskStats = calcTaskStats(activeEvent.tasks);
  const days = getDaysUntilEvent(activeEvent.date);
  const theme = PRESET_THEMES.find((t) => t.id === activeEvent.themeId) ?? PRESET_THEMES[5];

  const budgetPct = activeEvent.totalBudget === 0 ? 0 : Math.round((stats.totalSpent / activeEvent.totalBudget) * 100);
  const isOverBudget = stats.totalSpent > activeEvent.totalBudget;
  const rsvpRate = activeEvent.guests.length === 0 ? 0 : Math.round((guestTotals.attending / activeEvent.guests.length) * 100);

  const alerts: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
  if (isOverBudget) alerts.push({ type: 'error', message: `Over budget by ${formatCurrency(stats.totalSpent - activeEvent.totalBudget)}` });
  if (budgetPct > 85 && !isOverBudget) alerts.push({ type: 'warning', message: `${budgetPct}% of budget used` });
  const overdueTasks = activeEvent.tasks.filter((t) => t.status !== 'done' && isOverdue(t.dueDate));
  if (overdueTasks.length > 0) alerts.push({ type: 'error', message: `${overdueTasks.length} overdue task(s)` });
  const uninvitedCount = activeEvent.guests.filter((g) => !g.inviteSent).length;
  if (uninvitedCount > 0) alerts.push({ type: 'info', message: `${uninvitedCount} guest(s) not yet invited` });
  const unpaidVendors = activeEvent.vendors.filter((v) => v.paymentStatus === 'unpaid');
  if (unpaidVendors.length > 0) alerts.push({ type: 'warning', message: `${unpaidVendors.length} vendor(s) with outstanding payment` });

  const urgentTasks = activeEvent.tasks
    .filter((t) => t.status !== 'done' && (t.priority === 'high' || isOverdue(t.dueDate)))
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg"
        style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`, minHeight: 180 }}
      >
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 20% 50%, white, transparent)' }} />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-6xl sm:text-7xl select-none" aria-hidden="true">{activeEvent.coverEmoji}</div>
          <div className="flex-1">
            <div className="text-white/70 text-sm font-medium mb-1">{getEventTypeLabel(activeEvent.type)}</div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-tight">{activeEvent.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-white/80 text-sm">
              <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(activeEvent.date)} at {activeEvent.time}</span>
              {activeEvent.venue && <span className="flex items-center gap-1.5"><MapPin size={14} />{activeEvent.venue}</span>}
              <span className="flex items-center gap-1.5"><Star size={14} />Hosted by {activeEvent.hostName}</span>
            </div>
          </div>
          <div className="shrink-0 bg-white/20 backdrop-blur rounded-2xl px-5 py-4 text-center border border-white/30">
            <div className="text-3xl font-bold text-white">{Math.abs(days)}</div>
            <div className="text-white/80 text-xs font-medium mt-0.5">{days < 0 ? 'days ago' : days === 0 ? 'Today!' : 'days to go'}</div>
          </div>
        </div>
        {activeEvent.description && (
          <div className="px-6 sm:px-8 pb-5 text-white/70 text-sm max-w-2xl">{activeEvent.description}</div>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              alert.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
              : alert.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <AlertTriangle size={15} className="shrink-0" />{alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Budget Used" value={`${budgetPct}%`} sub={`${formatCurrency(stats.totalSpent)} of ${formatCurrency(activeEvent.totalBudget)}`} icon={<DollarSign size={20} className="text-white" />} color={isOverBudget ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'} trend={isOverBudget ? 'down' : 'neutral'} />
        <StatCard label="RSVP Rate" value={`${rsvpRate}%`} sub={`${guestTotals.attending} of ${activeEvent.guests.length} confirmed`} icon={<Users size={20} className="text-white" />} color="bg-blue-500" trend="up" />
        <StatCard label="Tasks Done" value={`${taskStats.completionPct}%`} sub={`${taskStats.done}/${taskStats.total} complete`} icon={<CheckSquare size={20} className="text-white" />} color="bg-violet-500" />
        <StatCard label="Days Until Event" value={days < 0 ? 'Past' : String(days)} sub={formatDate(activeEvent.date)} icon={<Calendar size={20} className="text-white" />} color={days < 7 ? 'bg-red-500' : days < 30 ? 'bg-amber-500' : 'bg-indigo-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Budget Overview</h2>
            <button onClick={() => setActiveTab('budget')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Manage <ArrowRight size={12} /></button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Budget</span>
              <span className="font-semibold text-gray-900">{formatCurrency(activeEvent.totalBudget)}</span>
            </div>
            <ProgressBar value={stats.totalSpent} max={activeEvent.totalBudget} color={isOverBudget ? 'bg-red-500' : 'bg-emerald-500'} />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-xl p-2"><div className="text-sm font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</div><div className="text-xs text-gray-400">Committed</div></div>
              <div className="bg-gray-50 rounded-xl p-2"><div className="text-sm font-bold text-amber-600">{formatCurrency(stats.totalPending)}</div><div className="text-xs text-gray-400">Pending</div></div>
              <div className={`rounded-xl p-2 ${isOverBudget ? 'bg-red-50' : 'bg-emerald-50'}`}><div className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(Math.abs(activeEvent.totalBudget - stats.totalSpent))}</div><div className="text-xs text-gray-400">{isOverBudget ? 'Over' : 'Left'}</div></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {activeEvent.budgetCategories.slice(0, 4).map((cat) => {
              const spent = activeEvent.expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
              const pct = cat.allocated === 0 ? 0 : Math.min(100, Math.round((spent / cat.allocated) * 100));
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-sm" aria-hidden="true">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>{cat.name}</span><span>{formatCurrency(spent)}</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Guest RSVP</h2>
            <button onClick={() => setActiveTab('guests')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">Manage <ArrowRight size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Attending', value: guestTotals.attending, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Tentative', value: guestTotals.tentative, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Declined', value: guestTotals.declined, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Invited', value: guestTotals.invited + guestTotals.awaiting, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          <ProgressBar value={guestTotals.attending} max={activeEvent.guests.length} color="bg-emerald-500" />
          <div className="text-xs text-gray-400 mt-1">{guestTotals.attending + guestTotals.plusOnes} attending incl. +1s</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2"><Zap size={16} className="text-amber-500" />Urgent Tasks</h2>
            <button onClick={() => setActiveTab('tasks')} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">All tasks <ArrowRight size={12} /></button>
          </div>
          {urgentTasks.length === 0 ? (
            <div className="text-center py-6 text-gray-400"><CheckSquare size={32} className="mx-auto mb-2 text-emerald-400" /><p className="text-sm">No urgent tasks — great job!</p></div>
          ) : (
            <div className="space-y-2">
              {urgentTasks.map((task) => (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${isOverdue(task.dueDate) ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <Clock size={10} />Due {task.dueDate}
                      {isOverdue(task.dueDate) && <span className="text-red-600 font-medium">OVERDUE</span>}
                      {task.assignee && <span>• {task.assignee}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-lg shrink-0 ${task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{task.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Manage Budget', tab: 'budget' as const, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { label: 'Add Guest', tab: 'guests' as const, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { label: 'Manage Tasks', tab: 'tasks' as const, color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
              { label: 'Run Sheet', tab: 'schedule' as const, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              { label: 'Vendors', tab: 'vendors' as const, color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
              { label: 'Change Theme', tab: 'themes' as const, color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
            ].map((action) => (
              <button key={action.label} onClick={() => setActiveTab(action.tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${action.color}`}>
                <Plus size={14} />{action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
