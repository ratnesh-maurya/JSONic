"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning';

export interface ToastHandles {
    show: (message: string, type?: ToastType, duration?: number) => void;
}

const Toast = forwardRef<ToastHandles, Record<string, never>>((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('success');

    useImperativeHandle(ref, () => ({
        show(message: string, type: ToastType = 'success', duration: number = 3000) {
            setMessage(message);
            setType(type);
            setVisible(true);

            setTimeout(() => {
                hideToast();
            }, duration);
        },
    }));

    const hideToast = () => {
        setVisible(false);
    };

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    icon: '✓',
                    iconBg: 'bg-emerald-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-emerald-200'
                };
            case 'error':
                return {
                    icon: '✕',
                    iconBg: 'bg-red-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-red-200'
                };
            case 'warning':
                return {
                    icon: '!',
                    iconBg: 'bg-amber-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-amber-200'
                };
            default:
                return {
                    icon: '✓',
                    iconBg: 'bg-emerald-500',
                    textColor: 'text-gray-900',
                    bgColor: 'bg-white',
                    borderColor: 'border-emerald-200'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed top-4 right-4 z-[9999] pointer-events-auto"
                    initial={{ opacity: 0, x: 100, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 100, scale: 0.95 }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        duration: 0.15
                    }}
                >
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles.bgColor} ${styles.borderColor} min-w-[300px] max-w-[400px] cursor-pointer group hover:shadow-xl transition-shadow duration-200`}
                        onClick={hideToast}
                    >
                        <div className={`w-5 h-5 rounded-full ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">
                                {styles.icon}
                            </span>
                        </div>
                        <span className={`text-sm font-medium ${styles.textColor} flex-1`}>
                            {message}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-400 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});

Toast.displayName = 'Toast';

export default Toast;
