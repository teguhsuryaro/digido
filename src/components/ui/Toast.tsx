import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

// ====== Toast Store (sederhana, tanpa Zustand karena self-contained) ======
type ToastListener = (toasts: ToastData[]) => void;
let toasts: ToastData[] = [];
let listeners: ToastListener[] = [];

function emitChange() {
  listeners.forEach((l) => l([...toasts]));
}

export const toast = {
  success: (message: string, duration = 3000) =>
    toast._add({ message, variant: 'success', duration }),
  error: (message: string, duration = 4000) =>
    toast._add({ message, variant: 'error', duration }),
  warning: (message: string, duration = 3500) =>
    toast._add({ message, variant: 'warning', duration }),
  info: (message: string, duration = 3000) =>
    toast._add({ message, variant: 'info', duration }),

  _add: ({ message, variant, duration = 3000 }: Omit<ToastData, 'id'> & { duration?: number }) => {
    const id = crypto.randomUUID();
    toasts = [...toasts, { id, message, variant, duration }];
    emitChange();

    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      emitChange();
    }, duration);
  },

  subscribe: (listener: ToastListener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

// ====== Toast UI ======
const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-900/50 dark:text-green-400',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400',
  warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-400',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-400',
};

const variantIcons: Record<ToastVariant, any> = {
  success: <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 shrink-0" />,
  error: <XCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />,
  info: <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />,
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            pointer-events-auto flex items-start gap-3
            px-4 py-3 rounded-card shadow-lg border
            animate-in fade-in slide-in-from-top-4 duration-300
            ${variantStyles[item.variant]}
          `}
          role="alert"
        >
          <div className="mt-0.5">{variantIcons[item.variant]}</div>
          <p className="text-sm font-medium flex-1">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
