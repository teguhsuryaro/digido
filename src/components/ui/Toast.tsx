import { useEffect, useState } from 'react';

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
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-primary-500 text-white',
};

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    return toast.subscribe(setItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {items.map((item) => (
        <div
          key={item.id}
          className={`
            pointer-events-auto flex items-center gap-3
            px-4 py-3 rounded-card shadow-modal
            animate-in slide-in-from-right duration-300
            ${variantStyles[item.variant]}
          `}
          role="alert"
        >
          <span className="text-lg font-bold">{variantIcons[item.variant]}</span>
          <p className="text-sm font-medium flex-1">{item.message}</p>
        </div>
      ))}
    </div>
  );
}
