import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "success" | "error";
}

interface ToastContextValue {
  toast: (props: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (props: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...props, id }]);
      setTimeout(() => dismiss(id), 5000);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right-5 ${
              t.variant === "error"
                ? "border-destructive/50 bg-destructive/10 text-destructive"
                : t.variant === "success"
                  ? "border-success/50 bg-success/10 text-success"
                  : "border-border bg-card text-card-foreground"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground text-xs shrink-0"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
