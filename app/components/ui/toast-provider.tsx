"use client";

import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning';

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
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const ToastComponent = ({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) => {
    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    accentColor: '#22C55E',
                };
            case 'error':
                return {
                    accentColor: '#EF4444',
                };
            case 'warning':
                return {
                    accentColor: '#F59E0B',
                };
            default:
                return {
                    accentColor: '#22C55E',
                };
        }
    };

    const styles = getToastStyles();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, toast.duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 350 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 350 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                duration: 0.2
            }}
            layout
        >
            <div
                className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl shadow-lg backdrop-blur-sm border border-gray-200 min-w-[250px] md:min-w-[300px] max-w-[320px] md:max-w-[400px] cursor-pointer group hover:shadow-xl transition-all duration-200 bg-white"
                style={{ color: '#1f2937' }}
                onClick={() => onRemove(toast.id)}
            >
                <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: styles.accentColor }}
                />
                <span className="text-xs md:text-sm font-medium flex-1 text-center">
                    {toast.message}
                </span>
            </div>
        </motion.div>
    );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = (message: string, type: ToastType = 'success', duration: number = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: ToastItem = { id, message, type, duration };

        setToasts((prev) => [...prev, newToast]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-2 md:right-4 z-[9999] pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast, index) => (
                        <div key={toast.id} style={{ marginBottom: index > 0 ? '8px' : '0' }}>
                            <ToastComponent
                                toast={toast}
                                onRemove={removeToast}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
