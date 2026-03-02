"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { diffLines } from "diff";
import { JSONTreeViewer } from "./json-tree-viewer";
import { useToast } from "./toast-provider";

// ── Types ──────────────────────────────────────────────────────────────────
interface StructDiffItem {
    path: string;
    type: "added" | "removed" | "changed";
    oldValue?: unknown;
    newValue?: unknown;
}

interface SideLine {
    text: string;
    lineNo: number | null;
    type: "equal" | "added" | "removed" | "empty";
}

type ViewMode = "structural" | "unified" | "sidebyside" | "tree";

interface JSONComparerProps {
    json1: string;
    json2: string;
    className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function splitLines(str: string): string[] {
    const lines = str.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
}

function formatValue(val: unknown, maxLen = 72): string {
    if (val === undefined) return "";
    if (val === null) return "null";
    if (typeof val === "string") {
        const s = `"${val}"`;
        return s.length > maxLen ? s.slice(0, maxLen) + '…"' : s;
    }
    if (typeof val === "object") {
        const s = JSON.stringify(val);
        return s.length > maxLen ? s.slice(0, maxLen) + "…" : s;
    }
    return String(val);
}

function deepDiff(a: unknown, b: unknown, path = ""): StructDiffItem[] {
    if (a === b) return [];

    const items: StructDiffItem[] = [];
    const displayPath = path || "root";

    if (a === null || b === null || a === undefined || b === undefined) {
        if (a === undefined) items.push({ path: displayPath, type: "added", newValue: b });
        else if (b === undefined) items.push({ path: displayPath, type: "removed", oldValue: a });
        else items.push({ path: displayPath, type: "changed", oldValue: a, newValue: b });
        return items;
    }

    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    const aIsObj = typeof a === "object" && !aIsArray;
    const bIsObj = typeof b === "object" && !bIsArray;

    if (aIsArray && bIsArray) {
        const aa = a as unknown[];
        const bb = b as unknown[];
        const maxLen = Math.max(aa.length, bb.length);
        for (let i = 0; i < maxLen; i++) {
            const cp = `${path}[${i}]`;
            if (i >= aa.length) items.push({ path: cp, type: "added", newValue: bb[i] });
            else if (i >= bb.length) items.push({ path: cp, type: "removed", oldValue: aa[i] });
            else items.push(...deepDiff(aa[i], bb[i], cp));
        }
        return items;
    }

    if (aIsObj && bIsObj) {
        const ao = a as Record<string, unknown>;
        const bo = b as Record<string, unknown>;
        const allKeys = new Set([...Object.keys(ao), ...Object.keys(bo)]);
        for (const key of allKeys) {
            const cp = path ? `${path}.${key}` : key;
            const hasA = Object.prototype.hasOwnProperty.call(ao, key);
            const hasB = Object.prototype.hasOwnProperty.call(bo, key);
            if (!hasA) items.push({ path: cp, type: "added", newValue: bo[key] });
            else if (!hasB) items.push({ path: cp, type: "removed", oldValue: ao[key] });
            else items.push(...deepDiff(ao[key], bo[key], cp));
        }
        return items;
    }

    items.push({ path: displayPath, type: "changed", oldValue: a, newValue: b });
    return items;
}

function buildSideBySide(str1: string, str2: string) {
    const changes = diffLines(str1, str2);
    const leftLines: SideLine[] = [];
    const rightLines: SideLine[] = [];
    let leftNo = 1, rightNo = 1;

    let i = 0;
    while (i < changes.length) {
        const change = changes[i];

        // Paired replace: removed immediately followed by added
        if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
            const removedLs = splitLines(change.value);
            const addedLs = splitLines(changes[i + 1].value);
            const maxLen = Math.max(removedLs.length, addedLs.length);
            for (let j = 0; j < maxLen; j++) {
                leftLines.push(j < removedLs.length
                    ? { text: removedLs[j], lineNo: leftNo++, type: "removed" }
                    : { text: "", lineNo: null, type: "empty" });
                rightLines.push(j < addedLs.length
                    ? { text: addedLs[j], lineNo: rightNo++, type: "added" }
                    : { text: "", lineNo: null, type: "empty" });
            }
            i += 2;
        } else if (change.removed) {
            for (const line of splitLines(change.value)) {
                leftLines.push({ text: line, lineNo: leftNo++, type: "removed" });
                rightLines.push({ text: "", lineNo: null, type: "empty" });
            }
            i++;
        } else if (change.added) {
            for (const line of splitLines(change.value)) {
                leftLines.push({ text: "", lineNo: null, type: "empty" });
                rightLines.push({ text: line, lineNo: rightNo++, type: "added" });
            }
            i++;
        } else {
            for (const line of splitLines(change.value)) {
                leftLines.push({ text: line, lineNo: leftNo++, type: "equal" });
                rightLines.push({ text: line, lineNo: rightNo++, type: "equal" });
            }
            i++;
        }
    }

    return { leftLines, rightLines };
}

// ── Sub-components ─────────────────────────────────────────────────────────
function DiffBadge({ type }: { type: StructDiffItem["type"] }) {
    const styles = {
        added: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
        removed: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
        changed: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${styles[type]} uppercase tracking-wide shrink-0`}>
            {type === "added" ? "+ added" : type === "removed" ? "− removed" : "~ changed"}
        </span>
    );
}

function SidePanel({ lines, label, color, scrollRef, onScroll }: {
    lines: SideLine[];
    label: string;
    color: string;
    scrollRef: React.RefObject<HTMLDivElement | null>;
    onScroll: () => void;
}) {
    const lineTypeStyle: Record<SideLine["type"], string> = {
        equal: "text-gray-700 dark:text-gray-300",
        added: "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-800 dark:text-emerald-300",
        removed: "bg-red-50 dark:bg-red-900/25 text-red-800 dark:text-red-300",
        empty: "bg-gray-50 dark:bg-gray-700/30",
    };
    const lineNoStyle: Record<SideLine["type"], string> = {
        equal: "text-gray-400 dark:text-gray-500",
        added: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
        removed: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400",
        empty: "bg-gray-100 dark:bg-gray-700/50",
    };
    return (
        <div className="flex-1 min-w-0 flex flex-col">
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-t-xl border border-b-0 ${color}`}>
                {label}
            </div>
            <div
                ref={scrollRef}
                onScroll={onScroll}
                className="flex-1 overflow-auto border border-gray-200 dark:border-gray-600 rounded-b-xl rounded-tr-xl bg-white dark:bg-gray-800 font-mono text-xs"
            >
                {lines.map((line, idx) => (
                    <div key={idx} className={`flex min-w-0 leading-5 ${lineTypeStyle[line.type]}`}>
                        <span className={`w-10 shrink-0 text-right pr-2 select-none text-[10px] border-r border-gray-200 dark:border-gray-600/50 leading-5 ${lineNoStyle[line.type]}`}>
                            {line.lineNo ?? ""}
                        </span>
                        <span className="px-2 whitespace-pre overflow-visible">{line.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
const SIZE_LIMIT = 200 * 1024; // 200 KB combined

export const JSONComparer = ({ json1, json2, className }: JSONComparerProps) => {
    const { showToast } = useToast();
    const [smartCompare, setSmartCompare] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("structural");
    const [navIndex, setNavIndex] = useState(0);
    const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);

    const structItemRefs = useRef<(HTMLDivElement | null)[]>([]);
    const leftScrollRef = useRef<HTMLDivElement>(null);
    const rightScrollRef = useRef<HTMLDivElement>(null);
    const isSyncingLeft = useRef(false);
    const isSyncingRight = useRef(false);

    const { structDiffs, lineDiffs, sideBySide, summary, isValid, tooLarge } = useMemo(() => {
        const empty = {
            structDiffs: [] as StructDiffItem[],
            lineDiffs: [] as ReturnType<typeof diffLines>,
            sideBySide: { leftLines: [] as SideLine[], rightLines: [] as SideLine[] },
            summary: { added: 0, removed: 0, changed: 0, total: 0 },
            isValid: false,
            tooLarge: false,
        };

        if (!json1.trim() || !json2.trim()) return { ...empty, isValid: true };

        try {
            let obj1 = JSON.parse(json1);
            let obj2 = JSON.parse(json2);

            const combined = json1.length + json2.length;
            const tooLarge = combined > SIZE_LIMIT;

            const sortObject = (obj: unknown): unknown => {
                if (typeof obj !== "object" || obj === null) return obj;
                if (Array.isArray(obj)) return obj.map(sortObject);
                return Object.keys(obj as Record<string, unknown>).sort().reduce((r, k) => {
                    (r as Record<string, unknown>)[k] = sortObject((obj as Record<string, unknown>)[k]);
                    return r;
                }, {} as Record<string, unknown>);
            };

            if (smartCompare) {
                obj1 = sortObject(obj1);
                obj2 = sortObject(obj2);
            }

            const str1 = JSON.stringify(obj1, null, 2);
            const str2 = JSON.stringify(obj2, null, 2);

            const structDiffs = deepDiff(obj1, obj2);
            const added = structDiffs.filter(d => d.type === "added").length;
            const removed = structDiffs.filter(d => d.type === "removed").length;
            const changed = structDiffs.filter(d => d.type === "changed").length;

            const lineDiffs = tooLarge ? [] : diffLines(str1, str2);
            const sideBySide = tooLarge ? { leftLines: [], rightLines: [] } : buildSideBySide(str1, str2);

            return {
                structDiffs,
                lineDiffs,
                sideBySide,
                summary: { added, removed, changed, total: added + removed + changed },
                isValid: true,
                tooLarge,
            };
        } catch {
            return empty;
        }
    }, [json1, json2, smartCompare]);

    // Reset nav index when diffs change
    useEffect(() => { setNavIndex(0); }, [structDiffs.length]);

    const scrollToStructDiff = useCallback((idx: number) => {
        const el = structItemRefs.current[idx];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, []);

    const navigateDiff = useCallback((dir: 1 | -1) => {
        if (structDiffs.length === 0) return;
        const next = (navIndex + dir + structDiffs.length) % structDiffs.length;
        setNavIndex(next);
        scrollToStructDiff(next);
    }, [navIndex, structDiffs.length, scrollToStructDiff]);

    const syncLeftScroll = useCallback(() => {
        if (isSyncingLeft.current) return;
        isSyncingLeft.current = true;
        if (rightScrollRef.current && leftScrollRef.current) {
            rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
            rightScrollRef.current.scrollLeft = leftScrollRef.current.scrollLeft;
        }
        requestAnimationFrame(() => { isSyncingLeft.current = false; });
    }, []);

    const syncRightScroll = useCallback(() => {
        if (isSyncingRight.current) return;
        isSyncingRight.current = true;
        if (leftScrollRef.current && rightScrollRef.current) {
            leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
            leftScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
        }
        requestAnimationFrame(() => { isSyncingRight.current = false; });
    }, []);

    const copyToClipboard = useCallback(async (text: string, msg: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(msg, "success", 2000);
        } catch {
            showToast("Failed to copy", "error", 2500);
        }
    }, [showToast]);

    const identical = isValid && summary.total === 0 && json1.trim() !== "" && json2.trim() !== "";

    const tabs: { id: ViewMode; label: string }[] = [
        { id: "structural", label: "Structural" },
        { id: "unified", label: "Unified" },
        { id: "sidebyside", label: "Side by Side" },
        { id: "tree", label: "Tree" },
    ];

    return (
        <div className={`flex flex-col gap-3 ${className ?? ""}`}>
            {/* ── Toolbar ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                {/* View tabs */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-600 gap-0.5">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${viewMode === tab.id
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={smartCompare}
                            onChange={e => setSmartCompare(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 bg-white cursor-pointer"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Ignore key order</span>
                    </label>
                    {viewMode === "structural" && structDiffs.length > 0 && (
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showOnlyDiffs}
                                onChange={e => setShowOnlyDiffs(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 cursor-pointer"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Changed only</span>
                        </label>
                    )}
                    {/* Jump nav — structural view */}
                    {viewMode === "structural" && structDiffs.length > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigateDiff(-1)}
                                className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                                title="Previous diff"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3.5rem] text-center">{navIndex + 1} / {structDiffs.length}</span>
                            <button
                                onClick={() => navigateDiff(1)}
                                className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                                title="Next diff"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Summary bar ─────────────────────────────────────────── */}
            {(json1.trim() || json2.trim()) && (
                <div className={`flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium ${identical
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                    : !isValid
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                        : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    }`}>
                    {identical ? (
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            JSONs are identical
                        </span>
                    ) : !isValid ? (
                        <span>⚠ One or both inputs contain invalid JSON</span>
                    ) : summary.total === 0 && !json1.trim() ? (
                        <span className="text-gray-400 dark:text-gray-500">Enter JSON in both fields above to compare</span>
                    ) : (
                        <>
                            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                {summary.removed} removed
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                {summary.added} added
                            </span>
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                {summary.changed} changed
                            </span>
                            {summary.total > 0 && (
                                <button
                                    onClick={() => copyToClipboard(
                                        `Structural Diff:\n${structDiffs.map(d =>
                                            `[${d.type.toUpperCase()}] ${d.path}${d.oldValue !== undefined ? `\n  from: ${formatValue(d.oldValue)}` : ""}${d.newValue !== undefined ? `\n  to:   ${formatValue(d.newValue)}` : ""}`
                                        ).join("\n\n")}`,
                                        "Diff report copied!"
                                    )}
                                    className="ml-auto text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                >
                                    Copy Report
                                </button>
                            )}
                        </>
                    )}
                    {tooLarge && (
                        <span className="ml-auto text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2 py-0.5 rounded">
                            Large file — line views disabled
                        </span>
                    )}
                </div>
            )}

            {/* ── Views ───────────────────────────────────────────────── */}
            {viewMode === "structural" && (
                <div className="flex flex-col gap-1.5 h-[420px] md:h-[500px] overflow-y-auto pr-0.5 scroll-smooth">
                    {structDiffs.length === 0 && json1.trim() && json2.trim() && isValid ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <div className="text-5xl mb-3">🎉</div>
                            <p className="font-medium">No differences found</p>
                        </div>
                    ) : !json1.trim() || !json2.trim() ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-2">
                            <div className="text-5xl">🔍</div>
                            <p className="font-medium">Enter JSON in both fields to compare</p>
                            <p className="text-xs">Structural view shows every path that changed</p>
                        </div>
                    ) : (
                        structDiffs.map((diff, idx) => (
                            <div
                                key={idx}
                                ref={el => { structItemRefs.current[idx] = el; }}
                                className={`flex flex-col gap-1 px-3 py-2.5 rounded-xl border text-xs font-mono transition-all duration-150 ${idx === navIndex ? "ring-2 ring-indigo-400 dark:ring-indigo-500" : ""} ${diff.type === "added"
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                    : diff.type === "removed"
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                    }`}
                            >
                                <div className="flex items-center gap-2 flex-wrap">
                                    <DiffBadge type={diff.type} />
                                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold break-all">{diff.path}</span>
                                </div>
                                {diff.type === "changed" && (
                                    <div className="flex flex-col gap-0.5 pl-1">
                                        <span className="text-red-600 dark:text-red-400 line-through break-all">
                                            − {formatValue(diff.oldValue)}
                                        </span>
                                        <span className="text-emerald-600 dark:text-emerald-400 break-all">
                                            + {formatValue(diff.newValue)}
                                        </span>
                                    </div>
                                )}
                                {diff.type === "removed" && (
                                    <span className="text-red-600 dark:text-red-400 pl-1 break-all line-through">
                                        − {formatValue(diff.oldValue)}
                                    </span>
                                )}
                                {diff.type === "added" && (
                                    <span className="text-emerald-600 dark:text-emerald-400 pl-1 break-all">
                                        + {formatValue(diff.newValue)}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {viewMode === "unified" && (
                <div className="h-[420px] md:h-[500px] overflow-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 font-mono text-xs">
                    {tooLarge ? (
                        <div className="flex items-center justify-center h-full text-amber-600 dark:text-amber-400 text-sm">
                            File too large for line diff view — use Structural view instead
                        </div>
                    ) : !json1.trim() || !json2.trim() ? (
                        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            Enter JSON in both fields
                        </div>
                    ) : (
                        <div>
                            {(() => {
                                let lineNo1 = 1, lineNo2 = 1;
                                return lineDiffs.map((part, pi) => {
                                    const lines = splitLines(part.value);
                                    return lines.map((line, li) => {
                                        const prefix = part.added ? "+" : part.removed ? "−" : " ";
                                        const bg = part.added
                                            ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-800 dark:text-emerald-300"
                                            : part.removed
                                                ? "bg-red-50 dark:bg-red-900/25 text-red-800 dark:text-red-300"
                                                : "text-gray-600 dark:text-gray-400";
                                        const lnLeft = part.removed ? lineNo1++ : !part.added ? lineNo1++ : null;
                                        const lnRight = part.added ? lineNo2++ : !part.removed ? lineNo2++ : null;
                                        return (
                                            <div key={`${pi}-${li}`} className={`flex leading-5 ${bg}`}>
                                                <span className="w-9 shrink-0 text-right pr-1.5 text-[10px] text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-600/50">{lnLeft ?? ""}</span>
                                                <span className="w-9 shrink-0 text-right pr-1.5 text-[10px] text-gray-400 dark:text-gray-500 select-none border-r border-gray-200 dark:border-gray-600/50">{lnRight ?? ""}</span>
                                                <span className={`px-1.5 w-4 shrink-0 font-bold ${part.added ? "text-emerald-500" : part.removed ? "text-red-500" : "text-gray-300"}`}>{prefix}</span>
                                                <span className="px-1 whitespace-pre overflow-visible">{line}</span>
                                            </div>
                                        );
                                    });
                                });
                            })()}
                        </div>
                    )}
                </div>
            )}

            {viewMode === "sidebyside" && (
                <div className="h-[420px] md:h-[500px]">
                    {tooLarge ? (
                        <div className="flex items-center justify-center h-full text-amber-600 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-700 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                            File too large for side-by-side view — use Structural view instead
                        </div>
                    ) : !json1.trim() || !json2.trim() ? (
                        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600 rounded-xl">
                            Enter JSON in both fields
                        </div>
                    ) : (
                        <div className="flex gap-2 h-full">
                            <SidePanel
                                lines={sideBySide.leftLines}
                                label="JSON 1 (original)"
                                color="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                                scrollRef={leftScrollRef}
                                onScroll={syncLeftScroll}
                            />
                            <SidePanel
                                lines={sideBySide.rightLines}
                                label="JSON 2 (modified)"
                                color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                scrollRef={rightScrollRef}
                                onScroll={syncRightScroll}
                            />
                        </div>
                    )}
                </div>
            )}

            {viewMode === "tree" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[420px] md:h-[500px]">
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold px-3 py-1.5 rounded-t-xl border border-b-0 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">JSON 1 — Tree</div>
                        <div className="flex-1 min-h-0 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-b-xl rounded-tr-xl overflow-auto">
                            {json1.trim() ? <JSONTreeViewer json={json1} /> : (
                                <div className="text-gray-400 dark:text-gray-500 text-center mt-12 text-sm">No JSON 1 data</div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold px-3 py-1.5 rounded-t-xl border border-b-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700">JSON 2 — Tree</div>
                        <div className="flex-1 min-h-0 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-b-xl rounded-tr-xl overflow-auto">
                            {json2.trim() ? <JSONTreeViewer json={json2} /> : (
                                <div className="text-gray-400 dark:text-gray-500 text-center mt-12 text-sm">No JSON 2 data</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
