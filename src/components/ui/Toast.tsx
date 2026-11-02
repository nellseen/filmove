import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-white rounded-lg border border-[#E5E8EC] shadow-md animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <div className="flex items-start gap-2.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />}
              <p className="text-xs font-medium text-[#17191C] leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#68707A] hover:text-[#17191C] p-0.5 rounded cursor-pointer transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
