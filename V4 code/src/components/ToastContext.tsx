import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContainer, ToastProps } from '@jobswyft/ui';

interface ToastContextType {
    toast: (props: Omit<ToastProps, 'id'>) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: React.ReactNode;
}

interface ToastItem extends ToastProps {
    id: string;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback(({ ...props }: Omit<ToastProps, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { ...props, id };

        setToasts((prev) => [...prev, newToast]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            <ToastContainer className="top-4 right-4 z-[100]">
                {toasts.map((t) => (
                    <Toast
                        key={t.id}
                        {...t}
                        onDismiss={() => dismiss(t.id)}
                    />
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
