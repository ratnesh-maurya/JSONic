"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./toast-provider";

interface TreeNodeProps {
    data: any;
    path: string;
    level: number;
    isExpanded: (path: string) => boolean;
    onToggle: (path: string) => void;
}

const TreeNode = ({ data, path, level, isExpanded, onToggle }: TreeNodeProps) => {
    const { showToast } = useToast();
    const [isHovered, setIsHovered] = useState(false);
    const isObject = typeof data === 'object' && data !== null && !Array.isArray(data);
    const isArray = Array.isArray(data);
    const hasChildren = isObject || isArray;
    const childrenCount = hasChildren ? Object.keys(data).length : 0;
    const expanded = isExpanded(path);

    const copyToClipboard = async (text: string, message: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(message, 'success', 2500);
        } catch (error) {
            showToast("Failed to copy to clipboard", 'error', 3000);
        }
    };

    const getValueDisplay = (value: any) => {
        if (typeof value === "string") return `"${value}"`;
        if (value === null) return "null";
        return String(value);
    };

    const getValueColor = (value: any) => {
        if (typeof value === "string") return "text-emerald-400";
        if (typeof value === "number") return "text-blue-400 font-medium";
        if (typeof value === "boolean") return "text-purple-400 font-bold";
        if (value === null) return "text-gray-400 font-bold italic";
        return "text-white";
    };

    if (hasChildren) {
        return (
            <div className="relative">
                <div
                    className="group flex items-center cursor-pointer hover:bg-gray-800/40 rounded-md p-1 transition-all duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(path);
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <span
                        className={`text-blue-400 mr-2 text-xs w-4 select-none transition-transform duration-100 ${expanded ? 'rotate-90' : ''}`}
                    >
                        ▶
                    </span>
                    <span className="text-purple-400 font-semibold text-md select-none">{isArray ? "[" : "{"}</span>
                    {!expanded && (
                        <span className="text-gray-400 ml-2 text-xs italic bg-gray-700/50 px-2 py-0.5 rounded-full select-none">
                            {childrenCount} {isArray ? "items" : "props"}
                        </span>
                    )}
                    {!expanded && <span className="text-purple-400 ml-1 font-semibold text-md select-none">{isArray ? "]" : "}"}</span>}

                    <AnimatePresence>
                        {isHovered && !expanded && (
                            <motion.div
                                className="flex items-center space-x-1 ml-auto pl-2"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(JSON.stringify(data, null, 2), "Value copied!");
                                    }}
                                    className="px-2 py-0.5 text-xs rounded hover:bg-gray-600/50 bg-gray-700/50 border border-gray-600/50 transition-colors"
                                    title="Copy value"
                                >
                                    Copy
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {expanded && (
                    <div className="ml-4 border-l-2 border-gray-700/50 pl-4 mt-1">
                        {Object.entries(data).map(([key, value]) => (
                            <div key={`${path}.${key}`} className="flex items-start my-1 group/item">
                                <span className="text-cyan-300 font-medium mr-2 text-xs select-none">"{key}"</span>
                                <span className="text-gray-300 mr-2 font-bold select-none">:</span>
                                <div className="flex-1">
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
                )}
                {expanded && (
                    <div className="text-purple-400 font-bold text-md pl-1 mt-1 select-none">
                        {isArray ? "]" : "}"}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className="relative flex items-center group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className={getValueColor(data)}>{getValueDisplay(data)}</span>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        className="flex items-center space-x-1 ml-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                    >
                        <button
                            onClick={() => copyToClipboard(path, "JSONPath copied!")}
                            className="px-2 py-0.5 text-xs rounded hover:bg-gray-600/50 bg-gray-700/50 border border-gray-600/50"
                            title="Copy path"
                        >
                            Path
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface JSONTreeViewerProps {
    json: string;
    className?: string;
}

export const JSONTreeViewer = ({ json, className }: JSONTreeViewerProps) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));

    const toggleNode = (path: string) => {
        setExpandedNodes(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(path)) {
                newExpanded.delete(path);
            } else {
                newExpanded.add(path);
            }
            return newExpanded;
        });
    };

    const isNodeExpanded = (path: string) => expandedNodes.has(path);

    try {
        const data = JSON.parse(json);
        return (
            <div className={`font-mono text-sm ${className} p-2`}>
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
            <div className="text-red-400 p-2">
                Invalid JSON
            </div>
        );
    }
};
