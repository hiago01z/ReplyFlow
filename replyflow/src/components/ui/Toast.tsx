"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error:   AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-green-200 bg-white text-green-700 [&_svg]:text-green-500",
  error:   "border-red-200 bg-white text-red-700 [&_svg]:text-red-500",
  warning: "border-amber-200 bg-white text-amber-700 [&_svg]:text-amber-500",
  info:    "border-indigo-200 bg-white text-indigo-700 [&_svg]:text-indigo-500",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration ?? 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, toast.duration, onRemove]);

  const Icon = ICONS[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-full max-w-sm rounded-xl border shadow-lg px-4 py-3.5 transition-all duration-300",
        STYLES[toast.type],
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
    >
      <Icon size={17} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        {toast.description && (
          <p className="text-xs mt-0.5 opacity-80 leading-snug">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((opts: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast:   add,
    success: (title, description) => add({ type: "success", title, description }),
    error:   (title, description) => add({ type: "error",   title, description }),
    warning: (title, description) => add({ type: "warning", title, description }),
    info:    (title, description) => add({ type: "info",    title, description }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Portal anchor */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
