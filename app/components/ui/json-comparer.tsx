"use client";

import { useMemo, useState } from "react";
import { diffChars } from 'diff';
import { JSONTreeViewer } from './json-tree-viewer';

interface JSONComparerProps {
    json1: string;
    json2: string;
    className?: string;
}

interface DiffResult {
    type: 'added' | 'removed' | 'modified' | 'unchanged';
    path: string;
    value1?: any;
    value2?: any;
}

export const JSONComparer = ({ json1, json2, className }: JSONComparerProps) => {
    const [smartCompare, setSmartCompare] = useState(true);
    const [viewMode, setViewMode] = useState<"diff" | "tree">("diff");

    const { diffs, summary } = useMemo(() => {
        try {
            let obj1 = JSON.parse(json1);
            let obj2 = JSON.parse(json2);

            const sortObject = (obj: any): any => {
                if (typeof obj !== 'object' || obj === null) return obj;
                if (Array.isArray(obj)) return obj.map(sortObject).sort();
                return Object.keys(obj).sort().reduce((result, key) => {
                    result[key] = sortObject(obj[key]);
                    return result;
                }, {} as { [key: string]: any });
            };

            if (smartCompare) {
                obj1 = sortObject(obj1);
                obj2 = sortObject(obj2);
            }

            const str1 = JSON.stringify(obj1, null, 2);
            const str2 = JSON.stringify(obj2, null, 2);

            const differences = diffChars(str1, str2);

            const summary = differences.reduce((acc, part) => {
                if (part.added) acc.added++;
                else if (part.removed) acc.removed++;
                else acc.common++;
                return acc;
            }, { added: 0, removed: 0, common: 0 });

            return { diffs: differences, summary };
        } catch {
            return { diffs: [], summary: { added: 0, removed: 0, common: 0 } };
        }
    }, [json1, json2, smartCompare]);

    return (
        <div className={className}>
            {/* Options */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewMode("diff")}
                        className={`px-3 py-1 rounded text-sm transition-all duration-200 ${viewMode === "diff"
                            ? "bg-blue-600/50 text-white border border-blue-500/50"
                            : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                            }`}
                    >
                        Diff View
                    </button>
                    <button
                        onClick={() => setViewMode("tree")}
                        className={`px-3 py-1 rounded text-sm transition-all duration-200 ${viewMode === "tree"
                            ? "bg-blue-600/50 text-white border border-blue-500/50"
                            : "bg-gray-700/50 text-gray-300 border border-gray-600/50"
                            }`}
                    >
                        Tree View
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="smartCompare"
                        checked={smartCompare}
                        onChange={(e) => setSmartCompare(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                    />
                    <label htmlFor="smartCompare" className="text-sm text-gray-300">Smart Compare (ignore order)</label>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Comparison Summary</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-green-400">Additions: {summary.added}</span>
                    <span className="text-red-400">Deletions: {summary.removed}</span>
                </div>
            </div>

            {/* Differences View */}
            {viewMode === "diff" ? (
                <div className="w-full h-[350px] p-4 bg-gray-900/40 border border-gray-700/50 rounded-xl overflow-auto backdrop-blur-sm">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                        {diffs.map((part, index) => {
                            const color = part.added ? 'bg-green-500/20 text-green-300' :
                                part.removed ? 'bg-red-500/20 text-red-300' : 'text-gray-400';
                            return <span key={index} className={color}>{part.value}</span>;
                        })}
                    </pre>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 bg-blue-600/20 px-3 py-1 rounded">JSON 1 - Tree Structure</h4>
                        <div className="w-full h-[350px] p-4 bg-gray-900/40 border border-gray-700/50 rounded-xl overflow-auto backdrop-blur-sm">
                            {json1 ? (
                                <JSONTreeViewer json={json1} />
                            ) : (
                                <div className="text-gray-400 text-center mt-16">
                                    <div className="text-4xl mb-2">📄</div>
                                    <p>No JSON 1 data</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 bg-purple-600/20 px-3 py-1 rounded">JSON 2 - Tree Structure</h4>
                        <div className="w-full h-[350px] p-4 bg-gray-900/40 border border-gray-700/50 rounded-xl overflow-auto backdrop-blur-sm">
                            {json2 ? (
                                <JSONTreeViewer json={json2} />
                            ) : (
                                <div className="text-gray-400 text-center mt-16">
                                    <div className="text-4xl mb-2">📄</div>
                                    <p>No JSON 2 data</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Overall Result */}
            {diffs.length > 0 && (
                <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 text-center">
                    {summary.added === 0 && summary.removed === 0 ? (
                        <span className="text-green-400 text-lg">✅ JSONs are identical</span>
                    ) : (
                        <span className="text-yellow-400 text-lg">❌ JSONs are different</span>
                    )}
                </div>
            )}
        </div>
    );
};
