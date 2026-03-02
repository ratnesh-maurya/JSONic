"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./toast-provider";

interface TreeNodeProps {
    data: unknown;
    path: string;
    level: number;
    isExpanded: (path: string) => boolean;
    onToggle: (path: string) => void;
}

/* Small icon buttons — rendered absolutely so they never shift layout */
function CopyIcon() {
    return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

function PathIcon() {
    return (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

const TreeNode = ({ data, path, level, isExpanded, onToggle }: TreeNodeProps) => {
    const { showToast } = useToast();
    const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
    const isArray = Array.isArray(data);
    const hasChildren = isObject || isArray;
    const childrenCount = hasChildren ? Object.keys(data as object).length : 0;
    const expanded = isExpanded(path);

    const copyToClipboard = useCallback(async (text: string, message: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            showToast(message, 'success', 2000);
        } catch {
            showToast("Failed to copy", 'error', 2500);
        }
    }, [showToast]);

    const getValueDisplay = (value: unknown) => {
        if (typeof value === "string") return `"${value}"`;
        if (value === null) return "null";
        return String(value);
    };

    const getValueColor = (value: unknown) => {
        if (typeof value === "string") return "text-emerald-600 dark:text-emerald-400";
        if (typeof value === "number") return "text-violet-600 dark:text-violet-400 font-medium";
        if (typeof value === "boolean") return "text-red-600 dark:text-red-400 font-semibold";
        if (value === null) return "text-gray-500 dark:text-gray-400 font-semibold italic";
        return "text-gray-900 dark:text-gray-100";
    };

    if (hasChildren) {
        return (
            <div className="relative">
                {/* group hover shows the copy icon absolutely — no layout shift */}
                <div
                    className="group relative flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 rounded-md py-0.5 pr-8 transition-colors duration-100"
                    onClick={(e) => { e.stopPropagation(); onToggle(path); }}
                >
                    <span className={`text-indigo-500 dark:text-indigo-400 mr-1.5 text-[10px] w-3 select-none transition-transform duration-150 inline-block ${expanded ? 'rotate-90' : ''}`}>
                        ▶
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold select-none">{isArray ? "[" : "{"}</span>
                    {!expanded && (
                        <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-[11px] italic bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.5 rounded-full select-none leading-none">
                            {childrenCount} {isArray ? "item" : "prop"}{childrenCount !== 1 ? "s" : ""}
                        </span>
                    )}
                    {!expanded && <span className="text-purple-600 dark:text-purple-400 ml-1 font-semibold select-none">{isArray ? "]" : "}"}</span>}

                    {/* Absolutely positioned — never shifts layout */}
                    <button
                        onClick={(e) => copyToClipboard(JSON.stringify(data, null, 2), "Copied!", e)}
                        title="Copy value"
                        className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                        <CopyIcon />
                    </button>
                </div>

                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="overflow-hidden"
                        >
                            <div className="ml-4 border-l border-gray-200 dark:border-gray-600/60 pl-3 mt-0.5">
                                {Object.entries(data as object).map(([key, value]) => (
                                    <div key={`${path}.${key}`} className="flex items-start my-0.5">
                                        <span className="text-sky-600 dark:text-sky-400 font-medium mr-1.5 text-[12px] select-none shrink-0">&quot;{key}&quot;</span>
                                        <span className="text-gray-500 dark:text-gray-400 mr-1.5 select-none shrink-0">:</span>
                                        <div className="flex-1 min-w-0">
                                            <TreeNode
                                                data={value}
                                                path={isArray ? `${path}[${key}]` : `${path}.${key}`}
                                                level={level + 1}
                                                isExpanded={isExpanded}
                                                onToggle={onToggle}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-purple-600 dark:text-purple-400 font-semibold pl-1 mt-0.5 select-none text-sm">
                                {isArray ? "]" : "}"}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    /* Leaf node: copy icons absolutely positioned, zero layout shift */
    return (
        <div className="group relative flex items-center pr-14 py-0.5">
            <span className={`${getValueColor(data)} text-[12px] truncate max-w-[300px]`} title={getValueDisplay(data)}>
                {getValueDisplay(data)}
            </span>
            {/* Absolute action bar — doesn't push content */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                    onClick={(e) => copyToClipboard(getValueDisplay(data), "Value copied!", e)}
                    title="Copy value"
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-pointer"
                >
                    <CopyIcon />
                </button>
                <button
                    onClick={(e) => copyToClipboard(path, "Path copied!", e)}
                    title="Copy JSONPath"
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-pointer"
                >
                    <PathIcon />
                </button>
            </div>
        </div>
    );
};

interface JSONTreeViewerProps {
    json: string;
    className?: string;
}

export const JSONTreeViewer = ({ json, className }: JSONTreeViewerProps) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));

    const toggleNode = useCallback((path: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(path)) { next.delete(path); } else { next.add(path); }
            return next;
        });
    }, []);

    const isNodeExpanded = useCallback((path: string) => expandedNodes.has(path), [expandedNodes]);

    try {
        const data = JSON.parse(json);
        return (
            <div className={`font-mono text-sm ${className ?? ""} p-1`}>
                <TreeNode
                    data={data}
                    path="root"
                    level={0}
                    isExpanded={isNodeExpanded}
                    onToggle={toggleNode}
                />
            </div>
        );
    } catch {
        return (
            <div className="text-red-500 dark:text-red-400 p-2 text-sm">
                ⚠ Invalid JSON
            </div>
        );
    }
};
