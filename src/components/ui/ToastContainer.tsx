import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { usePractice } from '../../context/PracticeContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = usePractice();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const icon =
          toast.variant === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : toast.variant === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : toast.variant === 'error' ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#0D182E] border border-[#22365B] rounded-lg shadow-2xl px-4 py-3 flex items-start gap-3 transition-all"
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
