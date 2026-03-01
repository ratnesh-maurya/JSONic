"use client";

import { useRef, useState, useEffect } from "react";

interface TextareaWithLineNumbersProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    errorLine?: number;
}

export const TextareaWithLineNumbers = ({
    value,
    onChange,
    placeholder,
    className = "",
    errorLine
}: TextareaWithLineNumbersProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [lineCount, setLineCount] = useState(1);

    useEffect(() => {
        const lines = value.split('\n').length;
        setLineCount(lines);
    }, [value]);

    const handleScroll = () => {
        const textarea = textareaRef.current;
        const lineNumbers = document.getElementById('line-numbers');
        if (textarea && lineNumbers) {
            lineNumbers.scrollTop = textarea.scrollTop;
        }
    };

    const lineNumbers = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

    return (
        <div className="relative flex">
            {/* Line Numbers */}
            <div
                id="line-numbers"
                className="flex flex-col bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-xs font-mono select-none overflow-hidden"
                style={{
                    width: '40px',
                    height: '100%',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                }}
            >
                {lineNumbers.map((num) => (
                    <div
                        key={num}
                        className={`px-2 leading-5 text-center ${errorLine === num
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold border-r-2 border-red-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                        style={{ minHeight: '20px' }}
                    >
                        {num}
                    </div>
                ))}
            </div>

            {/* Textarea */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                placeholder={placeholder}
                className={`flex-1 p-3 bg-transparent border-0 text-gray-900 dark:text-gray-100 font-mono text-xs md:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-5 ${className}`}
                style={{
                    paddingLeft: '12px',
                    lineHeight: '20px',
                }}
            />
        </div>
    );
};
