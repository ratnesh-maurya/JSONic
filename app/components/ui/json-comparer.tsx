"use client";

import { useMemo, useState } from "react";
import { diffChars } from 'diff';
import { JSONTreeViewer } from './json-tree-viewer';

interface JSONComparerProps {
    json1: string;
    json2: string;
    className?: string;
}



export const JSONComparer = ({ json1, json2, className }: JSONComparerProps) => {
    const [smartCompare, setSmartCompare] = useState(true);
    const [viewMode, setViewMode] = useState<"diff" | "tree">("diff");

    const { diffs, summary } = useMemo(() => {
        try {
            let obj1 = JSON.parse(json1);
            let obj2 = JSON.parse(json2);

            const sortObject = (obj: unknown): unknown => {
                if (typeof obj !== 'object' || obj === null) return obj;
                if (Array.isArray(obj)) return obj.map(sortObject).sort();
                return Object.keys(obj as Record<string, unknown>).sort().reduce((result, key) => {
                    (result as Record<string, unknown>)[key] = sortObject((obj as Record<string, unknown>)[key]);
                    return result;
                }, {} as Record<string, unknown>);
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
                        className={`px-3 py-1 rounded-xl text-sm transition-all duration-200 cursor-pointer font-medium ${viewMode === "diff"
                            ? "bg-indigo-600 text-white border border-indigo-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                    >
                        Diff View
                    </button>
                    <button
                        onClick={() => setViewMode("tree")}
                        className={`px-3 py-1 rounded-xl text-sm transition-all duration-200 cursor-pointer font-medium ${viewMode === "tree"
                            ? "bg-indigo-600 text-white border border-indigo-300"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
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
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white"
                    />
                    <label htmlFor="smartCompare" className="text-sm text-gray-700">Smart Compare (ignore order)</label>
                </div>
            </div>

            {/* Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Comparison Summary</h4>
                <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-emerald-600 font-medium">Additions: {summary.added}</span>
                    <span className="text-red-600 font-medium">Deletions: {summary.removed}</span>
                </div>
            </div>

            {/* Differences View */}
            {viewMode === "diff" ? (
                <div className="w-full h-[350px] p-4 bg-white border border-gray-200 rounded-xl overflow-auto shadow-sm">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                        {diffs.map((part, index) => {
                            const color = part.added ? 'bg-emerald-100 text-emerald-700' :
                                part.removed ? 'bg-red-100 text-red-700' : 'text-gray-600';
                            return <span key={index} className={color}>{part.value}</span>;
                        })}
                    </pre>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 bg-blue-100 text-blue-700 px-3 py-1 rounded-xl">JSON 1 - Tree Structure</h4>
                        <div className="w-full h-[350px] p-4 bg-white border border-gray-200 rounded-xl overflow-auto shadow-sm">
                            {json1 ? (
                                <JSONTreeViewer json={json1} />
                            ) : (
                                <div className="text-gray-500 text-center mt-16">
                                    <div className="text-4xl mb-2">📄</div>
                                    <p>No JSON 1 data</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 bg-purple-100 text-purple-700 px-3 py-1 rounded-xl">JSON 2 - Tree Structure</h4>
                        <div className="w-full h-[350px] p-4 bg-white border border-gray-200 rounded-xl overflow-auto shadow-sm">
                            {json2 ? (
                                <JSONTreeViewer json={json2} />
                            ) : (
                                <div className="text-gray-500 text-center mt-16">
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
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center shadow-sm">
                    {summary.added === 0 && summary.removed === 0 ? (
                        <span className="text-emerald-600 text-lg font-medium">✅ JSONs are identical</span>
                    ) : (
                        <span className="text-yellow-600 text-lg font-medium">❌ JSONs are different</span>
                    )}
                </div>
            )}
        </div>
    );
};
