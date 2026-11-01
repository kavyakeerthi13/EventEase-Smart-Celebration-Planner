import React from 'react';
import { useEvents } from '../../context/EventContext';
import type { Toast } from '../../types';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS: Record<Toast['type'], React.ReactNode> = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <AlertCircle size={18} className="text-red-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const BORDER_COLORS: Record<Toast['type'], string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-blue-500',
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`toast-enter flex items-start gap-3 bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${BORDER_COLORS[toast.type]} px-4 py-3 min-w-[280px] max-w-sm`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">{ICONS[toast.type]}</span>
      <p className="text-sm text-gray-800 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { state, removeToast } = useEvents();

  if (state.toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 no-print"
      aria-label="Notifications"
    >
      {state.toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
