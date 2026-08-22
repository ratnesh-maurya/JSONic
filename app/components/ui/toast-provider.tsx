"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

const ACCENT: Record<ToastType, string> = {
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#6366F1",
};

/** Entry/exit are CSS keyframes — this used to pull in framer-motion for one slide. */
const Toast = ({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), toast.duration);
        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <div
            role="status"
            aria-live="polite"
            onClick={() => onRemove(toast.id)}
            className="pointer-events-auto mb-2 flex min-w-[240px] max-w-[380px] animate-toast-in cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
            <span className="h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: ACCENT[toast.type] }} />
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</span>
        </div>
    );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "success", duration = 3000) => {
        const id = `t${counter.current++}`;
        // cap the stack so a fast loop of copies cannot fill the viewport
        setToasts((prev) => [...prev.slice(-3), { id, message, type, duration }]);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="pointer-events-none fixed bottom-4 right-2 z-[9999] flex flex-col items-end md:right-4">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};
